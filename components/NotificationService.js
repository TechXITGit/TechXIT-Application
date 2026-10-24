import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
    collection,
    onSnapshot,
    query,
    where,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    getDocs,
    updateDoc,
} from 'firebase/firestore';

const STORAGE_KEY_READ_IDS = '@techx_read_notification_ids';
const STORAGE_KEY_CLEARED_IDS = '@techx_cleared_notification_ids';

// Local storage helper for read and cleared notifications
const safeStorage = {
    getItem: async (key) => {
        try {
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(key);
            }
            if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
                return await AsyncStorage.getItem(key);
            }
        } catch (e) {}
        return null;
    },
    setItem: async (key, val) => {
        try {
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, val);
                return;
            }
            if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
                await AsyncStorage.setItem(key, val);
            }
        } catch (e) {}
    },
};

/**
 * Format relative time (e.g., 'Just now', '5m ago', '2h ago', 'Yesterday')
 */
export const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    let timeMs = 0;
    if (timestamp.seconds) {
        timeMs = timestamp.seconds * 1000;
    } else if (typeof timestamp.toMillis === 'function') {
        timeMs = timestamp.toMillis();
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        const d = new Date(timestamp).getTime();
        if (!isNaN(d)) timeMs = d;
    }
    if (!timeMs) return 'Recently';

    const diff = Math.floor((Date.now() - timeMs) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(timeMs).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

/**
 * Push notification registration stub (avoids Expo Go SDK 53+ incompatibility)
 */
export const registerForPushNotificationsAsync = async () => null;

/**
 * Send push message to an Expo push token via Expo Push API
 */
const sendPushToToken = async (pushToken, title, message, data = {}) => {
    if (!pushToken || typeof pushToken !== 'string') return;
    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: pushToken,
                sound: 'default',
                title,
                body: message,
                data,
                priority: 'high',
                channelId: 'default',
            }),
        });
    } catch (err) {
        console.log('Push dispatch note:', err.message);
    }
};

/**
 * Send a notification (Saves to Firestore AND dispatches Mobile Push Notification)
 */
export const sendNotification = async ({
    title,
    message,
    type = 'general', // 'project' | 'invoice' | 'payslip' | 'staff' | 'general'
    role = 'all', // 'admin' | 'employee' | 'client' | 'all'
    userId = null,
    userEmail = null,
    targetScreen = null,
    targetParams = null,
}) => {
    try {
        // 1. Save to Firestore notifications collection for in-app bell list
        await addDoc(collection(db, 'notifications'), {
            title,
            message,
            type,
            role,
            userId,
            userEmail: userEmail || null,
            targetScreen,
            targetParams: targetParams || null,
            read: false,
            createdAt: serverTimestamp(),
        });

        // 2. Dispatch Mobile Push Notification via Push Token
        if (userId) {
            try {
                const userSnap = await getDoc(doc(db, 'users', userId));
                if (userSnap.exists()) {
                    const pushToken = userSnap.data()?.pushToken;
                    if (pushToken) {
                        await sendPushToToken(pushToken, title, message, { targetScreen, targetParams });
                    }
                }
            } catch (e) {}
        } else if (role && role !== 'all') {
            try {
                // Broadcast push to role users
                const roleQuery = query(collection(db, 'users'), where('role', '==', role));
                const snap = await getDocs(roleQuery);
                snap.docs.forEach((d) => {
                    const tok = d.data()?.pushToken;
                    if (tok) {
                        sendPushToToken(tok, title, message, { targetScreen, targetParams });
                    }
                });
            } catch (e) {}
        }
    } catch (e) {
        console.log('Notification send note:', e.message);
    }
};

/**
 * React Hook for Real-time In-App Notifications
 */
export const useNotifications = (userRole = 'client') => {
    const [notifications, setNotifications] = useState([]);
    const [readIds, setReadIds] = useState(new Set());
    const [clearedIds, setClearedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [authUser, setAuthUser] = useState(auth.currentUser);

    // 0. Listen to live Firebase Auth state changes
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (u) => {
            setAuthUser(u);
        });
        return () => unsubAuth();
    }, []);

    // 1. Load local read & cleared state from AsyncStorage
    useEffect(() => {
        const loadStoredStatus = async () => {
            try {
                const storedRead = await safeStorage.getItem(STORAGE_KEY_READ_IDS);
                if (storedRead) {
                    setReadIds(new Set(JSON.parse(storedRead)));
                }
                const storedCleared = await safeStorage.getItem(STORAGE_KEY_CLEARED_IDS);
                if (storedCleared) {
                    setClearedIds(new Set(JSON.parse(storedCleared)));
                }
            } catch (e) {
                console.log('AsyncStorage notification load note:', e.message);
            }
        };
        loadStoredStatus();
    }, []);

    // 2. Real-time Firestore Listeners
    useEffect(() => {
        const currentUser = authUser || auth.currentUser;
        const currentUid = currentUser?.uid;
        const currentEmail = currentUser?.email;

        let firestoreNotifications = [];
        let synthesizedActivity = [];
        let clientReqActivity = [];
        let clientInvoiceActivity = [];
        let clientProjectActivity = [];

        const mergeAllNotifications = () => {
            const map = new Map();

            // 1. Firestore direct notifications
            firestoreNotifications.forEach((n) => {
                if (n && n.id && !clearedIds.has(n.id)) {
                    map.set(n.id, {
                        ...n,
                        isRead: n.read || readIds.has(n.id),
                    });
                }
            });

            // 2. Synthesized live activities from app events
            const combinedActivity = [
                ...synthesizedActivity,
                ...clientReqActivity,
                ...clientInvoiceActivity,
                ...clientProjectActivity,
            ];

            combinedActivity.forEach((act) => {
                if (act && act.id && !clearedIds.has(act.id)) {
                    if (!map.has(act.id)) {
                        map.set(act.id, {
                            ...act,
                            isRead: readIds.has(act.id),
                        });
                    }
                }
            });

            const all = Array.from(map.values());

            // Add client welcome notification if list is empty
            if (all.length === 0 && (userRole === 'client' || !userRole)) {
                all.push({
                    id: `welcome_client_${currentUid || 'portal'}`,
                    title: 'Welcome to TechX IT Services 👋',
                    message: 'Explore our web, mobile, marketing, and creative services. Request a quote to get started!',
                    type: 'general',
                    role: 'client',
                    targetScreen: 'Services',
                    isRead: readIds.has(`welcome_client_${currentUid || 'portal'}`),
                    createdAt: { seconds: Math.floor(Date.now() / 1000) },
                });
            }

            // Sort newest first
            const getTime = (item) => {
                if (!item) return 0;
                if (item.createdAt?.seconds) return item.createdAt.seconds * 1000;
                if (typeof item.createdAt?.toMillis === 'function') return item.createdAt.toMillis();
                if (typeof item.createdAt === 'string' || typeof item.createdAt === 'number') {
                    const d = new Date(item.createdAt).getTime();
                    if (!isNaN(d)) return d;
                }
                return 0;
            };

            all.sort((a, b) => getTime(b) - getTime(a));
            setNotifications(all);
            setLoading(false);
        };

        // --- LISTENER A: Direct 'notifications' collection ---
        const unsubDirect = onSnapshot(
            collection(db, 'notifications'),
            (snapshot) => {
                const list = [];
                snapshot.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    const isForUser =
                        !data.userId ||
                        data.userId === currentUid ||
                        (currentEmail && data.userEmail === currentEmail);
                    const isForRole =
                        !data.role ||
                        data.role === 'all' ||
                        data.role === userRole;

                    if (isForUser && isForRole) {
                        list.push({ id: docSnap.id, ...data });
                    }
                });
                firestoreNotifications = list;
                mergeAllNotifications();
            },
            (err) => {
                console.log('Notifications direct listener note:', err.message);
                mergeAllNotifications();
            }
        );

        // --- ROLE-BASED REAL-TIME LISTENERS ---
        let unsubActivityA = () => {};
        let unsubActivityB = () => {};
        let unsubActivityC = () => {};

        if (userRole === 'admin') {
            // ADMIN: Listen to pending requests
            unsubActivityA = onSnapshot(
                collection(db, 'requests'),
                (snapshot) => {
                    const reqNotifs = [];
                    snapshot.docs.forEach((d) => {
                        const r = d.data();
                        if (r.status === 'pending') {
                            reqNotifs.push({
                                id: `req_notif_${d.id}`,
                                title: 'New Proposal Request 📋',
                                message: `${r.clientName || 'Client'} requested ${r.serviceName || 'Service'} (Budget: ₹${Number(r.budget || 0).toLocaleString('en-IN')})`,
                                type: 'project',
                                role: 'admin',
                                targetScreen: 'AdminClients',
                                targetParams: { targetRequestId: d.id },
                                createdAt: r.createdAt,
                            });
                        }
                    });
                    synthesizedActivity = reqNotifs;
                    mergeAllNotifications();
                },
                (e) => {
                    console.log('Admin notif sync note:', e.message);
                    mergeAllNotifications();
                }
            );
        } else if (userRole === 'employee') {
            // EMPLOYEE: Listen to assigned projects
            unsubActivityA = onSnapshot(
                collection(db, 'projects'),
                (snapshot) => {
                    const empNotifs = [];
                    snapshot.docs.forEach((d) => {
                        const p = d.data();
                        if (currentUid && p.assignedEmployeeUid === currentUid) {
                            empNotifs.push({
                                id: `proj_emp_notif_${d.id}`,
                                title: 'Project Assigned To You 🚀',
                                message: `You have been assigned to "${p.title || p.serviceName || 'Client Project'}". Review & accept in dashboard.`,
                                type: 'project',
                                role: 'employee',
                                targetScreen: 'EmployeeProjects',
                                createdAt: p.assignedAt || p.createdAt,
                            });
                        }
                    });
                    synthesizedActivity = empNotifs;
                    mergeAllNotifications();
                },
                (e) => {
                    console.log('Employee notif sync note:', e.message);
                    mergeAllNotifications();
                }
            );
        } else {
            // CLIENT LISTENERS:
            // 1. Client Requests: pending, approved, assigned
            unsubActivityA = onSnapshot(
                collection(db, 'requests'),
                (snapshot) => {
                    const clientNotifs = [];
                    snapshot.docs.forEach((d) => {
                        const r = d.data();
                        const isMatch =
                            (currentUid && r.clientUid === currentUid) ||
                            (currentEmail && r.clientEmail === currentEmail);

                        if (isMatch) {
                            if (r.status === 'assigned' || r.assignedEmployeeName) {
                                clientNotifs.push({
                                    id: `client_req_assigned_${d.id}`,
                                    title: 'Team Developer Assigned 🚀',
                                    message: `${r.assignedEmployeeName || 'A developer'} (${r.assignedEmployeeDesignation || 'Tech Team'}) has been assigned to "${r.serviceName || 'your project'}"!`,
                                    type: 'project',
                                    role: 'client',
                                    targetScreen: 'Services',
                                    createdAt: r.assignedAt || r.updatedAt || r.createdAt,
                                });
                            } else if (r.status === 'approved') {
                                clientNotifs.push({
                                    id: `client_req_approved_${d.id}`,
                                    title: 'Proposal Approved! 🎉',
                                    message: `Your proposal for "${r.serviceName || 'Service'}" has been approved. A developer is being assigned.`,
                                    type: 'project',
                                    role: 'client',
                                    targetScreen: 'Services',
                                    createdAt: r.updatedAt || r.createdAt,
                                });
                            } else if (r.status === 'pending') {
                                clientNotifs.push({
                                    id: `client_req_pending_${d.id}`,
                                    title: 'Proposal Submitted 📋',
                                    message: `We received your quote request for "${r.serviceName || 'Service'}" (Budget: ₹${Number(r.budget || 0).toLocaleString('en-IN')}). Our team is reviewing it.`,
                                    type: 'project',
                                    role: 'client',
                                    targetScreen: 'Services',
                                    createdAt: r.createdAt,
                                });
                            }
                        }
                    });
                    clientReqActivity = clientNotifs;
                    mergeAllNotifications();
                },
                (e) => {
                    console.log('Client req notif note:', e.message);
                    mergeAllNotifications();
                }
            );

            // 2. Client Invoices
            unsubActivityB = onSnapshot(
                collection(db, 'invoices'),
                (snapshot) => {
                    const invNotifs = [];
                    snapshot.docs.forEach((d) => {
                        const inv = d.data();
                        const isMatch =
                            (currentUid && inv.clientUid === currentUid) ||
                            (currentEmail && inv.clientEmail === currentEmail);

                        if (isMatch) {
                            invNotifs.push({
                                id: `client_inv_${d.id}`,
                                title: 'New Milestone Invoice Issued 📄',
                                message: `Invoice #${inv.invoiceNumber} for "${inv.projectTitle || 'Project'}" (₹${Number(inv.totalAmount || 0).toLocaleString('en-IN')}) has been generated.`,
                                type: 'invoice',
                                role: 'client',
                                targetScreen: 'Invoice',
                                targetParams: { invoice: { id: d.id, ...inv } },
                                createdAt: inv.createdAt,
                            });
                        }
                    });
                    clientInvoiceActivity = invNotifs;
                    mergeAllNotifications();
                },
                (e) => {
                    console.log('Client invoices sync note:', e.message);
                    mergeAllNotifications();
                }
            );

            // 3. Client Projects (dual-stored invoices & status)
            unsubActivityC = onSnapshot(
                collection(db, 'projects'),
                (snapshot) => {
                    const projNotifs = [];
                    snapshot.docs.forEach((d) => {
                        const p = d.data();
                        const isMatch =
                            (currentUid && p.clientUid === currentUid) ||
                            (currentEmail && p.clientEmail === currentEmail);

                        if (isMatch && p.latestInvoice) {
                            const inv = p.latestInvoice;
                            projNotifs.push({
                                id: `client_proj_inv_${d.id}_${inv.invoiceNumber || '1'}`,
                                title: 'New Milestone Invoice Issued 📄',
                                message: `Invoice #${inv.invoiceNumber} for "${inv.projectTitle || p.title}" (₹${Number(inv.totalAmount || 0).toLocaleString('en-IN')}) has been issued.`,
                                type: 'invoice',
                                role: 'client',
                                targetScreen: 'Invoice',
                                targetParams: { invoice: inv },
                                createdAt: inv.createdAt || p.updatedAt,
                            });
                        }
                    });
                    clientProjectActivity = projNotifs;
                    mergeAllNotifications();
                },
                (e) => {
                    console.log('Client projects sync note:', e.message);
                    mergeAllNotifications();
                }
            );
        }

        return () => {
            unsubDirect();
            unsubActivityA();
            unsubActivityB();
            unsubActivityC();
        };
    }, [authUser?.uid, authUser?.email, userRole, readIds, clearedIds]);

    // Mark single notification as read
    const markAsRead = useCallback(async (id) => {
        setReadIds((prev) => {
            const next = new Set(prev).add(id);
            safeStorage.setItem(STORAGE_KEY_READ_IDS, JSON.stringify(Array.from(next))).catch(() => {});
            return next;
        });

        if (!id.startsWith('req_notif_') && !id.startsWith('proj_emp_notif_') && !id.startsWith('client_req_notif_')) {
            try {
                await updateDoc(doc(db, 'notifications', id), { read: true });
            } catch (e) {}
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        const allIds = notifications.map((n) => n.id);
        const nextSet = new Set(allIds);
        setReadIds(nextSet);
        try {
            await safeStorage.setItem(STORAGE_KEY_READ_IDS, JSON.stringify(Array.from(nextSet)));
        } catch (e) {}
    }, [notifications]);

    // Clear all notifications
    const clearAll = useCallback(async () => {
        const allIds = notifications.map((n) => n.id);
        const nextSet = new Set(allIds);
        setClearedIds(nextSet);
        try {
            await safeStorage.setItem(STORAGE_KEY_CLEARED_IDS, JSON.stringify(Array.from(nextSet)));
        } catch (e) {}
    }, [notifications]);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        clearAll,
    };
};

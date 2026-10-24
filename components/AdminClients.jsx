import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    where,
    doc,
    updateDoc,
    setDoc,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import {
    ArrowLeft,
    UserCheck,
    User,
    Search,
    X,
    FileText,
    Clock,
    CheckCircle2,
    Calendar,
    ChevronRight,
    ExternalLink,
} from 'lucide-react-native';
import { sendNotification } from './NotificationService';

const AdminClients = ({ navigation }) => {
    const [requests, setRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'ASSIGNED'

    // Modals
    const [selectedDetailRequest, setSelectedDetailRequest] = useState(null);
    const [selectedAssignRequest, setSelectedAssignRequest] = useState(null);
    const [assigningId, setAssigningId] = useState(null);
    const [employeeSearch, setEmployeeSearch] = useState('');

    // ============================================
    // REAL-TIME CLIENT REQUESTS
    // ============================================
    useEffect(() => {
        const requestsRef = collection(db, 'requests');
        const q = query(requestsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                }));
                setRequests(data);
                setLoading(false);
                setRefreshing(false);
            },
            (error) => {
                console.log('Admin requests fallback query note:', error.message);
                // Fallback without orderBy if index error
                const unsubFallback = onSnapshot(collection(db, 'requests'), (snap) => {
                    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                    data.sort((a, b) => {
                        const tA = a.createdAt?.seconds || 0;
                        const tB = b.createdAt?.seconds || 0;
                        return tB - tA;
                    });
                    setRequests(data);
                    setLoading(false);
                    setRefreshing(false);
                });
            }
        );

        return () => unsubscribe();
    }, []);

    // ============================================
    // REAL-TIME EMPLOYEES
    // ============================================
    useEffect(() => {
        const q = query(collection(db, 'users'), where('role', '==', 'employee'));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    uid: docSnap.id,
                    ...docSnap.data(),
                }));

                // Sort: Approved first, then alphabetically
                data.sort((a, b) => {
                    if (Boolean(a.approved) === Boolean(b.approved)) {
                        return (a.name || '').localeCompare(b.name || '');
                    }
                    return a.approved ? -1 : 1;
                });

                setEmployees(data);
            },
            (error) => {
                console.log('AdminClients employees fetch note:', error.message);
            }
        );

        return () => unsubscribe();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 600);
    }, []);

    // ============================================
    // APPROVE / REJECT REQUEST
    // ============================================
    const updateStatus = async (item, newStatus) => {
        if (updatingId === item.id) return;
        setUpdatingId(item.id);

        try {
            if (newStatus === 'rejected') {
                await updateDoc(doc(db, 'requests', item.id), {
                    status: 'rejected',
                });
                Alert.alert('Request Rejected', 'The client request has been marked as rejected.');
                return;
            }

            // APPROVE: Update request and sync to 'projects' collection
            await updateDoc(doc(db, 'requests', item.id), {
                status: 'approved',
            });

            const cleanProjectData = {
                requestId: item.id,
                serviceId: item.serviceId || '',
                title: item.serviceName || 'Client Project',
                serviceName: item.serviceName || 'Client Project',
                description: item.notes || 'No additional requirements provided.',
                notes: item.notes || '',
                clientUid: item.clientUid || '',
                clientName: item.clientName || 'Valued Client',
                clientEmail: item.clientEmail || '',
                budget: String(item.budget || '0'),
                status: 'approved',
                assignedEmployeeUid: item.assignedEmployeeUid || null,
                assignedEmployeeName: item.assignedEmployeeName || '',
                assignedEmployeeEmail: item.assignedEmployeeEmail || '',
                assignedEmployeeDesignation: item.assignedEmployeeDesignation || '',
                employeeStatus: item.employeeStatus || 'pending',
                createdAt: item.createdAt || serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(db, 'projects', item.id), cleanProjectData, { merge: true });

            // In-app notification to Client
            if (item.clientUid) {
                sendNotification({
                    title: 'Proposal Approved! 🎉',
                    message: `Your project request for "${cleanProjectData.title}" has been approved.`,
                    type: 'project',
                    role: 'client',
                    userId: item.clientUid,
                    targetScreen: 'Services',
                });
            }

            Alert.alert(
                'Request Approved! 🎉',
                `"${cleanProjectData.title}" has been approved. You can now assign a developer directly here or in Manage Projects.`,
                [
                    {
                        text: 'Assign Developer Now',
                        onPress: () => setSelectedAssignRequest({ ...item, status: 'approved' }),
                    },
                    { text: 'OK' },
                ]
            );
        } catch (error) {
            console.log('Update request error:', error.message);
            Alert.alert('Error', error.message || 'Could not update request.');
        } finally {
            setUpdatingId(null);
        }
    };

    // ============================================
    // ASSIGN DEVELOPER TO REQUEST
    // ============================================
    const assignDeveloperToRequest = async (request, employee) => {
        if (!request || !employee) return;
        setAssigningId(employee.id);

        try {
            const empUid = employee.id || employee.uid;
            const empName = employee.name || 'Team Member';
            const empEmail = employee.email || '';
            const empDesignation = employee.designation || employee.role || 'Developer';

            const assignPayload = {
                status: 'assigned',
                assignedEmployeeUid: empUid,
                assignedEmployeeName: empName,
                assignedEmployeeEmail: empEmail,
                assignedEmployeeDesignation: empDesignation,
                employeeStatus: 'pending',
                assignedAt: new Date().toISOString(),
            };

            // 1. Update request document
            await updateDoc(doc(db, 'requests', request.id), assignPayload);

            // 2. Update or create clean document in 'projects' collection
            const cleanProjectData = {
                requestId: request.id,
                serviceId: request.serviceId || '',
                title: request.serviceName || 'Client Project',
                serviceName: request.serviceName || 'Client Project',
                description: request.notes || 'No requirements provided.',
                notes: request.notes || '',
                clientUid: request.clientUid || '',
                clientName: request.clientName || 'Valued Client',
                clientEmail: request.clientEmail || '',
                budget: String(request.budget || '0'),
                ...assignPayload,
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(db, 'projects', request.id), cleanProjectData, { merge: true });

            // In-app notification to Employee
            sendNotification({
                title: 'New Project Assigned 🚀',
                message: `You have been assigned to "${cleanProjectData.title}". Please review and accept in your dashboard.`,
                type: 'project',
                role: 'employee',
                userId: empUid,
                targetScreen: 'EmployeeProjects',
            });

            // In-app notification to Client
            if (request.clientUid) {
                sendNotification({
                    title: 'Team Developer Assigned 🚀',
                    message: `${empName} (${empDesignation}) has been assigned to work on your "${cleanProjectData.title}" project!`,
                    type: 'project',
                    role: 'client',
                    userId: request.clientUid,
                    userEmail: request.clientEmail || null,
                    targetScreen: 'Services',
                });
            }

            setSelectedAssignRequest(null);
            if (selectedDetailRequest) {
                setSelectedDetailRequest({
                    ...selectedDetailRequest,
                    ...assignPayload,
                });
            }

            Alert.alert(
                'Developer Assigned! 🚀',
                `${empName} (${empDesignation}) has been assigned to "${cleanProjectData.title}". The developer can now review this assignment in their dashboard.`
            );
        } catch (error) {
            console.log('Assign developer error:', error);
            Alert.alert('Error', 'Could not assign developer: ' + error.message);
        } finally {
            setAssigningId(null);
        }
    };

    const getInitials = (name = '') => {
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length === 0) return 'TX';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Filter requests
    const filteredRequests = useMemo(() => {
        return requests.filter((req) => {
            const q = searchQuery.toLowerCase();
            const matchesQuery =
                (req.serviceName || '').toLowerCase().includes(q) ||
                (req.clientName || '').toLowerCase().includes(q) ||
                (req.clientEmail || '').toLowerCase().includes(q) ||
                (req.assignedEmployeeName || '').toLowerCase().includes(q);

            const st = req.status || 'pending';
            if (filterStatus === 'PENDING') return matchesQuery && st === 'pending';
            if (filterStatus === 'APPROVED') return matchesQuery && (st === 'approved' && !req.assignedEmployeeName);
            if (filterStatus === 'ASSIGNED') return matchesQuery && (st === 'assigned' || Boolean(req.assignedEmployeeName));
            return matchesQuery;
        });
    }, [requests, searchQuery, filterStatus]);

    // Filter employees for modal
    const modalFilteredEmployees = useMemo(() => {
        return employees.filter((emp) => {
            const q = employeeSearch.toLowerCase();
            return (
                (emp.name || '').toLowerCase().includes(q) ||
                (emp.email || '').toLowerCase().includes(q) ||
                (emp.designation || '').toLowerCase().includes(q) ||
                (Array.isArray(emp.skills) && emp.skills.join(' ').toLowerCase().includes(q))
            );
        });
    }, [employees, employeeSearch]);

    // Render Employee in Assign Sheet
    const renderModalEmployee = ({ item }) => {
        const isAssigning = assigningId === item.id;
        const skillsText = Array.isArray(item.skills)
            ? item.skills.slice(0, 3).join(' • ')
            : item.skills || 'Tech X Staff';

        return (
            <View style={styles.modalEmpCard}>
                <View style={styles.modalEmpAvatar}>
                    <Text style={styles.modalEmpAvatarText}>{getInitials(item.name)}</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.modalEmpName}>{item.name}</Text>
                        <View style={[styles.apprBadge, item.approved ? styles.apprBadgeOk : styles.apprBadgePending]}>
                            <Text style={[styles.apprBadgeText, item.approved ? styles.apprTextOk : styles.apprTextPending]}>
                                {item.approved ? 'Approved' : 'Pending'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.modalEmpRole}>{item.designation || item.role || 'Developer'}</Text>
                    <Text style={styles.modalEmpSkills} numberOfLines={1}>{skillsText}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.modalAssignBtn, isAssigning && styles.modalAssignBtnDisabled]}
                    onPress={() => assignDeveloperToRequest(selectedAssignRequest, item)}
                    disabled={isAssigning}
                    activeOpacity={0.8}
                >
                    {isAssigning ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                        <Text style={styles.modalAssignBtnText}>Assign</Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    // Render Request Card
    const renderItem = ({ item }) => {
        const status = item.status || 'pending';
        const isAssigned = status === 'assigned' || Boolean(item.assignedEmployeeName);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => setSelectedDetailRequest(item)}
                activeOpacity={0.9}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.titleBox}>
                        <Text style={styles.serviceName}>{item.serviceName || 'Service Request'}</Text>
                        <Text style={styles.clientName}>Client: {item.clientName || 'Valued Client'}</Text>
                    </View>

                    <View
                        style={[
                            styles.statusBadge,
                            status === 'pending'
                                ? styles.pendingBadge
                                : isAssigned
                                ? styles.assignedBadge
                                : status === 'approved'
                                ? styles.approvedBadge
                                : styles.rejectedBadge,
                        ]}
                    >
                        <Text
                            style={[
                                styles.statusText,
                                status === 'pending'
                                    ? styles.pendingText
                                    : isAssigned
                                    ? styles.assignedText
                                    : status === 'approved'
                                    ? styles.approvedText
                                    : styles.rejectedText,
                            ]}
                        >
                            {status === 'pending'
                                ? 'Needs Review'
                                : isAssigned
                                ? 'Assigned 🚀'
                                : status === 'approved'
                                ? 'Approved ✅'
                                : 'Rejected'}
                        </Text>
                    </View>
                </View>

                {/* Info Block */}
                <View style={styles.infoSection}>
                    <View style={styles.infoRowGrid}>
                        <Text style={styles.infoPill}>
                            <Text style={styles.label}>Email: </Text>
                            {item.clientEmail || 'N/A'}
                        </Text>
                        <Text style={[styles.infoPill, styles.budgetPill]}>
                            <Text style={styles.label}>Budget: </Text>
                            ₹{Number(item.budget || 0).toLocaleString('en-IN')}
                        </Text>
                    </View>

                    {item.notes ? (
                        <Text style={styles.notesPreview} numberOfLines={2}>
                            <Text style={styles.label}>Scope: </Text>
                            {item.notes}
                        </Text>
                    ) : null}
                </View>

                {/* Assigned Developer Preview (if assigned) */}
                {isAssigned && item.assignedEmployeeName ? (
                    <View style={styles.assignedBadgeBox}>
                        <View style={styles.assignedAvatar}>
                            <Text style={styles.assignedAvatarText}>
                                {getInitials(item.assignedEmployeeName)}
                            </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.assignedBadgeLabel}>ASSIGNED DEVELOPER</Text>
                            <Text style={styles.assignedBadgeName}>{item.assignedEmployeeName}</Text>
                            <Text style={styles.assignedBadgeSub}>
                                {item.assignedEmployeeDesignation || 'Developer'} • {item.employeeStatus === 'accepted' ? 'Accepted ✅' : 'Pending Response ⏳'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.changeDevBtn}
                            onPress={(e) => {
                                e?.stopPropagation?.();
                                setSelectedAssignRequest(item);
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.changeDevBtnText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* Direct Action Buttons */}
                <View style={styles.cardActionsContainer}>
                    {status === 'pending' ? (
                        <View style={styles.pendingActionsRow}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.rejectBtn]}
                                disabled={updatingId === item.id}
                                onPress={(e) => {
                                    e?.stopPropagation?.();
                                    updateStatus(item, 'rejected');
                                }}
                            >
                                {updatingId === item.id ? (
                                    <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                    <Text style={styles.actionText}>Reject</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, styles.approveBtn]}
                                disabled={updatingId === item.id}
                                onPress={(e) => {
                                    e?.stopPropagation?.();
                                    updateStatus(item, 'approved');
                                }}
                            >
                                {updatingId === item.id ? (
                                    <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                    <Text style={styles.actionText}>Approve Request</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, styles.approveAssignBtn]}
                                onPress={(e) => {
                                    e?.stopPropagation?.();
                                    setSelectedAssignRequest(item);
                                }}
                            >
                                <UserCheck size={14} color="#ffffff" />
                                <Text style={styles.actionText}>Assign Dev</Text>
                            </TouchableOpacity>
                        </View>
                    ) : !isAssigned ? (
                        <View style={styles.approvedActionsRow}>
                            <TouchableOpacity
                                style={styles.assignPrimaryBtn}
                                onPress={(e) => {
                                    e?.stopPropagation?.();
                                    setSelectedAssignRequest(item);
                                }}
                                activeOpacity={0.85}
                            >
                                <UserCheck size={16} color="#ffffff" />
                                <Text style={styles.assignPrimaryBtnText}>Assign Team Developer</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.viewProjectsBtn}
                                onPress={(e) => {
                                    e?.stopPropagation?.();
                                    navigation.navigate('AdminProjects', {
                                        targetRequestId: item.id,
                                        autoOpenAssign: false,
                                    });
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.viewProjectsBtnText}>Manage in Projects →</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.assignedActionsRow}>
                            <TouchableOpacity
                                style={styles.viewProjectsBtnFull}
                                onPress={(e) => {
                                    e?.stopPropagation?.();
                                    navigation.navigate('AdminProjects', {
                                        targetRequestId: item.id,
                                        autoOpenAssign: false,
                                    });
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.viewProjectsBtnText}>Open in Manage Projects →</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.invoiceQuickBtn}
                                onPress={(e) => {
                                    e?.stopPropagation?.();
                                    navigation.navigate('AdminInvoices', { preselectedProject: item });
                                }}
                                activeOpacity={0.8}
                            >
                                <FileText size={13} color="#0284c7" />
                                <Text style={styles.invoiceQuickBtnText}>Invoice</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                        if (navigation.canGoBack()) navigation.goBack();
                        else navigation.navigate('Home');
                    }}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={20} color="#0f172a" />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                    <Text style={styles.topBarTitle}>Client Requests</Text>
                    <Text style={styles.topBarSubtitle}>Review incoming proposals & assign team</Text>
                </View>

                <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{requests.length}</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarWrap}>
                <Search size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by service, client name, or email..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                        <X size={16} color="#94a3b8" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
                {['ALL', 'PENDING', 'APPROVED', 'ASSIGNED'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.filterTab, filterStatus === tab && styles.filterTabActive]}
                        onPress={() => setFilterStatus(tab)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.filterTabText, filterStatus === tab && styles.filterTabTextActive]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Requests List */}
            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#0284c7" />
                    <Text style={styles.loadingText}>Loading requests...</Text>
                </View>
            ) : filteredRequests.length === 0 ? (
                <View style={styles.centerBox}>
                    <Text style={styles.emptyTitle}>No Requests Found</Text>
                    <Text style={styles.emptyText}>
                        {searchQuery
                            ? `No requests matched "${searchQuery}".`
                            : 'Incoming client service requests will appear here in real time.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredRequests}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#0284c7']}
                            tintColor="#0284c7"
                        />
                    }
                />
            )}

            {/* ========================================================= */}
            {/* 1. REQUEST FULL DETAILS MODAL */}
            {/* ========================================================= */}
            <Modal
                visible={Boolean(selectedDetailRequest)}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedDetailRequest(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.detailModalSheet}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.detailBadge}>PROPOSAL SPECIFICATION</Text>
                                <Text style={styles.modalTitle}>
                                    {selectedDetailRequest?.serviceName || 'Client Request'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setSelectedDetailRequest(null)}
                                activeOpacity={0.7}
                            >
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
                            {/* Client & Budget */}
                            <View style={styles.specSection}>
                                <View style={styles.specRow}>
                                    <View style={styles.specCol}>
                                        <Text style={styles.specLabel}>CLIENT NAME</Text>
                                        <Text style={styles.specVal}>{selectedDetailRequest?.clientName || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.specCol}>
                                        <Text style={styles.specLabel}>ESTIMATED BUDGET</Text>
                                        <Text style={[styles.specVal, { color: '#15803d' }]}>
                                            ₹{Number(selectedDetailRequest?.budget || 0).toLocaleString('en-IN')}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.specRow, { marginTop: 12 }]}>
                                    <View style={styles.specCol}>
                                        <Text style={styles.specLabel}>CLIENT EMAIL</Text>
                                        <Text style={styles.specVal}>{selectedDetailRequest?.clientEmail || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.specCol}>
                                        <Text style={styles.specLabel}>STATUS</Text>
                                        <Text style={[styles.specVal, { textTransform: 'capitalize' }]}>
                                            {selectedDetailRequest?.status || 'Pending'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Requirements Notes */}
                            <View style={styles.notesBlock}>
                                <Text style={styles.notesTitle}>Project Requirements & Scope</Text>
                                <Text style={styles.notesContent}>
                                    {selectedDetailRequest?.notes || 'No additional requirements provided by client.'}
                                </Text>
                            </View>

                            {/* Assigned Developer Info */}
                            {selectedDetailRequest?.assignedEmployeeName ? (
                                <View style={styles.assignedSectionBox}>
                                    <Text style={styles.assignedSectionTitle}>Assigned Team Developer</Text>
                                    <View style={styles.assignedBadgeBox}>
                                        <View style={styles.assignedAvatar}>
                                            <Text style={styles.assignedAvatarText}>
                                                {getInitials(selectedDetailRequest.assignedEmployeeName)}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={styles.assignedBadgeName}>
                                                {selectedDetailRequest.assignedEmployeeName}
                                            </Text>
                                            <Text style={styles.assignedBadgeSub}>
                                                {selectedDetailRequest.assignedEmployeeDesignation || 'Developer'}
                                            </Text>
                                            <Text style={[styles.assignedBadgeSub, { marginTop: 4, fontWeight: '700' }]}>
                                                Status:{' '}
                                                {selectedDetailRequest.employeeStatus === 'accepted'
                                                    ? 'Accepted ✅'
                                                    : 'Pending Response ⏳'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ) : null}

                            {/* Action Buttons in Modal */}
                            <View style={styles.modalActionButtons}>
                                <TouchableOpacity
                                    style={styles.modalAssignPrimaryBtn}
                                    onPress={() => {
                                        setSelectedAssignRequest(selectedDetailRequest);
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <UserCheck size={18} color="#ffffff" />
                                    <Text style={styles.modalAssignPrimaryBtnText}>
                                        {selectedDetailRequest?.assignedEmployeeName
                                            ? 'Change Assigned Developer'
                                            : 'Assign Team Developer'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalProjectSecondaryBtn}
                                    onPress={() => {
                                        const req = selectedDetailRequest;
                                        setSelectedDetailRequest(null);
                                        navigation.navigate('AdminProjects', {
                                            targetRequestId: req.id,
                                            autoOpenAssign: false,
                                        });
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <ExternalLink size={17} color="#0284c7" />
                                    <Text style={styles.modalProjectSecondaryBtnText}>
                                        Open in Manage Projects
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ========================================================= */}
            {/* 2. ASSIGN DEVELOPER SELECTION MODAL */}
            {/* ========================================================= */}
            <Modal
                visible={Boolean(selectedAssignRequest)}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedAssignRequest(null)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalSheet}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.modalTitle}>Assign Team Developer</Text>
                                <Text style={styles.modalSub} numberOfLines={1}>
                                    Proposal: {selectedAssignRequest?.serviceName || 'Client Request'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setSelectedAssignRequest(null)}
                                activeOpacity={0.7}
                            >
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Employees */}
                        <View style={styles.modalSearchWrap}>
                            <Search size={15} color="#64748b" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder="Search by name, designation, or skill..."
                                placeholderTextColor="#94a3b8"
                                value={employeeSearch}
                                onChangeText={setEmployeeSearch}
                            />
                            {employeeSearch ? (
                                <TouchableOpacity onPress={() => setEmployeeSearch('')} activeOpacity={0.7}>
                                    <X size={15} color="#94a3b8" />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* Employee List */}
                        {modalFilteredEmployees.length === 0 ? (
                            <View style={styles.modalEmptyBox}>
                                <User size={40} color="#cbd5e1" />
                                <Text style={styles.modalEmptyTitle}>No Employees Found</Text>
                                <Text style={styles.modalEmptySub}>
                                    {employeeSearch
                                        ? `No staff matched "${employeeSearch}".`
                                        : 'No employee accounts available. Check the Employees Directory.'}
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={modalFilteredEmployees}
                                renderItem={renderModalEmployee}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28, gap: 10 }}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

export default AdminClients;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backBtn: {
        width: 38,
        height: 38,
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBarTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.4,
    },
    topBarSubtitle: {
        fontSize: 12.5,
        color: '#64748b',
        marginTop: 2,
    },
    countBadge: {
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0284c7',
    },
    searchBarWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginTop: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 44,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: '#0f172a',
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginTop: 10,
        marginBottom: 6,
    },
    filterTab: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    filterTabActive: {
        backgroundColor: '#0284c7',
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
    },
    filterTabTextActive: {
        color: '#ffffff',
    },
    listContent: {
        padding: 16,
        gap: 14,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleBox: {
        flex: 1,
        paddingRight: 10,
    },
    serviceName: {
        fontSize: 16.5,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    clientName: {
        fontSize: 12.5,
        color: '#0284c7',
        fontWeight: '700',
        marginTop: 3,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    pendingBadge: {
        backgroundColor: '#fef3c7',
    },
    approvedBadge: {
        backgroundColor: '#e0f2fe',
    },
    assignedBadge: {
        backgroundColor: '#dcfce7',
    },
    rejectedBadge: {
        backgroundColor: '#fee2e2',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
    },
    pendingText: {
        color: '#b45309',
    },
    approvedText: {
        color: '#0284c7',
    },
    assignedText: {
        color: '#15803d',
    },
    rejectedText: {
        color: '#b91c1c',
    },
    infoSection: {
        marginTop: 12,
    },
    infoRowGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    infoPill: {
        fontSize: 12,
        color: '#475569',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    budgetPill: {
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
        color: '#15803d',
        fontWeight: '700',
    },
    label: {
        fontWeight: '800',
        color: '#0f172a',
    },
    notesPreview: {
        fontSize: 12.5,
        color: '#475569',
        lineHeight: 18,
        marginTop: 2,
    },

    // Assigned Developer Preview
    assignedBadgeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 12,
    },
    assignedAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0284c7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    assignedAvatarText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#ffffff',
    },
    assignedBadgeLabel: {
        fontSize: 9.5,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 0.5,
    },
    assignedBadgeName: {
        fontSize: 13.5,
        fontWeight: '800',
        color: '#0f172a',
        marginTop: 1,
    },
    assignedBadgeSub: {
        fontSize: 11,
        color: '#475569',
        marginTop: 2,
    },
    changeDevBtn: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 6,
    },
    changeDevBtnText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: '#475569',
    },

    // Actions
    cardActionsContainer: {
        marginTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 12,
    },
    pendingActionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    rejectBtn: {
        backgroundColor: '#ef4444',
        flex: 0.8,
    },
    approveBtn: {
        backgroundColor: '#0284c7',
        flex: 1.2,
    },
    approveAssignBtn: {
        backgroundColor: '#0f766e',
        flex: 1.1,
    },
    actionText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '800',
    },
    approvedActionsRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    assignPrimaryBtn: {
        flex: 1.2,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#0284c7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    assignPrimaryBtnText: {
        color: '#ffffff',
        fontSize: 12.5,
        fontWeight: '800',
    },
    viewProjectsBtn: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#f0f9ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    viewProjectsBtnFull: {
        flex: 1,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#f0f9ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    viewProjectsBtnText: {
        color: '#0284c7',
        fontSize: 12,
        fontWeight: '700',
    },
    assignedActionsRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    invoiceQuickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        height: 38,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    invoiceQuickBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0284c7',
    },

    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 10,
        color: '#64748b',
        fontSize: 13,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
    emptyText: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },

    // MODAL STYLES
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingTop: 16,
    },
    detailModalSheet: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingTop: 16,
        paddingBottom: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    detailBadge: {
        fontSize: 10,
        fontWeight: '800',
        color: '#0284c7',
        letterSpacing: 0.6,
        marginBottom: 3,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    modalSub: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    closeBtn: {
        padding: 6,
    },
    specSection: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 14,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    specRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    specCol: {
        flex: 1,
    },
    specLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 0.4,
    },
    specVal: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a',
        marginTop: 2,
    },
    notesBlock: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    notesTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 6,
    },
    notesContent: {
        fontSize: 13,
        color: '#334155',
        lineHeight: 19,
    },
    assignedSectionBox: {
        marginTop: 14,
    },
    assignedSectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 6,
    },
    modalActionButtons: {
        marginTop: 20,
        marginBottom: 24,
        gap: 10,
    },
    modalAssignPrimaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0284c7',
        borderRadius: 12,
        paddingVertical: 13,
    },
    modalAssignPrimaryBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#ffffff',
    },
    modalProjectSecondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    modalProjectSecondaryBtnText: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#0284c7',
    },

    // Assign Sheet
    modalSearchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        height: 42,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 13,
        color: '#0f172a',
    },
    modalEmpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    modalEmpAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0284c7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalEmpAvatarText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#ffffff',
    },
    modalEmpName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    modalEmpRole: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        marginTop: 1,
    },
    modalEmpSkills: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    apprBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    apprBadgeOk: {
        backgroundColor: '#dcfce7',
    },
    apprBadgePending: {
        backgroundColor: '#fef3c7',
    },
    apprBadgeText: {
        fontSize: 9.5,
        fontWeight: '800',
    },
    apprTextOk: {
        color: '#15803d',
    },
    apprTextPending: {
        color: '#b45309',
    },
    modalAssignBtn: {
        backgroundColor: '#0284c7',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    modalAssignBtnDisabled: {
        opacity: 0.6,
    },
    modalAssignBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#ffffff',
    },
    modalEmptyBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 24,
    },
    modalEmptyTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
    },
    modalEmptySub: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 4,
    },
});
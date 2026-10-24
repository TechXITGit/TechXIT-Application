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
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    setDoc,
    serverTimestamp,
} from 'firebase/firestore';
import {
    UserCheck,
    User,
    CheckCircle2,
    Clock,
    ArrowLeft,
    FileText,
    Search,
    X,
    FolderKanban,
    Mail,
    ChevronRight,
    Sparkles,
    Calendar,
    Briefcase,
    ExternalLink,
} from 'lucide-react-native';
import { sendNotification } from './NotificationService';

const AdminProjects = ({ route, navigation }) => {
    const targetRequestId = route.params?.targetRequestId;
    const targetProjectId = route.params?.targetProjectId;
    const autoOpenAssignParam = route.params?.autoOpenAssign;

    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ASSIGNED' | 'UNASSIGNED'

    // Modals
    const [selectedDetailProject, setSelectedDetailProject] = useState(null);
    const [selectedAssignProject, setSelectedAssignProject] = useState(null);
    const [assigningId, setAssigningId] = useState(null);
    const [employeeSearch, setEmployeeSearch] = useState('');

    // ============================================
    // LOAD PROJECTS & CLIENT REQUESTS IN REAL TIME
    // ============================================
    useEffect(() => {
        let directProjects = [];
        let clientRequests = [];

        const mergeAllProjects = () => {
            const map = new Map();

            // 1. Direct projects from 'projects' collection
            directProjects.forEach((p) => {
                if (p && p.id) {
                    const key = p.requestId || p.id;
                    map.set(key, {
                        ...p,
                        directDocId: p.id,
                        isFromDirectProjects: true,
                    });
                }
            });

            // 2. Merge proposals/requests from 'requests' collection (except rejected)
            clientRequests.forEach((req) => {
                if (req && req.id && req.status !== 'rejected') {
                    const existing = map.get(req.id);
                    if (existing) {
                        map.set(req.id, {
                            ...req,
                            ...existing,
                            title: existing.title || req.serviceName || 'Client Project',
                            serviceName: existing.serviceName || req.serviceName || 'Client Project',
                            clientName: existing.clientName || req.clientName || 'Valued Client',
                            clientEmail: existing.clientEmail || req.clientEmail || '',
                            budget: existing.budget || req.budget || '0',
                            description: existing.description || req.notes || 'No requirements provided.',
                            notes: existing.notes || req.notes || '',
                            assignedEmployeeName: existing.assignedEmployeeName || req.assignedEmployeeName || '',
                            assignedEmployeeUid: existing.assignedEmployeeUid || req.assignedEmployeeUid || '',
                            assignedEmployeeEmail: existing.assignedEmployeeEmail || req.assignedEmployeeEmail || '',
                            assignedEmployeeDesignation: existing.assignedEmployeeDesignation || req.assignedEmployeeDesignation || '',
                            employeeStatus: existing.employeeStatus || req.employeeStatus || 'pending',
                            status: existing.status || req.status || 'approved',
                            createdAt: existing.createdAt || req.createdAt,
                            requestId: req.id,
                        });
                    } else {
                        map.set(req.id, {
                            id: req.id,
                            requestId: req.id,
                            title: req.serviceName || 'Client Project',
                            serviceName: req.serviceName || 'Client Project',
                            description: req.notes || 'No requirements provided.',
                            notes: req.notes || '',
                            clientUid: req.clientUid || '',
                            clientName: req.clientName || 'Valued Client',
                            clientEmail: req.clientEmail || '',
                            budget: req.budget || '0',
                            status: req.status || 'approved',
                            assignedEmployeeUid: req.assignedEmployeeUid || null,
                            assignedEmployeeName: req.assignedEmployeeName || '',
                            assignedEmployeeEmail: req.assignedEmployeeEmail || '',
                            assignedEmployeeDesignation: req.assignedEmployeeDesignation || '',
                            employeeStatus: req.employeeStatus || 'pending',
                            createdAt: req.createdAt,
                            isFromApprovedRequest: true,
                        });
                    }
                }
            });

            const combined = Array.from(map.values());

            const getDocTime = (docObj) => {
                if (!docObj) return 0;
                if (docObj.createdAt?.seconds) return docObj.createdAt.seconds * 1000;
                if (typeof docObj.createdAt?.toMillis === 'function') return docObj.createdAt.toMillis();
                if (typeof docObj.createdAt === 'string') {
                    const d = new Date(docObj.createdAt).getTime();
                    if (!isNaN(d)) return d;
                }
                if (docObj.assignedAt) {
                    const d = new Date(docObj.assignedAt).getTime();
                    if (!isNaN(d)) return d;
                }
                return 0;
            };

            combined.sort((a, b) => getDocTime(b) - getDocTime(a));

            setProjects(combined);
            setLoading(false);
            setRefreshing(false);
        };

        // 1. Projects listener
        const unsubProjects = onSnapshot(
            collection(db, 'projects'),
            (snapshot) => {
                directProjects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                mergeAllProjects();
            },
            (err) => {
                console.log('Projects listener note:', err.message);
                mergeAllProjects();
            }
        );

        // 2. Requests listener (Direct listener without failing composite queries)
        const unsubRequests = onSnapshot(
            collection(db, 'requests'),
            (snapshot) => {
                clientRequests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                mergeAllProjects();
            },
            (err) => {
                console.log('Requests listener note:', err.message);
                mergeAllProjects();
            }
        );

        return () => {
            unsubProjects();
            unsubRequests();
        };
    }, []);

    // Handle auto-focus from navigation parameters
    useEffect(() => {
        const targetId = targetRequestId || targetProjectId;
        if (targetId && projects.length > 0) {
            const match = projects.find(
                (p) => p.id === targetId || p.requestId === targetId
            );
            if (match) {
                if (autoOpenAssignParam) {
                    setSelectedAssignProject(match);
                } else {
                    setSelectedDetailProject(match);
                }
            }
        }
    }, [targetRequestId, targetProjectId, autoOpenAssignParam, projects]);

    // ============================================
    // LOAD ALL EMPLOYEES
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
                console.log('Employees fetch note:', error.message);
            }
        );

        return () => unsubscribe();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 500);
    }, []);

    // ============================================
    // ASSIGN PROJECT ACTION
    // ============================================
    const assignProject = async (project, employee) => {
        if (!project || !employee) return;
        setAssigningId(employee.id);

        try {
            const empUid = employee.id || employee.uid;
            const empName = employee.name || 'Team Member';
            const empEmail = employee.email || '';
            const empDesignation = employee.designation || employee.role || 'Developer';

            const assignPayload = {
                assignedEmployeeUid: empUid,
                assignedEmployeeName: empName,
                assignedEmployeeEmail: empEmail,
                assignedEmployeeDesignation: empDesignation,
                employeeStatus: 'pending',
                status: 'assigned',
                assignedAt: new Date().toISOString(),
            };

            // 1. Update or create clean project doc in 'projects' collection
            const projDocId = project.directDocId || project.requestId || project.id;
            const cleanProjectData = {
                requestId: project.requestId || project.id,
                serviceId: project.serviceId || '',
                title: project.title || project.serviceName || 'Client Project',
                serviceName: project.serviceName || project.title || 'Client Project',
                description: project.description || project.notes || 'No requirements provided.',
                notes: project.notes || project.description || '',
                clientUid: project.clientUid || '',
                clientName: project.clientName || 'Valued Client',
                clientEmail: project.clientEmail || '',
                budget: String(project.budget || '0'),
                ...assignPayload,
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(db, 'projects', projDocId), cleanProjectData, { merge: true });

            // In-app notification to Employee
            sendNotification({
                title: 'New Project Assigned 🚀',
                message: `You have been assigned to "${cleanProjectData.title}". Review project in your dashboard.`,
                type: 'project',
                role: 'employee',
                userId: empUid,
                targetScreen: 'EmployeeProjects',
            });

            // In-app notification to Client
            if (project.clientUid) {
                sendNotification({
                    title: 'Team Developer Assigned 🚀',
                    message: `${empName} (${empDesignation}) has been assigned to work on your "${cleanProjectData.title}" project!`,
                    type: 'project',
                    role: 'client',
                    userId: project.clientUid,
                    userEmail: project.clientEmail || null,
                    targetScreen: 'Services',
                });
            }

            // 2. Also update 'requests' document so client requests screen reflects assignment
            const reqId = project.requestId || project.id;
            try {
                await updateDoc(doc(db, 'requests', reqId), {
                    ...assignPayload,
                });
            } catch (reqErr) {
                console.log('Request doc sync note:', reqErr.message);
            }

            setSelectedAssignProject(null);
            if (selectedDetailProject) {
                setSelectedDetailProject({
                    ...selectedDetailProject,
                    ...assignPayload,
                });
            }

            Alert.alert(
                'Project Assigned! 🚀',
                `${empName} (${empDesignation}) has been assigned to "${cleanProjectData.title}". The developer can now review and accept this project in their dashboard.`
            );
        } catch (error) {
            console.log('Assign project error:', error);
            Alert.alert('Assignment Error', 'Could not assign project: ' + error.message);
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

    // Filter projects
    const filteredProjects = useMemo(() => {
        return projects.filter((proj) => {
            const q = searchQuery.toLowerCase();
            const matchesQuery =
                (proj.title || '').toLowerCase().includes(q) ||
                (proj.serviceName || '').toLowerCase().includes(q) ||
                (proj.clientName || '').toLowerCase().includes(q) ||
                (proj.clientEmail || '').toLowerCase().includes(q) ||
                (proj.assignedEmployeeName || '').toLowerCase().includes(q);

            const hasAssigned = Boolean(proj.assignedEmployeeName);
            if (filterStatus === 'ASSIGNED') return matchesQuery && hasAssigned;
            if (filterStatus === 'UNASSIGNED') return matchesQuery && !hasAssigned;
            return matchesQuery;
        });
    }, [projects, searchQuery, filterStatus]);

    // Filter employees in assign modal
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
                    onPress={() => assignProject(selectedAssignProject, item)}
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

    // Render Project Card
    const renderProjectCard = ({ item }) => {
        const isAssigned = Boolean(item.assignedEmployeeName);
        const empStatus = item.employeeStatus || 'pending';

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => setSelectedDetailProject(item)}
                activeOpacity={0.9}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={styles.clientBadgeRow}>
                            <Text style={styles.clientNameText}>
                                Client: {item.clientName || 'Valued Client'}
                            </Text>
                            {item.budget ? (
                                <Text style={styles.budgetText}>₹{Number(item.budget).toLocaleString('en-IN')}</Text>
                            ) : null}
                        </View>
                        <Text style={styles.projectTitle}>{item.title || item.serviceName || 'Software Project'}</Text>
                    </View>

                    <View style={[styles.statusBadge, isAssigned ? styles.statusAssignedBg : styles.statusUnassignedBg]}>
                        <Text style={[styles.statusBadgeText, isAssigned ? styles.statusAssignedText : styles.statusUnassignedText]}>
                            {isAssigned
                                ? empStatus === 'accepted'
                                    ? 'In Progress'
                                    : empStatus === 'rejected'
                                    ? 'Rejected'
                                    : 'Assigned'
                                : 'Needs Team'}
                        </Text>
                    </View>
                </View>

                {/* Description Preview */}
                {item.description ? (
                    <Text style={styles.descriptionText} numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}

                {/* Assigned Developer Box or Assign Button */}
                {isAssigned ? (
                    <View style={styles.assignedBox}>
                        <View style={styles.assignedAvatar}>
                            <Text style={styles.assignedAvatarText}>{getInitials(item.assignedEmployeeName)}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.assignedLabel}>ASSIGNED DEVELOPER</Text>
                            <Text style={styles.assignedName}>{item.assignedEmployeeName}</Text>
                            <Text style={styles.assignedStatusText}>
                                Status: {empStatus === 'accepted' ? 'Accepted by Developer ✅' : empStatus === 'rejected' ? 'Rejected by Developer ❌' : 'Awaiting Developer Response ⏳'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.changeBtn}
                            onPress={(e) => {
                                e?.stopPropagation?.();
                                setSelectedAssignProject(item);
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.changeBtnText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.assignEmployeeActionBtn}
                        onPress={(e) => {
                            e?.stopPropagation?.();
                            setSelectedAssignProject(item);
                        }}
                        activeOpacity={0.85}
                    >
                        <UserCheck size={16} color="#ffffff" />
                        <Text style={styles.assignEmployeeActionBtnText}>Assign Team Developer</Text>
                    </TouchableOpacity>
                )}

                {/* Footer Buttons */}
                <View style={styles.cardFooter}>
                    <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => setSelectedDetailProject(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.detailsBtnText}>View Full Scope & Details →</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.invoiceBtn}
                        onPress={(e) => {
                            e?.stopPropagation?.();
                            navigation.navigate('AdminInvoices', { preselectedProject: item });
                        }}
                        activeOpacity={0.8}
                    >
                        <FileText size={13} color="#0284c7" />
                        <Text style={styles.invoiceBtnText}>Create Invoice</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* Top Bar */}
            <View style={styles.topHeader}>
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
                    <Text style={styles.pageTitle}>Manage Projects</Text>
                    <Text style={styles.pageSubtitle}>Assign team developers & track execution</Text>
                </View>

                <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{projects.length}</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarWrap}>
                <Search size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by project, client, or assigned staff..."
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
                {['ALL', 'ASSIGNED', 'UNASSIGNED'].map((tab) => (
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

            {/* List */}
            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#0284c7" />
                    <Text style={styles.loadingText}>Loading Projects...</Text>
                </View>
            ) : filteredProjects.length === 0 ? (
                <View style={styles.emptyBox}>
                    <FolderKanban size={48} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No Projects Found</Text>
                    <Text style={styles.emptyDesc}>
                        {searchQuery
                            ? `No projects matched "${searchQuery}".`
                            : 'Client service requests will appear here automatically for developer assignment and delivery.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProjects}
                    renderItem={renderProjectCard}
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
            {/* 1. PROJECT FULL DETAILS MODAL */}
            {/* ========================================================= */}
            <Modal
                visible={Boolean(selectedDetailProject)}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedDetailProject(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.detailModalSheet}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.detailBadge}>PROJECT SPECIFICATION</Text>
                                <Text style={styles.modalTitle}>
                                    {selectedDetailProject?.title || selectedDetailProject?.serviceName}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setSelectedDetailProject(null)}
                                activeOpacity={0.7}
                            >
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
                            {/* Client & Financial Specs */}
                            <View style={styles.specSection}>
                                <View style={styles.specRow}>
                                    <View style={styles.specCol}>
                                        <Text style={styles.specLabel}>CLIENT NAME</Text>
                                        <Text style={styles.specVal}>{selectedDetailProject?.clientName || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.specCol}>
                                        <Text style={styles.specLabel}>ESTIMATED BUDGET</Text>
                                        <Text style={[styles.specVal, { color: '#15803d' }]}>
                                            ₹{Number(selectedDetailProject?.budget || 0).toLocaleString('en-IN')}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.specRow, { marginTop: 12 }]}>
                                    <View style={styles.specCol}>
                                        <Text style={styles.specLabel}>CLIENT EMAIL</Text>
                                        <Text style={styles.specVal}>{selectedDetailProject?.clientEmail || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.specCol}>
                                        <Text style={styles.specLabel}>CURRENT STATUS</Text>
                                        <Text style={[styles.specVal, { textTransform: 'capitalize' }]}>
                                            {selectedDetailProject?.status || 'Active'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Client Requirements / Notes */}
                            <View style={styles.notesBlock}>
                                <Text style={styles.notesTitle}>Client Scope & Requirements</Text>
                                <Text style={styles.notesContent}>
                                    {selectedDetailProject?.description || selectedDetailProject?.notes || 'No specific requirements or notes entered by client.'}
                                </Text>
                            </View>

                            {/* Assigned Team Section */}
                            <View style={styles.assignedDetailSection}>
                                <Text style={styles.assignedSectionTitle}>Assigned Team Member</Text>
                                {selectedDetailProject?.assignedEmployeeName ? (
                                    <View style={styles.assignedBox}>
                                        <View style={styles.assignedAvatar}>
                                            <Text style={styles.assignedAvatarText}>
                                                {getInitials(selectedDetailProject.assignedEmployeeName)}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={styles.assignedName}>{selectedDetailProject.assignedEmployeeName}</Text>
                                            <Text style={styles.assignedStatusText}>
                                                {selectedDetailProject.assignedEmployeeDesignation || 'Developer'} • {selectedDetailProject.assignedEmployeeEmail}
                                            </Text>
                                            <Text style={[styles.assignedStatusText, { marginTop: 4, fontWeight: '700' }]}>
                                                Developer Acceptance:{' '}
                                                {selectedDetailProject.employeeStatus === 'accepted'
                                                    ? 'Accepted ✅'
                                                    : selectedDetailProject.employeeStatus === 'rejected'
                                                    ? 'Rejected ❌'
                                                    : 'Pending ⏳'}
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.unassignedNoticeBox}>
                                        <Text style={styles.unassignedNoticeText}>
                                            No team developer has been assigned to this project yet.
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Actions in Detail Modal */}
                            <View style={styles.modalActionButtons}>
                                <TouchableOpacity
                                    style={styles.modalAssignPrimaryBtn}
                                    onPress={() => {
                                        setSelectedAssignProject(selectedDetailProject);
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <UserCheck size={18} color="#ffffff" />
                                    <Text style={styles.modalAssignPrimaryBtnText}>
                                        {selectedDetailProject?.assignedEmployeeName ? 'Reassign / Change Developer' : 'Assign Developer Now'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalInvoiceSecondaryBtn}
                                    onPress={() => {
                                        const proj = selectedDetailProject;
                                        setSelectedDetailProject(null);
                                        navigation.navigate('AdminInvoices', { preselectedProject: proj });
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <FileText size={18} color="#0284c7" />
                                    <Text style={styles.modalInvoiceSecondaryBtnText}>Create Milestone Invoice</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ========================================================= */}
            {/* 2. ASSIGN EMPLOYEE SELECTION MODAL */}
            {/* ========================================================= */}
            <Modal
                visible={Boolean(selectedAssignProject)}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedAssignProject(null)}
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
                                    Project: {selectedAssignProject?.title || selectedAssignProject?.serviceName || 'Project'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setSelectedAssignProject(null)}
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

export default AdminProjects;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    topHeader: {
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
    pageTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.4,
    },
    pageSubtitle: {
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
        marginBottom: 8,
    },
    clientBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    clientNameText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: '#0284c7',
    },
    budgetText: {
        fontSize: 11.5,
        fontWeight: '800',
        color: '#15803d',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    projectTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusAssignedBg: {
        backgroundColor: '#e0f2fe',
    },
    statusUnassignedBg: {
        backgroundColor: '#fef3c7',
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    statusAssignedText: {
        color: '#0284c7',
    },
    statusUnassignedText: {
        color: '#b45309',
    },
    descriptionText: {
        fontSize: 12.5,
        color: '#64748b',
        lineHeight: 17,
        marginBottom: 12,
    },
    assignedBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12,
    },
    assignedAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#0284c7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    assignedAvatarText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#ffffff',
    },
    assignedLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 0.5,
    },
    assignedName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
        marginTop: 1,
    },
    assignedStatusText: {
        fontSize: 11,
        color: '#475569',
        marginTop: 2,
    },
    changeBtn: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    changeBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    assignEmployeeActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#0284c7',
        borderRadius: 10,
        paddingVertical: 10,
        marginBottom: 12,
    },
    assignEmployeeActionBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#ffffff',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 10,
    },
    detailsBtn: {
        paddingVertical: 4,
    },
    detailsBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0284c7',
    },
    invoiceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#f0f9ff',
        borderRadius: 8,
    },
    invoiceBtnText: {
        fontSize: 11.5,
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
        fontSize: 13,
        color: '#64748b',
    },
    emptyBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        marginTop: 12,
    },
    emptyDesc: {
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
    assignedDetailSection: {
        marginTop: 14,
    },
    assignedSectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    unassignedNoticeBox: {
        backgroundColor: '#fef3c7',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    unassignedNoticeText: {
        fontSize: 12,
        color: '#92400e',
        fontWeight: '600',
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
    modalInvoiceSecondaryBtn: {
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
    modalInvoiceSecondaryBtnText: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#0284c7',
    },

    // ASSIGN MODAL STYLES
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
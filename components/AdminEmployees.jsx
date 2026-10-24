import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    RefreshControl,
    TextInput,
    ScrollView,
    Modal,
} from 'react-native';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import {
    UserCheck,
    Search,
    Mail,
    Phone,
    Briefcase,
    Sparkles,
    CheckCircle2,
    XCircle,
    X,
    User,
    FileText,
    ArrowLeft,
} from 'lucide-react-native';

const AdminEmployees = ({ navigation }) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'APPROVED' | 'PENDING'
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'users'), where('role', '==', 'employee'));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                }));
                // Sort pending first, then alphabetical
                data.sort((a, b) => {
                    if (a.approved === b.approved) {
                        return (a.name || '').localeCompare(b.name || '');
                    }
                    return a.approved ? 1 : -1;
                });
                setEmployees(data);
                setLoading(false);
                setRefreshing(false);
            },
            (error) => {
                console.log('Fetch employees error:', error.message);
                setLoading(false);
                setRefreshing(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
    }, []);

    const handleApprove = async (id) => {
        setUpdatingId(id);
        try {
            await updateDoc(doc(db, 'users', id), { approved: true });
        } catch (error) {
            console.log('Approve error:', error.message);
            Alert.alert('Error', 'Could not approve employee');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRevoke = (id) => {
        Alert.alert(
            'Revoke Access',
            'This will block the employee from logging in until approved again. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Revoke',
                    style: 'destructive',
                    onPress: async () => {
                        setUpdatingId(id);
                        try {
                            await updateDoc(doc(db, 'users', id), { approved: false });
                        } catch (error) {
                            console.log('Revoke error:', error.message);
                            Alert.alert('Error', 'Could not revoke access');
                        } finally {
                            setUpdatingId(null);
                        }
                    },
                },
            ]
        );
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter((emp) => {
            const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'APPROVED' && emp.approved === true) ||
                (statusFilter === 'PENDING' && emp.approved !== true);

            const q = searchQuery.toLowerCase();
            const skillsStr = Array.isArray(emp.skills)
                ? emp.skills.join(' ')
                : emp.skills || '';
            const matchesSearch =
                (emp.name || '').toLowerCase().includes(q) ||
                (emp.email || '').toLowerCase().includes(q) ||
                (emp.designation || '').toLowerCase().includes(q) ||
                skillsStr.toLowerCase().includes(q);

            return matchesStatus && matchesSearch;
        });
    }, [employees, statusFilter, searchQuery]);

    const renderEmployeeCard = ({ item }) => {
        const skillsList = Array.isArray(item.skills)
            ? item.skills
            : (item.skills || '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => setSelectedEmployee(item)}
            >
                {/* Card Top: Avatar, Name, Designation, Approval Status */}
                <View style={styles.cardHeader}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {item.name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>

                    <View style={styles.headerInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.nameText} numberOfLines={1}>
                                {item.name || 'Unnamed Employee'}
                            </Text>
                        </View>
                        <Text style={styles.designationText} numberOfLines={1}>
                            {item.designation || 'Staff Team Member'}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.statusBadge,
                            item.approved ? styles.statusApproved : styles.statusPending,
                        ]}
                    >
                        <Text
                            style={[
                                styles.statusBadgeText,
                                item.approved
                                    ? styles.statusApprovedText
                                    : styles.statusPendingText,
                            ]}
                        >
                            {item.approved ? 'Approved' : 'Pending'}
                        </Text>
                    </View>
                </View>

                {/* Contact Row */}
                <View style={styles.contactRow}>
                    <View style={styles.contactItem}>
                        <Mail size={13} color="#64748b" />
                        <Text style={styles.contactText} numberOfLines={1}>
                            {item.email || 'N/A'}
                        </Text>
                    </View>
                    {item.phone ? (
                        <View style={styles.contactItem}>
                            <Phone size={13} color="#64748b" />
                            <Text style={styles.contactText}>{item.phone}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Skills Tags */}
                {skillsList.length > 0 && (
                    <View style={styles.skillsWrap}>
                        {skillsList.slice(0, 3).map((skill, index) => (
                            <View key={index} style={styles.skillChip}>
                                <Text style={styles.skillChipText}>{skill}</Text>
                            </View>
                        ))}
                        {skillsList.length > 3 && (
                            <View style={[styles.skillChip, styles.skillMoreChip]}>
                                <Text style={styles.skillMoreText}>
                                    +{skillsList.length - 3} more
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Action Footer */}
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.viewDetailsBtn}
                        onPress={() => setSelectedEmployee(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.viewDetailsBtnText}>View Full Profile</Text>
                    </TouchableOpacity>

                    {item.approved ? (
                        <TouchableOpacity
                            style={styles.revokeBtn}
                            onPress={() => handleRevoke(item.id)}
                            disabled={updatingId === item.id}
                            activeOpacity={0.8}
                        >
                            {updatingId === item.id ? (
                                <ActivityIndicator color="#ef4444" size="small" />
                            ) : (
                                <Text style={styles.revokeBtnText}>Revoke Access</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.approveBtn}
                            onPress={() => handleApprove(item.id)}
                            disabled={updatingId === item.id}
                            activeOpacity={0.8}
                        >
                            {updatingId === item.id ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                                <Text style={styles.approveBtnText}>Approve Employee</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* Header Title with Back Button */}
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
                    <Text style={styles.pageTitle}>Employees Directory</Text>
                    <Text style={styles.pageSubtitle}>
                        {employees.length} registered employees & profiles
                    </Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarWrap}>
                <Search size={16} color="#64748b" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, designation, or skill..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabsRow}>
                {['ALL', 'APPROVED', 'PENDING'].map((tab) => {
                    const isActive = statusFilter === tab;
                    return (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.filterTab, isActive && styles.filterTabActive]}
                            onPress={() => setStatusFilter(tab)}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.filterTabText,
                                    isActive && styles.filterTabTextActive,
                                ]}
                            >
                                {tab === 'ALL'
                                    ? `All (${employees.length})`
                                    : tab === 'APPROVED'
                                    ? `Approved (${
                                          employees.filter((e) => e.approved).length
                                      })`
                                    : `Pending (${
                                          employees.filter((e) => !e.approved).length
                                      })`}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Employee List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0284c7" />
                    <Text style={styles.loadingText}>Loading employee profiles...</Text>
                </View>
            ) : filteredEmployees.length === 0 ? (
                <View style={styles.centerContainer}>
                    <UserCheck size={36} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No Employees Found</Text>
                    <Text style={styles.emptySub}>
                        {searchQuery
                            ? 'No profiles match your search criteria.'
                            : 'No employee accounts registered yet.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredEmployees}
                    renderItem={renderEmployeeCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#0284c7']}
                        />
                    }
                />
            )}

            {/* Full Profile Detail Modal */}
            <Modal
                visible={!!selectedEmployee}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedEmployee(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalTitleRow}>
                                <User size={20} color="#0284c7" />
                                <Text style={styles.modalTitle}>Employee Profile Details</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setSelectedEmployee(null)}
                                style={styles.modalCloseBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <X size={20} color="#0f172a" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalScroll}
                        >
                            {selectedEmployee && (
                                <>
                                    {/* Avatar & Title */}
                                    <View style={styles.profileHeaderBox}>
                                        <View style={styles.modalAvatar}>
                                            <Text style={styles.modalAvatarText}>
                                                {selectedEmployee.name
                                                    ?.charAt(0)
                                                    ?.toUpperCase() || '?'}
                                            </Text>
                                        </View>
                                        <Text style={styles.modalName}>
                                            {selectedEmployee.name || 'Unnamed Employee'}
                                        </Text>
                                        <Text style={styles.modalDesignation}>
                                            {selectedEmployee.designation || 'Staff Team Member'}
                                        </Text>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                selectedEmployee.approved
                                                    ? styles.statusApproved
                                                    : styles.statusPending,
                                                { marginTop: 8 },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusBadgeText,
                                                    selectedEmployee.approved
                                                        ? styles.statusApprovedText
                                                        : styles.statusPendingText,
                                                ]}
                                            >
                                                {selectedEmployee.approved
                                                    ? 'Approved Employee'
                                                    : 'Pending Admin Approval'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Info Grid */}
                                    <View style={styles.infoSection}>
                                        <Text style={styles.sectionLabel}>CONTACT INFORMATION</Text>
                                        <View style={styles.detailRow}>
                                            <Mail size={16} color="#0284c7" />
                                            <Text style={styles.detailLabel}>Email:</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedEmployee.email || 'N/A'}
                                            </Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Phone size={16} color="#0284c7" />
                                            <Text style={styles.detailLabel}>Phone:</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedEmployee.phone || 'Not provided'}
                                            </Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Briefcase size={16} color="#0284c7" />
                                            <Text style={styles.detailLabel}>UID:</Text>
                                            <Text style={styles.detailValueSmall} numberOfLines={1}>
                                                {selectedEmployee.id}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Skills Section */}
                                    <View style={styles.infoSection}>
                                        <Text style={styles.sectionLabel}>SKILLS & EXPERTISE</Text>
                                        {selectedEmployee.skills ? (
                                            <View style={styles.skillsModalWrap}>
                                                {(Array.isArray(selectedEmployee.skills)
                                                    ? selectedEmployee.skills
                                                    : selectedEmployee.skills.split(',')
                                                ).map((skill, index) => (
                                                    <View key={index} style={styles.skillBadgeModal}>
                                                        <Sparkles size={11} color="#0284c7" />
                                                        <Text style={styles.skillBadgeModalText}>
                                                            {skill.trim()}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        ) : (
                                            <Text style={styles.emptyInfoText}>
                                                No skills added yet.
                                            </Text>
                                        )}
                                    </View>

                                    {/* Bio Section */}
                                    <View style={styles.infoSection}>
                                        <Text style={styles.sectionLabel}>PROFESSIONAL BIO</Text>
                                        <Text style={styles.bioText}>
                                            {selectedEmployee.bio ||
                                                'No professional biography provided yet.'}
                                        </Text>
                                    </View>

                                    {/* Modal Action Buttons */}
                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={styles.modalPayslipBtn}
                                            onPress={() => {
                                                setSelectedEmployee(null);
                                                navigation.navigate('AdminPayslips');
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <FileText size={16} color="#0284c7" />
                                            <Text style={styles.modalPayslipBtnText}>
                                                Create Salary Slip
                                            </Text>
                                        </TouchableOpacity>

                                        {selectedEmployee.approved ? (
                                            <TouchableOpacity
                                                style={styles.modalRevokeBtn}
                                                onPress={() => {
                                                    handleRevoke(selectedEmployee.id);
                                                    setSelectedEmployee(null);
                                                }}
                                            >
                                                <XCircle size={16} color="#ef4444" />
                                                <Text style={styles.modalRevokeBtnText}>
                                                    Revoke Employee Access
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.modalApproveBtn}
                                                onPress={() => {
                                                    handleApprove(selectedEmployee.id);
                                                    setSelectedEmployee(null);
                                                }}
                                            >
                                                <CheckCircle2 size={16} color="#ffffff" />
                                                <Text style={styles.modalApproveBtnText}>
                                                    Approve Employee
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default AdminEmployees;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
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
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.4,
    },
    pageSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    searchBarWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        height: 44,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: '#0f172a',
    },
    filterTabsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginTop: 10,
        marginBottom: 8,
    },
    filterTab: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    filterTabActive: {
        backgroundColor: '#0284c7',
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    filterTabTextActive: {
        color: '#ffffff',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 40,
        gap: 12,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0284c7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '800',
    },
    headerInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nameText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    designationText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    statusApproved: {
        backgroundColor: '#dcfce7',
    },
    statusPending: {
        backgroundColor: '#fef3c7',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statusApprovedText: {
        color: '#16a34a',
    },
    statusPendingText: {
        color: '#d97706',
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    contactText: {
        fontSize: 12,
        color: '#475569',
    },
    skillsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 10,
    },
    skillChip: {
        backgroundColor: '#f0f9ff',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e0f2fe',
    },
    skillChipText: {
        fontSize: 11,
        color: '#0369a1',
        fontWeight: '600',
    },
    skillMoreChip: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
    },
    skillMoreText: {
        fontSize: 11,
        color: '#64748b',
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        gap: 10,
    },
    viewDetailsBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    viewDetailsBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0f172a',
    },
    approveBtn: {
        backgroundColor: '#16a34a',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    approveBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },
    revokeBtn: {
        borderWidth: 1,
        borderColor: '#fee2e2',
        backgroundColor: '#fef2f2',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    revokeBtnText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '700',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 13,
        color: '#64748b',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginTop: 12,
    },
    emptySub: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        textAlign: 'center',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalScroll: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    profileHeaderBox: {
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
    },
    modalAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0284c7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalAvatarText: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '800',
    },
    modalName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    modalDesignation: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    infoSection: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 14,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
        width: 50,
    },
    detailValue: {
        fontSize: 13,
        color: '#0f172a',
        fontWeight: '600',
        flex: 1,
    },
    detailValueSmall: {
        fontSize: 11,
        color: '#94a3b8',
        flex: 1,
    },
    skillsModalWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    skillBadgeModal: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f0f9ff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    skillBadgeModalText: {
        fontSize: 12,
        color: '#0369a1',
        fontWeight: '600',
    },
    emptyInfoText: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
    },
    bioText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
    },
    modalActions: {
        marginTop: 8,
        gap: 10,
    },
    modalPayslipBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#f0f9ff',
        borderWidth: 1.5,
        borderColor: '#0284c7',
        paddingVertical: 12,
        borderRadius: 12,
    },
    modalPayslipBtnText: {
        color: '#0284c7',
        fontSize: 14,
        fontWeight: '700',
    },
    modalApproveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#16a34a',
        paddingVertical: 12,
        borderRadius: 12,
    },
    modalApproveBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    modalRevokeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        paddingVertical: 12,
        borderRadius: 12,
    },
    modalRevokeBtnText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '700',
    },
});
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    TextInput,
    Modal,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import {
    ArrowLeft,
    Plus,
    Briefcase,
    MapPin,
    Clock,
    DollarSign,
    Trash2,
    CheckCircle2,
    XCircle,
    Search,
    X,
    Users,
    Sparkles,
} from 'lucide-react-native';

const DEPARTMENTS = ['Development', 'Marketing', 'Design', 'Sales', 'Management'];
const JOB_TYPES = ['Full Time', 'Part Time', 'Remote', 'Internship', 'Contract'];
const EXPERIENCE_LEVELS = ['Fresher (0-1 Yrs)', '1-3 Years', '3-5 Years', '5+ Years'];

const AdminHiring = ({ navigation }) => {
    const [openings, setOpenings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'CLOSED'

    // Create Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [department, setDepartment] = useState('Development');
    const [jobType, setJobType] = useState('Full Time');
    const [experience, setExperience] = useState('1-3 Years');
    const [salary, setSalary] = useState('₹35,000 - ₹55,000 / month');
    const [location, setLocation] = useState('Remote (Work From Home)');
    const [skills, setSkills] = useState('React Native, JavaScript, Git');
    const [description, setDescription] = useState('');
    const [contactEmail, setContactEmail] = useState('techxitservices65@gmail.com');
    const [saving, setSaving] = useState(false);

    // Fetch real-time job openings from BOTH 'hirings' and fallback in 'requests'
    useEffect(() => {
        let directHirings = [];
        let fallbackHirings = [];

        const mergeOpenings = () => {
            const map = new Map();
            directHirings.forEach((h) => map.set(h.id, h));
            fallbackHirings.forEach((h) => map.set(h.id, h));
            const list = Array.from(map.values());
            list.sort((a, b) => {
                const tA = a.createdAt?.seconds || (a.createdAtStr ? new Date(a.createdAtStr).getTime() / 1000 : 0);
                const tB = b.createdAt?.seconds || (b.createdAtStr ? new Date(b.createdAtStr).getTime() / 1000 : 0);
                return tB - tA;
            });
            setOpenings(list);
            setLoading(false);
        };

        // 1. Direct collection 'hirings'
        const unsubHirings = onSnapshot(
            collection(db, 'hirings'),
            (snapshot) => {
                directHirings = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                    isRequestFallback: false,
                }));
                mergeOpenings();
            },
            (error) => {
                console.log('Direct hirings listener restricted (using requests fallback):', error.message);
                mergeOpenings();
            }
        );

        // 2. Fallback collection 'requests' where isHiringPost == true
        const unsubRequests = onSnapshot(
            collection(db, 'requests'),
            (snapshot) => {
                const filtered = [];
                snapshot.docs.forEach((d) => {
                    const data = d.data();
                    if (data.isHiringPost === true || data.type === 'hiring_opening') {
                        filtered.push({
                            id: d.id,
                            ...data,
                            isRequestFallback: true,
                        });
                    }
                });
                fallbackHirings = filtered;
                mergeOpenings();
            },
            (error) => {
                console.log('Requests listener error:', error.message);
                mergeOpenings();
            }
        );

        return () => {
            unsubHirings();
            unsubRequests();
        };
    }, []);

    const resetForm = () => {
        setTitle('');
        setDepartment('Development');
        setJobType('Full Time');
        setExperience('1-3 Years');
        setSalary('₹35,000 - ₹55,000 / month');
        setLocation('Remote (Work From Home)');
        setSkills('React Native, JavaScript, Git');
        setDescription('');
        setContactEmail('techxitservices65@gmail.com');
    };

    const handleCreateJob = async () => {
        if (!title.trim()) {
            Alert.alert('Missing Field', 'Please enter a job title.');
            return;
        }

        setSaving(true);
        try {
            const skillsArray = skills
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);

            const jobPayload = {
                title: title.trim(),
                department,
                jobType,
                experience,
                salary: salary.trim(),
                location: location.trim(),
                skills: skillsArray,
                description: description.trim() || 'Exciting opportunity to build cutting-edge software with Tech X IT Services.',
                contactEmail: contactEmail.trim(),
                status: 'active',
                createdAtStr: new Date().toISOString(),
            };

            let saved = false;

            // 1. Try writing directly to 'hirings' collection
            try {
                await addDoc(collection(db, 'hirings'), {
                    ...jobPayload,
                    createdAt: serverTimestamp(),
                });
                saved = true;
            } catch (colErr) {
                console.warn('Direct hirings collection restricted, using fallback in requests collection:', colErr.message);
            }

            // 2. If 'hirings' failed due to Firestore security permissions, save to 'requests' (allowed for client/admin)
            if (!saved) {
                await addDoc(collection(db, 'requests'), {
                    ...jobPayload,
                    isHiringPost: true,
                    type: 'hiring_opening',
                    createdAt: serverTimestamp(),
                });
            }

            resetForm();
            setModalVisible(false);
            Alert.alert('Job Opening Published! 🚀', `The position for "${title}" is now open for applications.`);
        } catch (error) {
            console.log('Error creating hiring opening:', error);
            Alert.alert('Error', 'Could not create opening: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (item) => {
        const newStatus = item.status === 'active' ? 'closed' : 'active';
        try {
            if (item.isRequestFallback) {
                await updateDoc(doc(db, 'requests', item.id), { status: newStatus });
            } else {
                try {
                    await updateDoc(doc(db, 'hirings', item.id), { status: newStatus });
                } catch (err) {
                    await updateDoc(doc(db, 'requests', item.id), { status: newStatus });
                }
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleDeleteOpening = (item) => {
        Alert.alert(
            'Delete Opening',
            `Are you sure you want to remove the job opening for "${item.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (item.isRequestFallback) {
                                await deleteDoc(doc(db, 'requests', item.id));
                            } else {
                                try {
                                    await deleteDoc(doc(db, 'hirings', item.id));
                                } catch (err) {
                                    await deleteDoc(doc(db, 'requests', item.id));
                                }
                            }
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        }
                    },
                },
            ]
        );
    };

    const filteredOpenings = openings.filter((item) => {
        const matchesQuery =
            (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.location || '').toLowerCase().includes(searchQuery.toLowerCase());

        if (filterStatus === 'ACTIVE') return matchesQuery && item.status === 'active';
        if (filterStatus === 'CLOSED') return matchesQuery && item.status === 'closed';
        return matchesQuery;
    });

    const renderJobCard = ({ item }) => {
        const isActive = item.status === 'active';
        const skillsList = Array.isArray(item.skills) ? item.skills : [];

        return (
            <View style={styles.jobCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={styles.deptRow}>
                            <Text style={styles.deptBadge}>{item.department || 'General'}</Text>
                            <Text style={styles.typeBadge}>{item.jobType || 'Full Time'}</Text>
                        </View>
                        <Text style={styles.jobTitle}>{item.title}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.statusToggleBadge, isActive ? styles.statusActive : styles.statusClosed]}
                        onPress={() => handleToggleStatus(item)}
                        activeOpacity={0.8}
                    >
                        {isActive ? <CheckCircle2 size={12} color="#15803d" /> : <XCircle size={12} color="#94a3b8" />}
                        <Text style={[styles.statusToggleText, isActive ? styles.statusActiveText : styles.statusClosedText]}>
                            {isActive ? 'ACTIVE' : 'CLOSED'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Highlights */}
                <View style={styles.highlightRow}>
                    <View style={styles.highlightItem}>
                        <DollarSign size={13} color="#0284c7" />
                        <Text style={styles.highlightText}>{item.salary || 'Competitive'}</Text>
                    </View>
                    <View style={styles.highlightItem}>
                        <MapPin size={13} color="#64748b" />
                        <Text style={styles.highlightText}>{item.location || 'Remote'}</Text>
                    </View>
                    <View style={styles.highlightItem}>
                        <Clock size={13} color="#64748b" />
                        <Text style={styles.highlightText}>{item.experience || 'Experience required'}</Text>
                    </View>
                </View>

                {/* Skills Tags */}
                {skillsList.length > 0 && (
                    <View style={styles.skillsWrap}>
                        {skillsList.map((sk, idx) => (
                            <View key={idx} style={styles.skillPill}>
                                <Text style={styles.skillPillText}>{sk}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Description Preview */}
                {item.description ? (
                    <Text style={styles.descText} numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}

                {/* Footer Actions */}
                <View style={styles.cardFooter}>
                    <Text style={styles.contactEmailText}>
                        Apply to: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{item.contactEmail || 'techxitservices65@gmail.com'}</Text>
                    </Text>

                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteOpening(item)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Trash2 size={15} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
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
                    <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.topBarTitle}>Manage Hiring</Text>

                <TouchableOpacity
                    style={styles.createHeaderBtn}
                    onPress={() => {
                        resetForm();
                        setModalVisible(true);
                    }}
                    activeOpacity={0.8}
                >
                    <Plus size={16} color="#ffffff" />
                    <Text style={styles.createHeaderBtnText}>Post Job</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarWrap}>
                <Search size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by job title, department, location..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
                {['ALL', 'ACTIVE', 'CLOSED'].map((tab) => (
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
                    <Text style={styles.loadingText}>Loading Job Postings...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredOpenings}
                    keyExtractor={(item) => item.id}
                    renderItem={renderJobCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Briefcase size={44} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>No Job Openings</Text>
                            <Text style={styles.emptyDesc}>
                                Post new vacancies and hire top engineering, marketing, and design talent for Tech X.
                            </Text>
                            <TouchableOpacity
                                style={styles.emptyCreateBtn}
                                onPress={() => setModalVisible(true)}
                                activeOpacity={0.8}
                            >
                                <Plus size={16} color="#ffffff" />
                                <Text style={styles.emptyCreateBtnText}>Create First Opening</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* CREATE JOB OPENING MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Create New Job Opening</Text>
                                <Text style={styles.modalSub}>Publish a hiring post on Tech X app</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setModalVisible(false)}
                                activeOpacity={0.7}
                            >
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, gap: 14 }}>
                            {/* Job Title */}
                            <Text style={styles.inputLabel}>Job Title *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g. Senior React Native Developer"
                                placeholderTextColor="#94a3b8"
                            />

                            {/* Department Chips */}
                            <Text style={styles.inputLabel}>Department</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                                {DEPARTMENTS.map((dept) => (
                                    <TouchableOpacity
                                        key={dept}
                                        style={[styles.choiceChip, department === dept && styles.choiceChipActive]}
                                        onPress={() => setDepartment(dept)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.choiceChipText, department === dept && styles.choiceChipTextActive]}>
                                            {dept}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Employment Type */}
                            <Text style={styles.inputLabel}>Employment Type</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                                {JOB_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.choiceChip, jobType === type && styles.choiceChipActive]}
                                        onPress={() => setJobType(type)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.choiceChipText, jobType === type && styles.choiceChipTextActive]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Experience Level */}
                            <Text style={styles.inputLabel}>Experience Required</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                                {EXPERIENCE_LEVELS.map((exp) => (
                                    <TouchableOpacity
                                        key={exp}
                                        style={[styles.choiceChip, experience === exp && styles.choiceChipActive]}
                                        onPress={() => setExperience(exp)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.choiceChipText, experience === exp && styles.choiceChipTextActive]}>
                                            {exp}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Salary & Location */}
                            <View style={styles.rowTwo}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Salary / Stipend</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={salary}
                                        onChangeText={setSalary}
                                        placeholder="e.g. ₹40,000 / mo"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Work Location</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={location}
                                        onChangeText={setLocation}
                                        placeholder="Remote / Noida"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </View>

                            {/* Required Skills */}
                            <Text style={styles.inputLabel}>Required Skills (Comma-separated)</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={skills}
                                onChangeText={setSkills}
                                placeholder="React Native, Redux, Firebase, JavaScript"
                                placeholderTextColor="#94a3b8"
                            />

                            {/* Description */}
                            <Text style={styles.inputLabel}>Job Description & Responsibilities</Text>
                            <TextInput
                                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Details about this role, requirements, and day-to-day work..."
                                placeholderTextColor="#94a3b8"
                                multiline
                            />

                            {/* Contact Email */}
                            <Text style={styles.inputLabel}>Application Email</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={contactEmail}
                                onChangeText={setContactEmail}
                                placeholder="techxitservices65@gmail.com"
                                placeholderTextColor="#94a3b8"
                            />

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={styles.modalSubmitBtn}
                                onPress={handleCreateJob}
                                activeOpacity={0.88}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <>
                                        <Plus size={18} color="#ffffff" />
                                        <Text style={styles.modalSubmitBtnText}>Publish Job Opening</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

export default AdminHiring;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    topBarTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
    },
    backBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    createHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#0284c7',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    createHeaderBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#ffffff',
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
        marginBottom: 8,
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
        fontWeight: '600',
        color: '#64748b',
    },
    filterTabTextActive: {
        color: '#ffffff',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    jobCard: {
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
    deptRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 6,
    },
    deptBadge: {
        fontSize: 10.5,
        fontWeight: '800',
        color: '#0284c7',
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    typeBadge: {
        fontSize: 10.5,
        fontWeight: '700',
        color: '#475569',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    statusToggleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusActive: {
        backgroundColor: '#dcfce7',
    },
    statusClosed: {
        backgroundColor: '#f1f5f9',
    },
    statusToggleText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    statusActiveText: {
        color: '#15803d',
    },
    statusClosedText: {
        color: '#94a3b8',
    },
    highlightRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 10,
    },
    highlightItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    highlightText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    skillsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 10,
    },
    skillPill: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    skillPillText: {
        fontSize: 11,
        color: '#334155',
        fontWeight: '500',
    },
    descText: {
        fontSize: 12,
        color: '#64748b',
        lineHeight: 17,
        marginTop: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    contactEmailText: {
        fontSize: 11,
        color: '#64748b',
    },
    deleteBtn: {
        padding: 6,
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#64748b',
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 17,
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
    emptyCreateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#0284c7',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 18,
    },
    emptyCreateBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#ffffff',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
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
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 6,
    },
    modalInput: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#0f172a',
    },
    rowTwo: {
        flexDirection: 'row',
        gap: 10,
    },
    choiceChip: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    choiceChipActive: {
        backgroundColor: '#0284c7',
        borderColor: '#0284c7',
    },
    choiceChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    choiceChipTextActive: {
        color: '#ffffff',
    },
    modalSubmitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0284c7',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 20,
        shadowColor: '#0284c7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    modalSubmitBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
    },
});

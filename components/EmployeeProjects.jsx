import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';

import React, {
    useEffect,
    useState,
    useCallback,
} from 'react';

import { SafeAreaView } from 'react-native-safe-area-context';

import { auth, db } from '../firebaseConfig';

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
} from 'firebase/firestore';

import {
    CheckCircle,
    XCircle,
    Clock,
    ArrowLeft,
} from 'lucide-react-native';

import { onAuthStateChanged } from 'firebase/auth';

const EmployeeProjects = ({ navigation }) => {
    const [projects, setProjects] = useState([]);
    const [currentUser, setCurrentUser] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [updatingId, setUpdatingId] =
        useState(null);

    // ============================================
    // AUTH STATE
    // ============================================

    useEffect(() => {
        const unsubscribe =
            onAuthStateChanged(
                auth,
                (user) => {
                    setCurrentUser(user);

                    if (!user) {
                        setProjects([]);
                        setLoading(false);
                    }
                }
            );

        return () => unsubscribe();
    }, []);

    // ============================================
    // LOAD ASSIGNED PROJECTS
    // ============================================

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, 'projects'),
            where(
                'assignedEmployeeUid',
                '==',
                currentUser.uid
            )
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data =
                    snapshot.docs.map(
                        (docSnap) => ({
                            id: docSnap.id,
                            ...docSnap.data(),
                        })
                    );

                data.sort(
                    (a, b) =>
                        getTime(b.createdAt) -
                        getTime(a.createdAt)
                );

                setProjects(data);
                setLoading(false);
                setRefreshing(false);
            },
            (error) => {
                console.log(
                    'Employee projects error:',
                    error.message
                );

                setLoading(false);
                setRefreshing(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const getTime = (value) => {
        if (!value) return 0;

        if (
            typeof value.toMillis ===
            'function'
        ) {
            return value.toMillis();
        }

        return 0;
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);

        setTimeout(() => {
            setRefreshing(false);
        }, 500);
    }, []);

    // ============================================
    // ACCEPT / REJECT PROJECT
    // ============================================

    const updateProjectStatus = async (
        project,
        employeeStatus
    ) => {
        setUpdatingId(project.id);

        try {
            await updateDoc(
                doc(
                    db,
                    'projects',
                    project.id
                ),
                {
                    employeeStatus,

                    status:
                        employeeStatus ===
                            'accepted'
                            ? 'accepted'
                            : 'rejected',

                    ...(employeeStatus ===
                        'accepted'
                        ? {
                            acceptedAt:
                                new Date().toISOString(),
                        }
                        : {
                            rejectedAt:
                                new Date().toISOString(),
                        }),
                }
            );

            Alert.alert(
                employeeStatus === 'accepted'
                    ? 'Project Accepted'
                    : 'Project Rejected',

                employeeStatus === 'accepted'
                    ? 'The project has been accepted successfully.'
                    : 'The project has been rejected.'
            );
        } catch (error) {
            console.log(
                'Project status error:',
                error.message
            );

            Alert.alert(
                'Error',
                'Could not update project.'
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const confirmAction = (
        project,
        action
    ) => {
        const isAccept =
            action === 'accepted';

        Alert.alert(
            isAccept
                ? 'Accept Project'
                : 'Reject Project',

            isAccept
                ? 'Do you want to accept this project?'
                : 'Are you sure you want to reject this project?',

            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text:
                        isAccept
                            ? 'Accept'
                            : 'Reject',

                    style:
                        isAccept
                            ? 'default'
                            : 'destructive',

                    onPress: () =>
                        updateProjectStatus(
                            project,
                            action
                        ),
                },
            ]
        );
    };

    // ============================================
    // PROJECT CARD
    // ============================================

    const renderItem = ({
        item,
    }) => {
        const pending =
            !item.employeeStatus ||
            item.employeeStatus ===
            'pending';

        return (
            <View style={styles.card}>

                <View style={styles.cardHeader}>

                    <View style={styles.titleBox}>

                        <Text style={styles.title}>
                            {item.title ||
                                item.serviceName ||
                                'Project'}
                        </Text>

                        <Text style={styles.client}>
                            Client:{' '}
                            {item.clientName ||
                                'Unknown'}
                        </Text>

                    </View>

                    <View
                        style={[
                            styles.badge,
                            item.employeeStatus ===
                                'accepted'
                                ? styles.accepted
                                : item.employeeStatus ===
                                    'rejected'
                                    ? styles.rejected
                                    : styles.pending,
                        ]}
                    >
                        <Text style={styles.badgeText}>
                            {item.employeeStatus ||
                                'Pending'}
                        </Text>
                    </View>

                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.info}>
                        Budget: ₹
                        {item.budget || '0'}
                    </Text>
                </View>

                <Text style={styles.description}>
                    {item.description ||
                        item.notes ||
                        'No project description'}
                </Text>

                {pending ? (

                    <View style={styles.actions}>

                        <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() =>
                                confirmAction(
                                    item,
                                    'rejected'
                                )
                            }
                            disabled={
                                updatingId ===
                                item.id
                            }
                        >
                            {updatingId ===
                                item.id ? (
                                <ActivityIndicator
                                    color="#ff4757"
                                    size="small"
                                />
                            ) : (
                                <>
                                    <XCircle
                                        size={17}
                                        color="#ff4757"
                                    />

                                    <Text
                                        style={
                                            styles.rejectText
                                        }
                                    >
                                        Reject
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.acceptBtn}
                            onPress={() =>
                                confirmAction(
                                    item,
                                    'accepted'
                                )
                            }
                            disabled={
                                updatingId ===
                                item.id
                            }
                        >
                            {updatingId ===
                                item.id ? (
                                <ActivityIndicator
                                    color="#ffffff"
                                    size="small"
                                />
                            ) : (
                                <>
                                    <CheckCircle
                                        size={17}
                                        color="#ffffff"
                                    />

                                    <Text
                                        style={
                                            styles.acceptText
                                        }
                                    >
                                        Accept Project
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                    </View>

                ) : (

                    <View style={styles.finalStatus}>

                        {item.employeeStatus ===
                            'accepted' ? (
                            <CheckCircle
                                size={19}
                                color="#1a9b5f"
                            />
                        ) : (
                            <XCircle
                                size={19}
                                color="#ff4757"
                            />
                        )}

                        <Text
                            style={[
                                styles.finalText,
                                item.employeeStatus ===
                                    'accepted'
                                    ? styles.finalAccepted
                                    : styles.finalRejected,
                            ]}
                        >
                            Project{' '}
                            {item.employeeStatus ===
                                'accepted'
                                ? 'Accepted'
                                : 'Rejected'}
                        </Text>

                    </View>

                )}

            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerBox}>
                    <ActivityIndicator
                        size="large"
                        color="#1e90ff"
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.navigate('Home');
                        }
                    }}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={20} color="#0f172a" />
                    <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.topBarTitle}>My Projects</Text>
                <View style={{ width: 60 }} />
            </View>

            <FlatList
                data={projects}
                renderItem={renderItem}
                keyExtractor={(item) =>
                    item.id
                }
                contentContainerStyle={
                    projects.length === 0
                        ? styles.emptyContent
                        : styles.list
                }
                showsVerticalScrollIndicator={
                    false
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#1e90ff']}
                        tintColor="#1e90ff"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.centerBox}>

                        <Clock
                            size={40}
                            color="#8fa8bf"
                        />

                        <Text style={styles.emptyTitle}>
                            No Projects Assigned
                        </Text>

                        <Text style={styles.emptyText}>
                            Projects assigned to you
                            by admin will appear here.
                        </Text>

                    </View>
                }
            />

        </SafeAreaView>
    );
};

export default EmployeeProjects;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fdfdfd',
    },

    backBtn: {
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 5,
    },

    backText: {
        fontSize: 16,
        color: '#1e90ff',
        fontWeight: '600',
    },

    heading: {
        paddingVertical: 15,
        alignItems: 'center',
    },

    headingText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },

    underline: {
        width: 50,
        height: 4,
        backgroundColor: '#15b9ff',
        marginTop: 6,
        borderRadius: 2,
    },

    list: {
        paddingHorizontal: 15,
        paddingBottom: 25,
    },

    emptyContent: {
        flexGrow: 1,
    },

    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#eaeaea',
        elevation: 2,
    },

    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },

    titleBox: {
        flex: 1,
        paddingRight: 8,
    },

    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0b3d5c',
    },

    client: {
        fontSize: 13,
        color: '#8fa8bf',
        marginTop: 4,
    },

    badge: {
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 8,
    },

    pending: {
        backgroundColor: '#fff4e0',
    },

    accepted: {
        backgroundColor: '#e0ffe6',
    },

    rejected: {
        backgroundColor: '#ffe0e0',
    },

    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'capitalize',
        color: '#333',
    },

    infoBox: {
        marginTop: 14,
    },

    info: {
        fontSize: 13,
        color: '#5a7d94',
    },

    description: {
        fontSize: 14,
        color: '#4a5568',
        lineHeight: 20,
        marginTop: 12,
    },

    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },

    rejectBtn: {
        flex: 1,
        height: 45,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ffd1d1',
        backgroundColor: '#fff4f4',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
    },

    rejectText: {
        color: '#ff4757',
        fontSize: 13,
        fontWeight: '700',
    },

    acceptBtn: {
        flex: 1.4,
        height: 45,
        borderRadius: 10,
        backgroundColor: '#1e90ff',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
    },

    acceptText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
    },

    finalStatus: {
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },

    finalText: {
        fontSize: 13,
        fontWeight: '700',
    },

    finalAccepted: {
        color: '#1a9b5f',
    },

    finalRejected: {
        color: '#ff4757',
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0b3d5c',
        marginTop: 12,
    },

    emptyText: {
        fontSize: 14,
        color: '#8fa8bf',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 20,
    },

    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 25,
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
    backBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
});


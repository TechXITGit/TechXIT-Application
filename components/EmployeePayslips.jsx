import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';

import React, {
    useEffect,
    useState,
    useCallback,
} from 'react';

import {
    SafeAreaView,
} from 'react-native-safe-area-context';

import {
    auth,
    db,
} from '../firebaseConfig';

import {
    collection,
    query,
    where,
    onSnapshot,
} from 'firebase/firestore';

import {
    onAuthStateChanged,
} from 'firebase/auth';
import { ArrowLeft } from 'lucide-react-native';


const EmployeePayslips = ({ navigation }) => {

    const [payslips, setPayslips] = useState([]);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [currentUser, setCurrentUser] = useState(null);


    // =====================================================
    // LISTEN FOR CURRENT AUTH USER
    // =====================================================

    useEffect(() => {

        const unsubscribeAuth =
            onAuthStateChanged(auth, (user) => {

                setCurrentUser(user);

                if (!user) {
                    setPayslips([]);
                    setLoading(false);
                }

            });


        return () => {
            unsubscribeAuth();
        };

    }, []);


    // =====================================================
    // FETCH EMPLOYEE PAYSLIPS
    // =====================================================

    useEffect(() => {

        if (!currentUser) {
            return;
        }


        setLoading(true);


        /*
         * IMPORTANT:
         *
         * We intentionally DON'T use orderBy here.
         *
         * where(employeeUid) + orderBy(createdAt)
         * can require a Firestore composite index.
         *
         * We sort the payslips locally instead.
         */

        const payslipsRef =
            collection(db, 'payslips');


        const q = query(
            payslipsRef,
            where(
                'employeeUid',
                '==',
                currentUser.uid
            )
        );


        const unsubscribe =
            onSnapshot(
                q,

                (snapshot) => {

                    const data =
                        snapshot.docs.map(
                            (docSnap) => ({
                                id: docSnap.id,
                                ...docSnap.data(),
                            })
                        );


                    // =====================================
                    // SORT NEWEST FIRST
                    // =====================================

                    data.sort((a, b) => {

                        const dateA =
                            getTimestampValue(
                                a.createdAt
                            );

                        const dateB =
                            getTimestampValue(
                                b.createdAt
                            );

                        return dateB - dateA;

                    });


                    setPayslips(data);

                    setLoading(false);

                    setRefreshing(false);


                    console.log(
                        'Employee UID:',
                        currentUser.uid
                    );

                    console.log(
                        'Payslips fetched:',
                        data.length
                    );

                },

                (error) => {

                    console.log(
                        'Payslip fetch error:',
                        error.code,
                        error.message
                    );

                    setLoading(false);

                    setRefreshing(false);

                }
            );


        return () => {
            unsubscribe();
        };

    }, [currentUser]);


    // =====================================================
    // CONVERT FIRESTORE TIMESTAMP
    // =====================================================

    const getTimestampValue = (timestamp) => {

        if (!timestamp) {
            return 0;
        }


        // Firestore Timestamp
        if (
            typeof timestamp.toMillis ===
            'function'
        ) {
            return timestamp.toMillis();
        }


        // JavaScript Date
        if (
            timestamp instanceof Date
        ) {
            return timestamp.getTime();
        }


        // String date
        if (
            typeof timestamp === 'string'
        ) {
            const value =
                new Date(timestamp).getTime();

            return Number.isNaN(value)
                ? 0
                : value;
        }


        return 0;
    };


    // =====================================================
    // REFRESH
    // =====================================================

    const onRefresh = useCallback(() => {

        /*
         * onSnapshot already keeps the list
         * updated in realtime.
         *
         * Setting refreshing true gives the user
         * feedback. Snapshot will turn it off.
         */

        setRefreshing(true);

        // If there is no active user,
        // stop refreshing immediately.
        if (!auth.currentUser) {
            setRefreshing(false);
        }

    }, []);


    // =====================================================
    // PAYSLIP CARD
    // =====================================================

    const renderItem = ({ item }) => (

        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
                navigation.navigate(
                    'PayslipDetail',
                    {
                        payslip: item,
                    }
                )
            }
        >

            <View style={styles.cardRow}>

                <View style={styles.monthContainer}>

                    <Text style={styles.monthText}>
                        {item.month} {item.year}
                    </Text>

                    <Text style={styles.statusText}>
                        {item.status || 'issued'}
                    </Text>

                </View>


                <Text style={styles.netPayText}>
                    ₹{Number(item.netPay || 0).toFixed(2)}
                </Text>

            </View>


            <Text style={styles.viewText}>
                Tap to view details →
            </Text>

        </TouchableOpacity>
    );


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <SafeAreaView
                style={styles.safeArea}
            >

                <View style={styles.centerBox}>

                    <ActivityIndicator
                        size="large"
                        color="#1e90ff"
                    />

                    <Text style={styles.loadingText}>
                        Loading payslips...
                    </Text>

                </View>

            </SafeAreaView>

        );
    }


    // =====================================================
    // NOT LOGGED IN
    // =====================================================

    if (!currentUser) {

        return (

            <SafeAreaView
                style={styles.safeArea}
            >

                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() =>
                        navigation.goBack()
                    }
                >

                    <Text
                        style={styles.backBtnText}
                    >
                        ‹ Back
                    </Text>

                </TouchableOpacity>


                <View style={styles.centerBox}>

                    <Text
                        style={styles.emptyText}
                    >
                        Please login to view your payslips.
                    </Text>

                </View>

            </SafeAreaView>

        );
    }


    // =====================================================
    // MAIN SCREEN
    // =====================================================

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

                <Text style={styles.topBarTitle}>My Payslips</Text>
                <View style={{ width: 60 }} />
            </View>


            {/* EMPTY */}

            {payslips.length === 0 ? (

                <FlatList
                    data={[]}
                    renderItem={null}
                    showsVerticalScrollIndicator={false}

                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#1e90ff']}
                            tintColor="#1e90ff"
                        />
                    }

                    contentContainerStyle={
                        styles.emptyContentContainer
                    }

                    ListEmptyComponent={

                        <View
                            style={styles.centerBox}
                        >

                            <Text
                                style={styles.emptyTitle}
                            >
                                No Payslips Yet
                            </Text>

                            <Text
                                style={styles.emptyText}
                            >
                                Your payslips will appear here
                                once they are issued by admin.
                            </Text>

                        </View>

                    }
                />

            ) : (

                <FlatList
                    data={payslips}

                    renderItem={renderItem}

                    keyExtractor={(item) =>
                        item.id
                    }

                    contentContainerStyle={
                        styles.listContent
                    }

                    showsVerticalScrollIndicator={false}

                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#1e90ff']}
                            tintColor="#1e90ff"
                        />
                    }
                />

            )}

        </SafeAreaView>

    );
};


export default EmployeePayslips;


// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: '#fdfdfd',
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
        color: '#0f172a',
        fontWeight: '600',
    },


    headingContainer: {
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


    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },


    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#8fa8bf',
    },


    emptyContentContainer: {
        flexGrow: 1,
    },


    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0b3d5c',
        marginBottom: 8,
    },


    emptyText: {
        fontSize: 14,
        color: '#8fa8bf',
        textAlign: 'center',
        lineHeight: 20,
    },


    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },


    card: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,

        borderWidth: 1,
        borderColor: '#eaeaea',

        elevation: 2,

        shadowColor: '#000',

        shadowOffset: {
            width: 0,
            height: 1,
        },

        shadowOpacity: 0.05,

        shadowRadius: 3,
    },


    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },


    monthContainer: {
        flex: 1,
        paddingRight: 10,
    },


    monthText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#0b3d5c',
    },


    statusText: {
        fontSize: 11,
        color: '#15a66a',
        marginTop: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },


    netPayText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1e90ff',
    },


    viewText: {
        fontSize: 13,
        color: '#8fa8bf',
        marginTop: 8,
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
});
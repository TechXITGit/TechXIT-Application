import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Clock, Send } from 'lucide-react-native';

const Hiring = ({ navigation }) => {
    const [openings, setOpenings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let directHirings = [];
        let fallbackHirings = [];

        const mergeOpenings = () => {
            const map = new Map();
            directHirings.forEach((h) => map.set(h.id, h));
            fallbackHirings.forEach((h) => map.set(h.id, h));
            const list = Array.from(map.values()).filter((item) => item.status === 'active');
            list.sort((a, b) => {
                const tA = a.createdAt?.seconds || (a.createdAtStr ? new Date(a.createdAtStr).getTime() / 1000 : 0);
                const tB = b.createdAt?.seconds || (b.createdAtStr ? new Date(b.createdAtStr).getTime() / 1000 : 0);
                return tB - tA;
            });
            setOpenings(list);
            setLoading(false);
        };

        const unsubHirings = onSnapshot(
            collection(db, 'hirings'),
            (snapshot) => {
                directHirings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                mergeOpenings();
            },
            (error) => {
                console.log('Hirings public fetch note (using requests fallback):', error.message);
                mergeOpenings();
            }
        );

        const unsubRequests = onSnapshot(
            collection(db, 'requests'),
            (snapshot) => {
                const filtered = [];
                snapshot.docs.forEach((d) => {
                    const data = d.data();
                    if (data.isHiringPost === true || data.type === 'hiring_opening') {
                        filtered.push({ id: d.id, ...data });
                    }
                });
                fallbackHirings = filtered;
                mergeOpenings();
            },
            (error) => {
                console.log('Requests public fetch error:', error.message);
                mergeOpenings();
            }
        );

        return () => {
            unsubHirings();
            unsubRequests();
        };
    }, []);

    const handleApply = (item) => {
        const email = item.contactEmail || 'techxitservices65@gmail.com';
        const subject = encodeURIComponent(`Job Application: ${item.title}`);
        const body = encodeURIComponent(
            `Hi Tech X Team,\n\nI am interested in applying for the position of ${item.title}.\n\nPlease find my resume attached.\n\nThank you!`
        );
        Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
    };

    const renderJob = ({ item }) => {
        const skillsList = Array.isArray(item.skills) ? item.skills : [];

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.tagRow}>
                            <Text style={styles.deptTag}>{item.department || 'Tech'}</Text>
                            <Text style={styles.typeTag}>{item.jobType || 'Full Time'}</Text>
                        </View>
                        <Text style={styles.jobTitle}>{item.title}</Text>
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <DollarSign size={13} color="#0284c7" />
                        <Text style={styles.metaText}>{item.salary || 'Competitive'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <MapPin size={13} color="#64748b" />
                        <Text style={styles.metaText}>{item.location || 'Remote'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Clock size={13} color="#64748b" />
                        <Text style={styles.metaText}>{item.experience || 'Experience required'}</Text>
                    </View>
                </View>

                {skillsList.length > 0 && (
                    <View style={styles.skillsRow}>
                        {skillsList.map((sk, idx) => (
                            <View key={idx} style={styles.skillBadge}>
                                <Text style={styles.skillBadgeText}>{sk}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {item.description ? (
                    <Text style={styles.desc} numberOfLines={3}>
                        {item.description}
                    </Text>
                ) : null}

                <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() => handleApply(item)}
                    activeOpacity={0.88}
                >
                    <Send size={14} color="#ffffff" />
                    <Text style={styles.applyBtnText}>Apply Now</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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

                <Text style={styles.topBarTitle}>Careers & Openings</Text>
                <View style={{ width: 60 }} />
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#0284c7" />
                    <Text style={styles.loadingText}>Loading Openings...</Text>
                </View>
            ) : (
                <FlatList
                    data={openings}
                    keyExtractor={(item) => item.id}
                    renderItem={renderJob}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Briefcase size={44} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>No Openings Right Now</Text>
                            <Text style={styles.emptySub}>
                                We are currently not actively hiring for open roles. Please check back soon!
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default Hiring;

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
    listContent: {
        padding: 16,
        gap: 12,
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
    },
    tagRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 6,
    },
    deptTag: {
        fontSize: 10.5,
        fontWeight: '800',
        color: '#0284c7',
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    typeTag: {
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
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 10,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    skillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 10,
    },
    skillBadge: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    skillBadgeText: {
        fontSize: 11,
        color: '#334155',
        fontWeight: '500',
    },
    desc: {
        fontSize: 12,
        color: '#64748b',
        lineHeight: 17,
        marginTop: 8,
    },
    applyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#0284c7',
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 12,
    },
    applyBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#ffffff',
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
    emptyBox: {
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
    emptySub: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },
});
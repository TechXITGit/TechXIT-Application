import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import {
    collection,
    query,
    where,
    onSnapshot,
} from 'firebase/firestore';
import {
    ArrowLeft,
    FileText,
    Download,
    CheckCircle2,
    Clock,
    Search,
    Receipt,
    DollarSign,
    FolderKanban,
    ChevronRight,
} from 'lucide-react-native';

const Invoice = ({ navigation }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PAID' | 'PENDING'

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            setLoading(false);
            return;
        }

        let directInvoices = [];
        let projectInvoices = [];

        const mergeInvoices = () => {
            const map = new Map();
            directInvoices.forEach((inv) => {
                if (inv && (inv.id || inv.invoiceNumber)) {
                    map.set(inv.id || inv.invoiceNumber, inv);
                }
            });
            projectInvoices.forEach((inv) => {
                if (inv && (inv.id || inv.invoiceNumber)) {
                    map.set(inv.id || inv.invoiceNumber, inv);
                }
            });

            const combined = Array.from(map.values());
            combined.sort((a, b) => {
                const tA = a.createdAt?.seconds || (a.createdAtStr ? new Date(a.createdAtStr).getTime() / 1000 : 0);
                const tB = b.createdAt?.seconds || (b.createdAtStr ? new Date(b.createdAtStr).getTime() / 1000 : 0);
                return tB - tA;
            });

            setInvoices(combined);
            setLoading(false);
        };

        // 1. Fetch from 'invoices' collection for this client (by clientUid OR clientEmail)
        let unsubInvoicesUid = () => {};
        try {
            const qUid = query(
                collection(db, 'invoices'),
                where('clientUid', '==', currentUser.uid)
            );
            unsubInvoicesUid = onSnapshot(
                qUid,
                (snapshot) => {
                    directInvoices = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                    mergeInvoices();
                },
                (err) => {
                    console.log('Invoices fetch by UID note:', err.message);
                    mergeInvoices();
                }
            );
        } catch (e) {
            console.log('Invoices query setup error:', e);
        }

        // 2. Fetch from 'projects' collection for this client to extract embedded/synced invoices
        let unsubProjects = () => {};
        try {
            const qProjects = query(
                collection(db, 'projects'),
                where('clientUid', '==', currentUser.uid)
            );
            unsubProjects = onSnapshot(
                qProjects,
                (snapshot) => {
                    const embedded = [];
                    snapshot.docs.forEach((d) => {
                        const projData = d.data();
                        if (Array.isArray(projData.invoices)) {
                            projData.invoices.forEach((inv) => {
                                embedded.push({
                                    ...inv,
                                    projectId: d.id,
                                    projectTitle: inv.projectTitle || projData.title || projData.serviceName || 'Project',
                                    clientName: inv.clientName || projData.clientName || 'Valued Client',
                                });
                            });
                        } else if (projData.latestInvoice) {
                            embedded.push({
                                ...projData.latestInvoice,
                                projectId: d.id,
                                projectTitle: projData.latestInvoice.projectTitle || projData.title || projData.serviceName || 'Project',
                                clientName: projData.latestInvoice.clientName || projData.clientName || 'Valued Client',
                            });
                        }
                    });
                    projectInvoices = embedded;
                    mergeInvoices();
                },
                (err) => {
                    console.log('Projects invoices fetch note:', err.message);
                    mergeInvoices();
                }
            );
        } catch (e) {
            console.log('Projects query setup error:', e);
        }

        return () => {
            unsubInvoicesUid();
            unsubProjects();
        };
    }, []);

    // Filter by search and status
    const filteredInvoices = invoices.filter((inv) => {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
            (inv.invoiceNumber || '').toLowerCase().includes(q) ||
            (inv.projectTitle || '').toLowerCase().includes(q) ||
            (inv.description || '').toLowerCase().includes(q);

        const status = (inv.status || 'pending').toLowerCase();
        if (filterStatus === 'PAID') return matchesQuery && status === 'paid';
        if (filterStatus === 'PENDING') return matchesQuery && status !== 'paid';
        return matchesQuery;
    });

    // Financial totals
    const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0), 0);
    const totalPaid = invoices
        .filter((inv) => (inv.status || '').toLowerCase() === 'paid')
        .reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0), 0);
    const totalPending = totalBilled - totalPaid;

    const renderInvoiceCard = ({ item }) => {
        const isPaid = (item.status || 'pending').toLowerCase() === 'paid';
        const amount = Number(item.totalAmount || item.amount || 0);

        return (
            <View style={styles.invoiceCard}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                    <View style={styles.invNumberWrap}>
                        <FileText size={14} color="#0284c7" />
                        <Text style={styles.invNumberText}>{item.invoiceNumber || 'INV-TX'}</Text>
                    </View>

                    <View style={[styles.statusBadge, isPaid ? styles.statusPaidBg : styles.statusPendingBg]}>
                        {isPaid ? (
                            <CheckCircle2 size={12} color="#15803d" />
                        ) : (
                            <Clock size={12} color="#b45309" />
                        )}
                        <Text style={[styles.statusText, isPaid ? styles.statusPaidText : styles.statusPendingText]}>
                            {isPaid ? 'PAID' : 'PAYMENT DUE'}
                        </Text>
                    </View>
                </View>

                {/* Project Details */}
                <View style={styles.projectSection}>
                    <View style={styles.projectTitleRow}>
                        <FolderKanban size={15} color="#0f172a" />
                        <Text style={styles.projectTitle} numberOfLines={1}>
                            {item.projectTitle || 'Software Project'}
                        </Text>
                    </View>

                    {item.description ? (
                        <Text style={styles.descText} numberOfLines={2}>
                            {item.description}
                        </Text>
                    ) : null}
                </View>

                {/* Dates Row */}
                <View style={styles.datesRow}>
                    <View style={styles.dateCol}>
                        <Text style={styles.dateLabel}>Issued Date</Text>
                        <Text style={styles.dateValue}>{item.invoiceDate || 'Recent'}</Text>
                    </View>
                    <View style={styles.dateCol}>
                        <Text style={styles.dateLabel}>Due Date</Text>
                        <Text style={styles.dateValue}>{item.dueDate || 'Upon Receipt'}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Amount and Action */}
                <View style={styles.footerRow}>
                    <View>
                        <Text style={styles.amountLabel}>Total Amount</Text>
                        <Text style={styles.amountValue}>₹{amount.toLocaleString('en-IN')}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.viewPdfBtn}
                        onPress={() => navigation.navigate('InvoiceDetail', { invoice: item })}
                        activeOpacity={0.85}
                    >
                        <Download size={14} color="#ffffff" />
                        <Text style={styles.viewPdfBtnText}>View PDF</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
                    <Text style={styles.pageTitle}>My Invoices</Text>
                    <Text style={styles.pageSubtitle}>Official milestone billing statements & receipts</Text>
                </View>
            </View>

            {/* Financial Summary Cards */}
            <View style={styles.summaryWrap}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Total Billed</Text>
                    <Text style={styles.statValue}>₹{totalBilled.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.statBox, { borderColor: '#bbf7d0' }]}>
                    <Text style={[styles.statLabel, { color: '#16a34a' }]}>Paid</Text>
                    <Text style={[styles.statValue, { color: '#15803d' }]}>₹{totalPaid.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.statBox, { borderColor: '#fed7aa' }]}>
                    <Text style={[styles.statLabel, { color: '#ea580c' }]}>Pending</Text>
                    <Text style={[styles.statValue, { color: '#c2410c' }]}>₹{totalPending.toLocaleString('en-IN')}</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarWrap}>
                <Search size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by invoice #, project, milestone..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
                {['ALL', 'PAID', 'PENDING'].map((tab) => (
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
                    <Text style={styles.loadingText}>Loading Your Invoices...</Text>
                </View>
            ) : filteredInvoices.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Receipt size={48} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No Invoices Found</Text>
                    <Text style={styles.emptyDesc}>
                        {searchQuery
                            ? `No invoice matched "${searchQuery}".`
                            : 'When Tech X IT Services generates milestone invoices for your accepted projects, they will be displayed here with downloadable PDF receipts.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredInvoices}
                    renderItem={renderInvoiceCard}
                    keyExtractor={(item) => item.id || item.invoiceNumber}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

export default Invoice;

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
    summaryWrap: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 10,
        marginTop: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        marginTop: 3,
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
        gap: 12,
    },
    invoiceCard: {
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
        alignItems: 'center',
        marginBottom: 10,
    },
    invNumberWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f0f9ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    invNumberText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0284c7',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusPaidBg: {
        backgroundColor: '#dcfce7',
    },
    statusPendingBg: {
        backgroundColor: '#fef3c7',
    },
    statusText: {
        fontSize: 10.5,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    statusPaidText: {
        color: '#15803d',
    },
    statusPendingText: {
        color: '#b45309',
    },
    projectSection: {
        marginBottom: 10,
    },
    projectTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    projectTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
        flex: 1,
    },
    descText: {
        fontSize: 12.5,
        color: '#64748b',
        lineHeight: 17,
    },
    datesRow: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 8,
        marginBottom: 10,
    },
    dateCol: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 10.5,
        fontWeight: '600',
        color: '#94a3b8',
    },
    dateValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 10,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 10.5,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    amountValue: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0f172a',
        marginTop: 2,
    },
    viewPdfBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#0284c7',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    viewPdfBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
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
});
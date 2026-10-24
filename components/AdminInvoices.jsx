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
    arrayUnion,
    serverTimestamp,
} from 'firebase/firestore';
import {
    ArrowLeft,
    Plus,
    FileText,
    Trash2,
    CheckCircle2,
    Clock,
    Search,
    X,
    FolderKanban,
    User,
    DollarSign,
    Receipt,
} from 'lucide-react-native';
import { sendNotification } from './NotificationService';

const AdminInvoices = ({ route, navigation }) => {
    const preselectedProject = route.params?.preselectedProject;

    const [invoices, setInvoices] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PAID' | 'PENDING'

    // Create Invoice Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [milestoneTitle, setMilestoneTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [taxRate, setTaxRate] = useState('0'); // 0 or 18
    const [paymentStatus, setPaymentStatus] = useState('pending'); // 'paid' | 'pending'
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // Format current date e.g. "12 Sep 2026"
    const getFormattedDate = (d = new Date()) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const getDueDate = (days = 15) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return getFormattedDate(d);
    };

    // Load Invoices from BOTH collection('invoices') and collection('projects')
    useEffect(() => {
        let colInvoices = [];
        let projInvoices = [];

        const mergeInvoices = () => {
            const map = new Map();
            colInvoices.forEach((inv) => map.set(inv.id || inv.invoiceNumber, inv));
            projInvoices.forEach((inv) => map.set(inv.id || inv.invoiceNumber, inv));
            const combined = Array.from(map.values());
            combined.sort((a, b) => {
                const tA = a.createdAt?.seconds || (a.createdAtStr ? new Date(a.createdAtStr).getTime() / 1000 : 0);
                const tB = b.createdAt?.seconds || (b.createdAtStr ? new Date(b.createdAtStr).getTime() / 1000 : 0);
                return tB - tA;
            });
            setInvoices(combined);
            setLoading(false);
        };

        // 1. Invoices collection listener
        const unsubInvoices = onSnapshot(
            collection(db, 'invoices'),
            (snapshot) => {
                colInvoices = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));
                mergeInvoices();
            },
            (error) => {
                console.log('Invoices collection listener restricted (will use projects):', error.message);
                mergeInvoices();
            }
        );

        // 2. Projects collection listener to load embedded invoices
        const unsubProjects = onSnapshot(
            collection(db, 'projects'),
            (snapshot) => {
                const validProjects = [];
                const embeddedInvoices = [];

                snapshot.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.status !== 'rejected') {
                        validProjects.push({ id: docSnap.id, ...data });
                    }

                    if (Array.isArray(data.invoices)) {
                        data.invoices.forEach((inv) => {
                            embeddedInvoices.push({
                                ...inv,
                                projectId: docSnap.id,
                                clientName: inv.clientName || data.clientName || 'Valued Client',
                                clientEmail: inv.clientEmail || data.clientEmail || 'N/A',
                                projectTitle: inv.projectTitle || data.title || data.serviceName || 'Software Project',
                            });
                        });
                    } else if (data.latestInvoice) {
                        embeddedInvoices.push({
                            ...data.latestInvoice,
                            projectId: docSnap.id,
                            clientName: data.latestInvoice.clientName || data.clientName || 'Valued Client',
                            clientEmail: data.latestInvoice.clientEmail || data.clientEmail || 'N/A',
                            projectTitle: data.latestInvoice.projectTitle || data.title || data.serviceName || 'Software Project',
                        });
                    }
                });

                setProjects(validProjects);
                projInvoices = embeddedInvoices;
                mergeInvoices();
            },
            (error) => {
                console.log('Projects listener error:', error);
            }
        );

        return () => {
            unsubInvoices();
            unsubProjects();
        };
    }, []);

    // Handle preselected project from route params
    useEffect(() => {
        if (preselectedProject) {
            initCreateForm(preselectedProject);
            setModalVisible(true);
        }
    }, [preselectedProject]);

    const initCreateForm = (proj = null) => {
        const p = proj || (projects.length > 0 ? projects[0] : null);
        setSelectedProject(p);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setInvoiceNumber(`INV-TX-${new Date().getFullYear()}-${randomNum}`);
        setInvoiceDate(getFormattedDate());
        setDueDate(getDueDate(15));
        setMilestoneTitle(p ? `Milestone 1: ${p.title || p.serviceName || 'Custom Development'}` : 'Initial Project Milestone');
        setAmount(p?.budget ? String(p.budget).replace(/[^0-9]/g, '') : '25000');
        setTaxRate('0');
        setPaymentStatus('pending');
        setNotes('Payment is due within 15 calendar days. Thank you for partnering with Tech X IT Services.');
    };

    const handleOpenCreateModal = () => {
        initCreateForm();
        setModalVisible(true);
    };

    const handleSelectProject = (proj) => {
        setSelectedProject(proj);
        setMilestoneTitle(`Milestone 1: ${proj.title || proj.serviceName || 'Custom Development'}`);
        if (proj.budget) {
            setAmount(String(proj.budget).replace(/[^0-9]/g, ''));
        }
    };

    const handleSaveInvoice = async () => {
        if (!selectedProject) {
            Alert.alert('Missing Project', 'Please select an accepted project to bill.');
            return;
        }
        if (!amount || Number(amount) <= 0) {
            Alert.alert('Missing Amount', 'Please enter a valid milestone amount.');
            return;
        }

        setSaving(true);
        try {
            const subtotal = Number(amount);
            const rate = Number(taxRate);
            const taxAmount = (subtotal * rate) / 100;
            const totalAmount = subtotal + taxAmount;

            const invId = `inv_${Date.now()}`;
            const cleanInvoice = {
                id: invId,
                invoiceNumber: invoiceNumber.trim() || `INV-${Date.now().toString().slice(-6)}`,
                projectId: selectedProject.id,
                projectTitle: selectedProject.title || selectedProject.serviceName || 'Software Project',
                clientUid: selectedProject.clientUid || '',
                clientName: selectedProject.clientName || 'Valued Client',
                clientEmail: selectedProject.clientEmail || 'N/A',
                invoiceDate: invoiceDate.trim(),
                dueDate: dueDate.trim(),
                description: milestoneTitle.trim() || 'Software Milestone Deliverable',
                items: [
                    {
                        description: milestoneTitle.trim() || 'Project Deliverable',
                        amount: subtotal,
                    },
                ],
                subtotal: subtotal,
                taxRate: rate,
                taxAmount: taxAmount,
                totalAmount: totalAmount,
                status: paymentStatus,
                notes: notes.trim(),
                createdAtStr: new Date().toISOString(),
            };

            let savedSuccessfully = false;

            // 1. Try to save to invoices collection
            try {
                const docRef = await addDoc(collection(db, 'invoices'), {
                    ...cleanInvoice,
                    createdAt: serverTimestamp(),
                });
                cleanInvoice.id = docRef.id;
                savedSuccessfully = true;
            } catch (colErr) {
                console.log('Direct invoices collection write error (using project fallback):', colErr.message);
            }

            // 2. Always sync / save to the project document in 'projects'
            // (projects collection has write permissions enabled for admins!)
            try {
                await updateDoc(doc(db, 'projects', selectedProject.id), {
                    latestInvoice: cleanInvoice,
                    invoices: arrayUnion(cleanInvoice),
                    hasInvoice: true,
                    updatedAt: serverTimestamp(),
                });
                savedSuccessfully = true;
            } catch (projErr) {
                console.log('Project updateDoc error:', projErr.message);
                if (!savedSuccessfully) throw projErr;
            }

            setModalVisible(false);

            // Trigger In-App Notification to Client
            sendNotification({
                title: 'New Milestone Invoice Issued 📄',
                message: `Invoice #${cleanInvoice.invoiceNumber} for "${cleanInvoice.projectTitle}" (₹${Number(cleanInvoice.totalAmount || 0).toLocaleString('en-IN')}) is ready to view and download.`,
                type: 'invoice',
                role: 'client',
                userId: selectedProject.clientUid || null,
                targetScreen: 'Invoice',
            });

            Alert.alert(
                'Invoice Generated Successfully! 📄',
                `Invoice ${cleanInvoice.invoiceNumber} for client ${cleanInvoice.clientName} (Project: ${cleanInvoice.projectTitle}) has been created.`,
                [
                    { text: 'Done', style: 'cancel' },
                    {
                        text: 'View PDF',
                        onPress: () => navigation.navigate('InvoiceDetail', { invoice: cleanInvoice }),
                    },
                ]
            );
        } catch (error) {
            console.log('Error creating invoice:', error);
            Alert.alert('Error', 'Failed to generate invoice: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteInvoice = (inv) => {
        Alert.alert(
            'Delete Invoice',
            `Are you sure you want to delete invoice ${inv.invoiceNumber}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (inv.id && !inv.id.startsWith('inv_')) {
                                await deleteDoc(doc(db, 'invoices', inv.id));
                            }
                            if (inv.projectId) {
                                await updateDoc(doc(db, 'projects', inv.projectId), {
                                    latestInvoice: null,
                                });
                            }
                        } catch (error) {
                            console.log('Delete invoice error:', error);
                        }
                    },
                },
            ]
        );
    };

    const filteredInvoices = invoices.filter((item) => {
        const matchesQuery =
            (item.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.clientEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.projectTitle || '').toLowerCase().includes(searchQuery.toLowerCase());

        if (filterStatus === 'PAID') return matchesQuery && item.status?.toLowerCase() === 'paid';
        if (filterStatus === 'PENDING') return matchesQuery && item.status?.toLowerCase() !== 'paid';
        return matchesQuery;
    });

    const renderInvoiceCard = ({ item }) => {
        const isPaid = item.status?.toLowerCase() === 'paid';
        const total = Number(item.totalAmount || item.subtotal || item.amount || 0);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('InvoiceDetail', { invoice: item })}
            >
                {/* Header row: Invoice # and Status Badge */}
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardInvoiceNo}>{item.invoiceNumber || 'TX-INV'}</Text>
                        <Text style={styles.cardDate}>Issued: {item.invoiceDate || 'Recent'}</Text>
                    </View>
                    <View style={[styles.statusBadge, isPaid ? styles.statusBadgePaid : styles.statusBadgePending]}>
                        {isPaid ? <CheckCircle2 size={12} color="#15803d" /> : <Clock size={12} color="#b45309" />}
                        <Text style={[styles.statusBadgeText, isPaid ? styles.statusPaidText : styles.statusPendingText]}>
                            {isPaid ? 'PAID' : 'PENDING'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Client Info Banner */}
                <View style={styles.cardClientRow}>
                    <View style={styles.clientAvatarMini}>
                        <Text style={styles.clientAvatarText}>
                            {(item.clientName || 'C').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardClientHeading}>
                            Client: <Text style={styles.cardClientName}>{item.clientName || 'Valued Client'}</Text>
                        </Text>
                        <Text style={styles.cardClientEmail}>{item.clientEmail || 'N/A'}</Text>
                    </View>
                </View>

                {/* Project Banner */}
                <View style={styles.cardProjectBanner}>
                    <FolderKanban size={14} color="#0284c7" />
                    <Text style={styles.cardProjectNameText} numberOfLines={1}>
                        Project: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{item.projectTitle || 'Software Project'}</Text>
                    </Text>
                </View>

                {/* Amount and Due Date */}
                <View style={styles.cardBodyRow}>
                    <View>
                        <Text style={styles.cardLabel}>Deliverable</Text>
                        <Text style={styles.cardMilestoneDesc} numberOfLines={1}>
                            {item.description || 'Milestone Deliverable'}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.cardLabel}>Amount Payable</Text>
                        <Text style={styles.cardAmount}>₹{total.toLocaleString('en-IN')}</Text>
                        <Text style={styles.cardDueDate}>Due: {item.dueDate || 'N/A'}</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                        style={styles.actionBtnView}
                        onPress={() => navigation.navigate('InvoiceDetail', { invoice: item })}
                        activeOpacity={0.7}
                    >
                        <FileText size={14} color="#0284c7" />
                        <Text style={styles.actionBtnViewText}>View / Download PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtnDelete}
                        onPress={() => handleDeleteInvoice(item)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Trash2 size={15} color="#ef4444" />
                    </TouchableOpacity>
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
                    <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.topBarTitle}>Invoices & Billing</Text>

                <TouchableOpacity
                    style={styles.createHeaderBtn}
                    onPress={handleOpenCreateModal}
                    activeOpacity={0.8}
                >
                    <Plus size={16} color="#ffffff" />
                    <Text style={styles.createHeaderBtnText}>New</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarWrap}>
                <Search size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by client name, project, invoice #..."
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

            {/* Invoices List */}
            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#0284c7" />
                    <Text style={styles.loadingText}>Loading Invoices...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredInvoices}
                    keyExtractor={(item) => item.id || item.invoiceNumber}
                    renderItem={renderInvoiceCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Receipt size={44} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>No Invoices Issued Yet</Text>
                            <Text style={styles.emptyDesc}>
                                Select an accepted project below or click "New" to bill client milestones.
                            </Text>
                            <TouchableOpacity
                                style={styles.emptyCreateBtn}
                                onPress={handleOpenCreateModal}
                                activeOpacity={0.8}
                            >
                                <Plus size={16} color="#ffffff" />
                                <Text style={styles.emptyCreateBtnText}>Create First Invoice</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* CREATE INVOICE MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Generate Client Invoice</Text>
                                <Text style={styles.modalSub}>Bill accepted client project milestones</Text>
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
                            {/* Project & Client Selector */}
                            <Text style={styles.inputLabel}>Select Project & Client to Bill *</Text>
                            {projects.length === 0 ? (
                                <Text style={styles.helperText}>No active projects found. Approve a client request first.</Text>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                                    {projects.map((proj) => {
                                        const isSelected = selectedProject?.id === proj.id;
                                        return (
                                            <TouchableOpacity
                                                key={proj.id}
                                                style={[styles.projectSelectCard, isSelected && styles.projectSelectCardActive]}
                                                onPress={() => handleSelectProject(proj)}
                                                activeOpacity={0.8}
                                            >
                                                <View style={styles.projSelectCardHeader}>
                                                    <FolderKanban size={14} color={isSelected ? '#ffffff' : '#0284c7'} />
                                                    <Text style={[styles.projSelectTitle, isSelected && { color: '#ffffff' }]} numberOfLines={1}>
                                                        {proj.title || proj.serviceName}
                                                    </Text>
                                                </View>

                                                <View style={styles.projSelectClientBox}>
                                                    <Text style={[styles.projSelectClientLabel, isSelected && { color: '#e0f2fe' }]}>
                                                        Client: <Text style={{ fontWeight: '700' }}>{proj.clientName || 'N/A'}</Text>
                                                    </Text>
                                                    <Text style={[styles.projSelectClientEmail, isSelected && { color: '#bae6fd' }]} numberOfLines={1}>
                                                        {proj.clientEmail || 'N/A'}
                                                    </Text>
                                                </View>

                                                {proj.budget ? (
                                                    <Text style={[styles.projSelectBudget, isSelected && { color: '#fef08a' }]}>
                                                        Budget: ₹{proj.budget}
                                                    </Text>
                                                ) : null}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}

                            {/* Active Client & Project Summary Box */}
                            {selectedProject && (
                                <View style={styles.clientSummaryCard}>
                                    <View style={styles.summaryTitleRow}>
                                        <CheckCircle2 size={16} color="#15803d" />
                                        <Text style={styles.summaryHeading}>Billing Target Selected:</Text>
                                    </View>
                                    <View style={{ marginTop: 6, gap: 3 }}>
                                        <Text style={styles.summaryProjectText}>
                                            📌 Project: <Text style={{ fontWeight: '800', color: '#0f172a' }}>{selectedProject.title || selectedProject.serviceName}</Text>
                                        </Text>
                                        <Text style={styles.summaryClientText}>
                                            👤 Client Name: <Text style={{ fontWeight: '800', color: '#0284c7' }}>{selectedProject.clientName || 'Valued Client'}</Text>
                                        </Text>
                                        <Text style={styles.summaryEmailText}>
                                            📧 Client Email: <Text style={{ fontWeight: '600', color: '#475569' }}>{selectedProject.clientEmail || 'N/A'}</Text>
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Invoice Number & Date */}
                            <View style={styles.rowTwo}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Invoice Number</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={invoiceNumber}
                                        onChangeText={setInvoiceNumber}
                                        placeholder="INV-TX-2026-001"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Invoice Date</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={invoiceDate}
                                        onChangeText={setInvoiceDate}
                                        placeholder="12 Sep 2026"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </View>

                            {/* Due Date */}
                            <Text style={styles.inputLabel}>Payment Due Date</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={dueDate}
                                onChangeText={setDueDate}
                                placeholder="27 Sep 2026"
                                placeholderTextColor="#94a3b8"
                            />

                            {/* Milestone Title */}
                            <Text style={styles.inputLabel}>Milestone / Deliverable Description *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={milestoneTitle}
                                onChangeText={setMilestoneTitle}
                                placeholder="e.g. Milestone 1: Frontend & Backend Delivery"
                                placeholderTextColor="#94a3b8"
                            />

                            {/* Amount & Tax */}
                            <View style={styles.rowTwo}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Milestone Amount (₹) *</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={amount}
                                        onChangeText={setAmount}
                                        placeholder="25000"
                                        placeholderTextColor="#94a3b8"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>GST / Tax Rate</Text>
                                    <View style={styles.taxToggleRow}>
                                        {['0', '18'].map((rate) => (
                                            <TouchableOpacity
                                                key={rate}
                                                style={[styles.taxChip, taxRate === rate && styles.taxChipActive]}
                                                onPress={() => setTaxRate(rate)}
                                            >
                                                <Text style={[styles.taxChipText, taxRate === rate && styles.taxChipTextActive]}>
                                                    {rate}%
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            {/* Payment Status Toggle */}
                            <Text style={styles.inputLabel}>Payment Status</Text>
                            <View style={styles.statusToggleRow}>
                                <TouchableOpacity
                                    style={[styles.statusToggleBtn, paymentStatus === 'pending' && styles.statusTogglePendingActive]}
                                    onPress={() => setPaymentStatus('pending')}
                                >
                                    <Clock size={14} color={paymentStatus === 'pending' ? '#b45309' : '#64748b'} />
                                    <Text style={[styles.statusToggleText, paymentStatus === 'pending' && { color: '#b45309', fontWeight: '800' }]}>
                                        Payment Pending
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.statusToggleBtn, paymentStatus === 'paid' && styles.statusTogglePaidActive]}
                                    onPress={() => setPaymentStatus('paid')}
                                >
                                    <CheckCircle2 size={14} color={paymentStatus === 'paid' ? '#15803d' : '#64748b'} />
                                    <Text style={[styles.statusToggleText, paymentStatus === 'paid' && { color: '#15803d', fontWeight: '800' }]}>
                                        Mark as Paid
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Terms & Notes */}
                            <Text style={styles.inputLabel}>Notes / Payment Terms</Text>
                            <TextInput
                                style={[styles.modalInput, { height: 65, textAlignVertical: 'top' }]}
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Payment terms or notes..."
                                placeholderTextColor="#94a3b8"
                                multiline
                            />

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={styles.modalSubmitBtn}
                                onPress={handleSaveInvoice}
                                activeOpacity={0.88}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <>
                                        <Plus size={18} color="#ffffff" />
                                        <Text style={styles.modalSubmitBtnText}>Create & Issue Invoice</Text>
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

export default AdminInvoices;

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
    cardInvoiceNo: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
    cardDate: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    statusBadgePaid: {
        backgroundColor: '#dcfce7',
    },
    statusBadgePending: {
        backgroundColor: '#fef3c7',
    },
    statusBadgeText: {
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
    cardDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 10,
    },
    cardClientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    clientAvatarMini: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e0f2fe',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clientAvatarText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0284c7',
    },
    cardClientHeading: {
        fontSize: 12,
        color: '#64748b',
    },
    cardClientName: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f172a',
    },
    cardClientEmail: {
        fontSize: 11,
        color: '#0284c7',
    },
    cardProjectBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f0f9ff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    cardProjectNameText: {
        fontSize: 12,
        color: '#0369a1',
        flex: 1,
    },
    cardBodyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 10,
    },
    cardLabel: {
        fontSize: 10.5,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    cardMilestoneDesc: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
        maxWidth: 180,
    },
    cardAmount: {
        fontSize: 19,
        fontWeight: '900',
        color: '#0284c7',
    },
    cardDueDate: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2,
    },
    cardActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
    },
    actionBtnView: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f0f9ff',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
    },
    actionBtnViewText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0284c7',
    },
    actionBtnDelete: {
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
    helperText: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
    },
    projectSelectCard: {
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        padding: 12,
        borderRadius: 12,
        marginHorizontal: 4,
        width: 220,
    },
    projectSelectCardActive: {
        backgroundColor: '#0284c7',
        borderColor: '#0284c7',
    },
    projSelectCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    projSelectTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f172a',
        flex: 1,
    },
    projSelectClientBox: {
        marginTop: 2,
    },
    projSelectClientLabel: {
        fontSize: 11,
        color: '#475569',
    },
    projSelectClientEmail: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 1,
    },
    projSelectBudget: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0284c7',
        marginTop: 6,
    },
    clientSummaryCard: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
        borderRadius: 12,
        padding: 12,
    },
    summaryTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryHeading: {
        fontSize: 12,
        fontWeight: '800',
        color: '#166534',
    },
    summaryProjectText: {
        fontSize: 12,
        color: '#14532d',
    },
    summaryClientText: {
        fontSize: 12,
        color: '#14532d',
    },
    summaryEmailText: {
        fontSize: 11,
        color: '#166534',
    },
    taxToggleRow: {
        flexDirection: 'row',
        gap: 8,
    },
    taxChip: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    taxChipActive: {
        backgroundColor: '#0284c7',
        borderColor: '#0284c7',
    },
    taxChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    taxChipTextActive: {
        color: '#ffffff',
    },
    statusToggleRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statusToggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statusTogglePendingActive: {
        backgroundColor: '#fef3c7',
        borderColor: '#fde68a',
    },
    statusTogglePaidActive: {
        backgroundColor: '#dcfce7',
        borderColor: '#bbf7d0',
    },
    statusToggleText: {
        fontSize: 12,
        color: '#64748b',
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

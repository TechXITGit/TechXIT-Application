import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import {
    ArrowLeft,
    User,
    Calendar,
    Search,
    CheckCircle2,
    TrendingUp,
    TrendingDown,
    FileText,
    Mail,
    Plus,
    Clock,
    Trash2,
    ChevronRight,
    Sparkles,
} from 'lucide-react-native';
import { sendNotification } from './NotificationService';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const AdminPayslips = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('CREATE'); // 'CREATE' | 'ISSUED'

    // Employees state
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Form inputs for creating a payslip
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [basicPay, setBasicPay] = useState('');
    const [hra, setHra] = useState('0');
    const [otherAllowances, setOtherAllowances] = useState('0');
    const [pf, setPf] = useState('0');
    const [tds, setTds] = useState('0');
    const [otherDeductions, setOtherDeductions] = useState('0');
    const [submitting, setSubmitting] = useState(false);

    // Issued payslips history state
    const [issuedPayslips, setIssuedPayslips] = useState([]);
    const [loadingIssued, setLoadingIssued] = useState(true);
    const [searchIssuedQuery, setSearchIssuedQuery] = useState('');

    // Generate recent 6 months for 1-click select
    const recentMonths = React.useMemo(() => {
        const list = [];
        const d = new Date();
        for (let i = 0; i < 6; i++) {
            const current = new Date(d.getFullYear(), d.getMonth() - i, 1);
            const mName = MONTH_NAMES[current.getMonth()];
            const yStr = String(current.getFullYear());
            list.push({
                month: mName,
                year: yStr,
                label: `${mName.slice(0, 3)} ${yStr}`,
            });
        }
        return list;
    }, []);

    // Set default month & year to current month
    useEffect(() => {
        if (recentMonths.length > 0 && !month) {
            setMonth(recentMonths[0].month);
            setYear(recentMonths[0].year);
        }
    }, [recentMonths]);

    // Fetch approved employees from Firestore
    useEffect(() => {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'employee'), where('approved', '==', true));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                }));
                data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                setEmployees(data);
                setLoadingEmployees(false);
            },
            (error) => {
                console.log('Fetch employees error:', error.message);
                setLoadingEmployees(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Fetch previously issued payslips from Firestore
    useEffect(() => {
        const payslipsRef = collection(db, 'payslips');
        const unsubscribe = onSnapshot(
            payslipsRef,
            (snapshot) => {
                const list = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));
                list.sort((a, b) => {
                    const tA = a.createdAt?.seconds || 0;
                    const tB = b.createdAt?.seconds || 0;
                    return tB - tA;
                });
                setIssuedPayslips(list);
                setLoadingIssued(false);
            },
            (error) => {
                console.log('Fetch issued payslips error:', error.message);
                setLoadingIssued(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Financial calculations
    const numBasic = Number(basicPay || 0);
    const numHra = Number(hra || 0);
    const numOtherAllow = Number(otherAllowances || 0);
    const totalEarnings = numBasic + numHra + numOtherAllow;

    const numPf = Number(pf || 0);
    const numTds = Number(tds || 0);
    const numOtherDed = Number(otherDeductions || 0);
    const totalDeductions = numPf + numTds + numOtherDed;

    const netPay = Math.max(0, totalEarnings - totalDeductions);

    const resetForm = () => {
        setBasicPay('');
        setHra('0');
        setOtherAllowances('0');
        setPf('0');
        setTds('0');
        setOtherDeductions('0');
    };

    const handleSelectEmployee = (emp) => {
        setSelectedEmployee(emp);
        resetForm();
    };

    const handleCreatePayslip = async () => {
        if (!selectedEmployee) {
            Alert.alert('Missing Employee', 'Please select an employee first.');
            return;
        }
        if (!month.trim() || !year.trim()) {
            Alert.alert('Missing Period', 'Please select or enter the month and year.');
            return;
        }
        if (!basicPay || numBasic <= 0) {
            Alert.alert('Missing Basic Pay', 'Please enter a valid Basic Pay amount.');
            return;
        }

        setSubmitting(true);
        try {
            const payslipData = {
                employeeUid: selectedEmployee.id,
                employeeName: selectedEmployee.name || 'Tech X Employee',
                employeeEmail: selectedEmployee.email || '',
                employeeRole: selectedEmployee.role || selectedEmployee.designation || 'Software Engineer',
                month: month.trim(),
                year: year.trim(),
                basicPay: numBasic,
                allowances: numHra + numOtherAllow,
                deductions: totalDeductions,
                netPay: netPay,
                breakdown: {
                    basicSalary: numBasic,
                    hra: numHra,
                    otherAllowances: numOtherAllow,
                    pf: numPf,
                    tds: numTds,
                    otherDeductions: numOtherDed,
                },
                status: 'issued',
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'payslips'), payslipData);
            const createdPayslip = { id: docRef.id, ...payslipData };

            // In-app notification to Employee
            sendNotification({
                title: 'Salary Payslip Issued 📄',
                message: `Your salary statement for ${month} ${year} (₹${netSalary.toLocaleString('en-IN')}) is now available to download.`,
                type: 'payslip',
                role: 'employee',
                userId: selectedEmployee.id || selectedEmployee.uid,
                targetScreen: 'AdminPayslips',
            });

            Alert.alert(
                'Payslip Issued Successfully! 🎉',
                `Official salary statement for ${selectedEmployee.name} (${month} ${year}) has been generated.`,
                [
                    {
                        text: 'View PDF Document',
                        onPress: () => {
                            resetForm();
                            setSelectedEmployee(null);
                            setActiveTab('ISSUED');
                            navigation.navigate('PayslipDetail', { payslip: createdPayslip });
                        },
                    },
                    {
                        text: 'Done',
                        style: 'cancel',
                        onPress: () => {
                            resetForm();
                            setSelectedEmployee(null);
                            setActiveTab('ISSUED');
                        },
                    },
                ]
            );
        } catch (error) {
            console.log('Payslip creation error:', error);
            Alert.alert('Error', 'Failed to generate payslip: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePayslip = (item) => {
        Alert.alert(
            'Delete Payslip',
            `Are you sure you want to delete the salary statement for ${item.employeeName} (${item.month} ${item.year})?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'payslips', item.id));
                        } catch (err) {
                            Alert.alert('Error', 'Could not delete payslip: ' + err.message);
                        }
                    },
                },
            ]
        );
    };

    const getInitials = (name = '') => {
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length === 0) return 'TX';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const formatTimestamp = (ts) => {
        if (!ts) return 'Recent';
        if (ts.toDate) {
            return ts.toDate().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        }
        return 'Recent';
    };

    // Filter employees by search query
    const filteredEmployees = employees.filter((emp) => {
        const q = searchQuery.toLowerCase();
        return (
            (emp.name || '').toLowerCase().includes(q) ||
            (emp.email || '').toLowerCase().includes(q) ||
            (emp.role || '').toLowerCase().includes(q) ||
            (emp.designation || '').toLowerCase().includes(q)
        );
    });

    // Filter issued payslips by search query
    const filteredIssued = issuedPayslips.filter((slip) => {
        const q = searchIssuedQuery.toLowerCase();
        return (
            (slip.employeeName || '').toLowerCase().includes(q) ||
            (slip.month || '').toLowerCase().includes(q) ||
            (slip.year || '').toLowerCase().includes(q) ||
            (slip.employeeRole || '').toLowerCase().includes(q)
        );
    });

    // Render Employee Card in Directory
    const renderEmployeeCard = ({ item }) => {
        const initials = getInitials(item.name);
        return (
            <TouchableOpacity
                style={styles.empCard}
                onPress={() => handleSelectEmployee(item)}
                activeOpacity={0.8}
            >
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>

                <View style={styles.empInfo}>
                    <View style={styles.empNameRow}>
                        <Text style={styles.empName}>{item.name}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleBadgeText}>
                                {item.designation || item.role || 'Employee'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.empDetailRow}>
                        <Mail size={12} color="#64748b" />
                        <Text style={styles.empEmail} numberOfLines={1}>
                            {item.email || 'No email registered'}
                        </Text>
                    </View>
                </View>

                <View style={styles.empSelectAction}>
                    <Text style={styles.empSelectActionText}>Create Slip</Text>
                    <ChevronRight size={14} color="#ffffff" />
                </View>
            </TouchableOpacity>
        );
    };

    // Render Issued Payslip Card
    const renderIssuedCard = ({ item }) => {
        const initials = getInitials(item.employeeName);
        return (
            <View style={styles.issuedCard}>
                <View style={styles.issuedCardHeader}>
                    <View style={styles.avatarCircleSmall}>
                        <Text style={styles.avatarTextSmall}>{initials}</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.issuedEmpName}>{item.employeeName}</Text>
                        <View style={styles.periodRow}>
                            <Text style={styles.issuedPeriodBadge}>
                                {item.month} {item.year}
                            </Text>
                            <Text style={styles.issuedRoleText}>
                                {item.employeeRole || 'Employee'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.issuedAmountBox}>
                        <Text style={styles.issuedAmountLabel}>Net Pay</Text>
                        <Text style={styles.issuedAmountValue}>
                            ₹{Number(item.netPay || 0).toLocaleString('en-IN')}
                        </Text>
                    </View>
                </View>

                <View style={styles.issuedCardDivider} />

                <View style={styles.issuedCardFooter}>
                    <View style={styles.dateWrap}>
                        <Clock size={12} color="#64748b" />
                        <Text style={styles.issuedDateText}>
                            Issued: {formatTimestamp(item.createdAt)}
                        </Text>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.viewPdfBtn}
                            onPress={() => navigation.navigate('PayslipDetail', { payslip: item })}
                            activeOpacity={0.8}
                        >
                            <FileText size={13} color="#ffffff" />
                            <Text style={styles.viewPdfBtnText}>View PDF</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteSlipBtn}
                            onPress={() => handleDeletePayslip(item)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Trash2 size={15} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* Top Header */}
            <View style={styles.topHeader}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                        if (selectedEmployee) {
                            setSelectedEmployee(null);
                        } else if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.navigate('Home');
                        }
                    }}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={20} color="#0f172a" />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                    <Text style={styles.pageTitle}>Payroll & Payslips</Text>
                    <Text style={styles.pageSubtitle}>
                        {selectedEmployee
                            ? `Issue salary slip for ${selectedEmployee.name}`
                            : 'Generate and manage official salary statements'}
                    </Text>
                </View>
            </View>

            {/* If no employee is actively selected in create mode, show Tabs */}
            {!selectedEmployee && (
                <View style={styles.tabsRow}>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'CREATE' && styles.tabBtnActive]}
                        onPress={() => setActiveTab('CREATE')}
                        activeOpacity={0.75}
                    >
                        <Plus size={15} color={activeTab === 'CREATE' ? '#ffffff' : '#64748b'} />
                        <Text style={[styles.tabBtnText, activeTab === 'CREATE' && styles.tabBtnTextActive]}>
                            Create Payslip
                        </Text>
                        <View style={[styles.tabBadge, activeTab === 'CREATE' && styles.tabBadgeActive]}>
                            <Text style={[styles.tabBadgeText, activeTab === 'CREATE' && styles.tabBadgeTextActive]}>
                                {employees.length}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'ISSUED' && styles.tabBtnActive]}
                        onPress={() => setActiveTab('ISSUED')}
                        activeOpacity={0.75}
                    >
                        <FileText size={15} color={activeTab === 'ISSUED' ? '#ffffff' : '#64748b'} />
                        <Text style={[styles.tabBtnText, activeTab === 'ISSUED' && styles.tabBtnTextActive]}>
                            Issued Statements
                        </Text>
                        <View style={[styles.tabBadge, activeTab === 'ISSUED' && styles.tabBadgeActive]}>
                            <Text style={[styles.tabBadgeText, activeTab === 'ISSUED' && styles.tabBadgeTextActive]}>
                                {issuedPayslips.length}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            {/* ============================================================= */}
            {/* VIEW 1: CREATION FLOW */}
            {/* ============================================================= */}
            {activeTab === 'CREATE' && (
                <>
                    {/* STEP 2: FORM (When Employee is Selected) */}
                    {selectedEmployee ? (
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={{ flex: 1 }}
                        >
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.formContainer}
                            >
                                {/* Selected Employee Card */}
                                <View style={styles.selectedEmpCard}>
                                    <View style={styles.avatarCircleSelected}>
                                        <Text style={styles.avatarTextSelected}>
                                            {getInitials(selectedEmployee.name)}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={styles.selectedEmpName}>{selectedEmployee.name}</Text>
                                            <CheckCircle2 size={15} color="#0284c7" />
                                        </View>
                                        <Text style={styles.selectedEmpEmail}>{selectedEmployee.email}</Text>
                                        <Text style={styles.selectedEmpMeta}>
                                            ID: TX-{(selectedEmployee.id || 'EMP').slice(0, 8).toUpperCase()} • {selectedEmployee.designation || selectedEmployee.role || 'Staff'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.switchEmpBtn}
                                        onPress={() => setSelectedEmployee(null)}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={styles.switchEmpBtnText}>Change</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* SECTION 1: PAY PERIOD */}
                                <View style={styles.sectionCard}>
                                    <View style={styles.sectionHeader}>
                                        <Calendar size={16} color="#0284c7" />
                                        <Text style={styles.sectionTitle}>Pay Period</Text>
                                    </View>

                                    <Text style={styles.helperText}>Select month or enter custom period:</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.monthScroll}
                                    >
                                        {recentMonths.map((m, idx) => {
                                            const isSelected = month === m.month && year === m.year;
                                            return (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={[styles.monthChip, isSelected && styles.monthChipActive]}
                                                    onPress={() => {
                                                        setMonth(m.month);
                                                        setYear(m.year);
                                                    }}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text
                                                        style={[styles.monthChipText, isSelected && styles.monthChipTextActive]}
                                                    >
                                                        {m.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    <View style={styles.rowTwo}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputLabel}>Month Name</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={month}
                                                onChangeText={setMonth}
                                                placeholder="e.g. September"
                                                placeholderTextColor="#94a3b8"
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputLabel}>Year</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={year}
                                                onChangeText={setYear}
                                                placeholder="2026"
                                                placeholderTextColor="#94a3b8"
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* SECTION 2: EARNINGS & ALLOWANCES */}
                                <View style={styles.sectionCard}>
                                    <View style={styles.sectionHeader}>
                                        <TrendingUp size={16} color="#16a34a" />
                                        <Text style={styles.sectionTitle}>Earnings & Allowances</Text>
                                        <View style={styles.grossBadge}>
                                            <Text style={styles.grossBadgeText}>
                                                Gross: ₹{totalEarnings.toLocaleString('en-IN')}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Basic Pay */}
                                    <Text style={styles.inputLabel}>Basic Salary *</Text>
                                    <View style={styles.currencyInputWrap}>
                                        <View style={styles.currencyPrefix}>
                                            <Text style={styles.currencySymbol}>₹</Text>
                                        </View>
                                        <TextInput
                                            style={styles.currencyInput}
                                            placeholder="e.g. 35000"
                                            placeholderTextColor="#94a3b8"
                                            value={basicPay}
                                            onChangeText={setBasicPay}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={styles.rowTwo}>
                                        {/* HRA */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputLabel}>House Rent (HRA)</Text>
                                            <View style={styles.currencyInputWrap}>
                                                <View style={styles.currencyPrefix}>
                                                    <Text style={styles.currencySymbol}>₹</Text>
                                                </View>
                                                <TextInput
                                                    style={styles.currencyInput}
                                                    placeholder="0"
                                                    placeholderTextColor="#94a3b8"
                                                    value={hra}
                                                    onChangeText={setHra}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </View>

                                        {/* Other Allowances */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputLabel}>Special Allowances</Text>
                                            <View style={styles.currencyInputWrap}>
                                                <View style={styles.currencyPrefix}>
                                                    <Text style={styles.currencySymbol}>₹</Text>
                                                </View>
                                                <TextInput
                                                    style={styles.currencyInput}
                                                    placeholder="0"
                                                    placeholderTextColor="#94a3b8"
                                                    value={otherAllowances}
                                                    onChangeText={setOtherAllowances}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* SECTION 3: DEDUCTIONS */}
                                <View style={styles.sectionCard}>
                                    <View style={styles.sectionHeader}>
                                        <TrendingDown size={16} color="#ef4444" />
                                        <Text style={styles.sectionTitle}>Deductions</Text>
                                        <View style={styles.deductionBadge}>
                                            <Text style={styles.deductionBadgeText}>
                                                Total: -₹{totalDeductions.toLocaleString('en-IN')}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.rowThree}>
                                        {/* PF */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputLabel}>PF</Text>
                                            <View style={styles.currencyInputWrap}>
                                                <View style={styles.currencyPrefix}>
                                                    <Text style={styles.currencySymbol}>₹</Text>
                                                </View>
                                                <TextInput
                                                    style={styles.currencyInput}
                                                    placeholder="0"
                                                    placeholderTextColor="#94a3b8"
                                                    value={pf}
                                                    onChangeText={setPf}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </View>

                                        {/* TDS / Tax */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputLabel}>TDS / Tax</Text>
                                            <View style={styles.currencyInputWrap}>
                                                <View style={styles.currencyPrefix}>
                                                    <Text style={styles.currencySymbol}>₹</Text>
                                                </View>
                                                <TextInput
                                                    style={styles.currencyInput}
                                                    placeholder="0"
                                                    placeholderTextColor="#94a3b8"
                                                    value={tds}
                                                    onChangeText={setTds}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </View>

                                        {/* Other */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputLabel}>Other</Text>
                                            <View style={styles.currencyInputWrap}>
                                                <View style={styles.currencyPrefix}>
                                                    <Text style={styles.currencySymbol}>₹</Text>
                                                </View>
                                                <TextInput
                                                    style={styles.currencyInput}
                                                    placeholder="0"
                                                    placeholderTextColor="#94a3b8"
                                                    value={otherDeductions}
                                                    onChangeText={setOtherDeductions}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* SECTION 4: NET TAKE-HOME SUMMARY BANNER */}
                                <View style={styles.summaryCard}>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Total Gross Salary</Text>
                                        <Text style={styles.summaryValPositive}>+ ₹{totalEarnings.toLocaleString('en-IN')}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Total Deductions</Text>
                                        <Text style={styles.summaryValNegative}>- ₹{totalDeductions.toLocaleString('en-IN')}</Text>
                                    </View>
                                    <View style={styles.summaryDivider} />
                                    <View style={styles.netPayRow}>
                                        <View>
                                            <Text style={styles.netPaySub}>Net Take-Home Salary</Text>
                                            <Text style={styles.netPayDesc}>Official amount credited to employee</Text>
                                        </View>
                                        <Text style={styles.netPayMainVal}>₹{netPay.toLocaleString('en-IN')}</Text>
                                    </View>
                                </View>

                                {/* Issue Button */}
                                <TouchableOpacity
                                    style={[styles.issueBtn, submitting && styles.issueBtnDisabled]}
                                    onPress={handleCreatePayslip}
                                    disabled={submitting}
                                    activeOpacity={0.88}
                                >
                                    {submitting ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <>
                                            <FileText size={18} color="#ffffff" />
                                            <Text style={styles.issueBtnText}>Issue Official Payslip</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    ) : (
                        /* STEP 1: CHOOSE EMPLOYEE DIRECTORY */
                        <>
                            {/* Search Bar */}
                            <View style={styles.searchBarWrap}>
                                <Search size={16} color="#64748b" style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search by employee name, email, role..."
                                    placeholderTextColor="#94a3b8"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>

                            {/* Section Banner */}
                            <View style={styles.stepBanner}>
                                <Text style={styles.stepBannerTitle}>Select Employee to Issue Payslip</Text>
                                <Text style={styles.stepBannerSub}>
                                    Tap on any team member below to configure their salary statement
                                </Text>
                            </View>

                            {/* Employee List */}
                            {loadingEmployees ? (
                                <View style={styles.centerBox}>
                                    <ActivityIndicator size="large" color="#0284c7" />
                                    <Text style={styles.loadingText}>Loading Team Directory...</Text>
                                </View>
                            ) : filteredEmployees.length === 0 ? (
                                <View style={styles.emptyBox}>
                                    <User size={44} color="#cbd5e1" />
                                    <Text style={styles.emptyTitle}>No Employees Found</Text>
                                    <Text style={styles.emptyDesc}>
                                        {searchQuery
                                            ? `No employee matched "${searchQuery}". Try searching another name or email.`
                                            : 'No approved employees found in Tech X system.'}
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={filteredEmployees}
                                    renderItem={renderEmployeeCard}
                                    keyExtractor={(item) => item.id}
                                    contentContainerStyle={styles.listContent}
                                    showsVerticalScrollIndicator={false}
                                />
                            )}
                        </>
                    )}
                </>
            )}

            {/* ============================================================= */}
            {/* VIEW 2: ISSUED PAYSLIPS HISTORY */}
            {/* ============================================================= */}
            {activeTab === 'ISSUED' && (
                <>
                    {/* Search Bar */}
                    <View style={styles.searchBarWrap}>
                        <Search size={16} color="#64748b" style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by employee name, month, year..."
                            placeholderTextColor="#94a3b8"
                            value={searchIssuedQuery}
                            onChangeText={setSearchIssuedQuery}
                        />
                    </View>

                    {loadingIssued ? (
                        <View style={styles.centerBox}>
                            <ActivityIndicator size="large" color="#0284c7" />
                            <Text style={styles.loadingText}>Loading Issued Payslips...</Text>
                        </View>
                    ) : filteredIssued.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <FileText size={44} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>No Issued Payslips</Text>
                            <Text style={styles.emptyDesc}>
                                {searchIssuedQuery
                                    ? `No payslips found for "${searchIssuedQuery}".`
                                    : 'No payslips have been generated yet. Switch to "Create Payslip" to issue the first salary statement.'}
                            </Text>
                            <TouchableOpacity
                                style={styles.createFirstBtn}
                                onPress={() => setActiveTab('CREATE')}
                                activeOpacity={0.8}
                            >
                                <Plus size={16} color="#ffffff" />
                                <Text style={styles.createFirstBtnText}>Create Payslip Now</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredIssued}
                            renderItem={renderIssuedCard}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </>
            )}
        </SafeAreaView>
    );
};

export default AdminPayslips;

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

    // Tabs
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    tabBtnActive: {
        backgroundColor: '#0284c7',
        borderColor: '#0284c7',
    },
    tabBtnText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#64748b',
    },
    tabBtnTextActive: {
        color: '#ffffff',
    },
    tabBadge: {
        backgroundColor: '#e2e8f0',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 10,
    },
    tabBadgeActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    tabBadgeText: {
        fontSize: 10.5,
        fontWeight: '800',
        color: '#475569',
    },
    tabBadgeTextActive: {
        color: '#ffffff',
    },

    // Search Bar
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
    stepBanner: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 2,
    },
    stepBannerTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    stepBannerSub: {
        fontSize: 11.5,
        color: '#64748b',
        marginTop: 2,
    },
    listContent: {
        padding: 16,
        gap: 12,
    },

    // Employee Selection Cards
    empCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1.5,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0284c7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#ffffff',
    },
    empInfo: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    empNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    empName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
    },
    roleBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    roleBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'capitalize',
    },
    empDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    empEmail: {
        fontSize: 12,
        color: '#64748b',
    },
    empSelectAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#0f172a',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
    },
    empSelectActionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
    },

    // FORM STYLES
    formContainer: {
        padding: 16,
        gap: 14,
        paddingBottom: 40,
    },
    selectedEmpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#0284c7',
        shadowColor: '#0284c7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },
    avatarCircleSelected: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarTextSelected: {
        fontSize: 16,
        fontWeight: '800',
        color: '#ffffff',
    },
    selectedEmpName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
    selectedEmpEmail: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    selectedEmpMeta: {
        fontSize: 11,
        fontWeight: '600',
        color: '#0284c7',
        marginTop: 3,
    },
    switchEmpBtn: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    switchEmpBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },

    // Section Cards
    sectionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
        flex: 1,
    },
    grossBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    grossBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#16a34a',
    },
    deductionBadge: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    deductionBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#ef4444',
    },
    helperText: {
        fontSize: 12,
        color: '#64748b',
    },
    monthScroll: {
        marginHorizontal: -4,
        marginBottom: 6,
    },
    monthChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    monthChipActive: {
        backgroundColor: '#0284c7',
        borderColor: '#0284c7',
    },
    monthChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    monthChipTextActive: {
        color: '#ffffff',
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        paddingHorizontal: 12,
        height: 42,
        fontSize: 13,
        color: '#0f172a',
    },
    currencyInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        overflow: 'hidden',
        height: 42,
    },
    currencyPrefix: {
        backgroundColor: '#e2e8f0',
        paddingHorizontal: 10,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: 14,
        fontWeight: '800',
        color: '#475569',
    },
    currencyInput: {
        flex: 1,
        paddingHorizontal: 10,
        fontSize: 13,
        color: '#0f172a',
        fontWeight: '600',
    },
    rowTwo: {
        flexDirection: 'row',
        gap: 12,
    },
    rowThree: {
        flexDirection: 'row',
        gap: 8,
    },

    // SUMMARY CARD
    summaryCard: {
        backgroundColor: '#0f172a',
        borderRadius: 16,
        padding: 18,
        gap: 8,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '500',
    },
    summaryValPositive: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4ade80',
    },
    summaryValNegative: {
        fontSize: 13,
        fontWeight: '700',
        color: '#f87171',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#334155',
        marginVertical: 4,
    },
    netPayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 4,
    },
    netPaySub: {
        fontSize: 14,
        fontWeight: '800',
        color: '#ffffff',
    },
    netPayDesc: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2,
    },
    netPayMainVal: {
        fontSize: 22,
        fontWeight: '900',
        color: '#38bdf8',
        letterSpacing: -0.5,
    },

    // Issue Action Button
    issueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0284c7',
        borderRadius: 14,
        height: 52,
        marginTop: 4,
        shadowColor: '#0284c7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    issueBtnDisabled: {
        opacity: 0.65,
    },
    issueBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#ffffff',
    },

    // ISSUED PAYSLIPS CARDS
    issuedCard: {
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
    issuedCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarCircleSmall: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0284c7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarTextSmall: {
        fontSize: 14,
        fontWeight: '800',
        color: '#ffffff',
    },
    issuedEmpName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
    },
    periodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 3,
    },
    issuedPeriodBadge: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0284c7',
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    issuedRoleText: {
        fontSize: 11,
        color: '#64748b',
        textTransform: 'capitalize',
    },
    issuedAmountBox: {
        alignItems: 'flex-end',
    },
    issuedAmountLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    issuedAmountValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0f172a',
        marginTop: 2,
    },
    issuedCardDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 12,
    },
    issuedCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    issuedDateText: {
        fontSize: 11.5,
        color: '#64748b',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    viewPdfBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#0284c7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    viewPdfBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
    },
    deleteSlipBtn: {
        padding: 6,
    },
    createFirstBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#0284c7',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 18,
    },
    createFirstBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#ffffff',
    },

    // Empty & Loader
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
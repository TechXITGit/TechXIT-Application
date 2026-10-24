import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState } from 'react'
import { auth, db } from '../firebaseConfig'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import emailjs from '@emailjs/browser'
import {
    ArrowLeft,
    CheckCircle2,
    ShieldCheck,
    Clock,
    Sparkles,
    Send,
    Award,
} from 'lucide-react-native'
import { sendNotification } from './NotificationService'

const ADMIN_EMAIL = 'techxitservices65@gmail.com';

const EMAILJS_SERVICE_ID = 'service_qm71axm';
const EMAILJS_TEMPLATE_ID = 'template_1h1zbfj';
const EMAILJS_PUBLIC_KEY = 'SFIcJwtIZcLBAF3vC';

const SUGGESTED_BUDGETS = ['15000', '30000', '50000', '100000'];

const INCLUDED_PERKS = [
    { title: 'Dedicated Tech Lead', desc: 'Single point of contact for daily updates' },
    { title: 'Architecture & Code Quality', desc: 'Scalable, documented & peer-reviewed code' },
    { title: 'Full IP & Code Ownership', desc: '100% rights transferred upon completion' },
    { title: 'Post-Delivery Warranty', desc: 'Free bug support and deployment assistance' },
];

const ServiceDetail = ({ route, navigation }) => {
    const { service } = route.params;

    const [budget, setBudget] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const currentUser = auth.currentUser;
    const clientName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Valued Client';
    const clientEmail = currentUser?.email || 'N/A';

    const handleSubmit = async () => {
        if (!budget) {
            Alert.alert('Missing Fields', 'Please enter your estimated budget.');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Error', 'You must be logged in to request a service');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'requests'), {
                serviceId: service.id,
                serviceName: service.title,
                clientUid: user.uid,
                clientName: user.displayName || 'N/A',
                clientEmail: user.email,
                budget: budget.trim(),
                notes: notes.trim(),
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            // Trigger In-App Notification to Admin
            sendNotification({
                title: 'New Service Proposal 📋',
                message: `${user.displayName || user.email?.split('@')[0] || 'Client'} requested ${service.title} (Budget: ₹${Number(budget.trim() || 0).toLocaleString('en-IN')})`,
                type: 'project',
                role: 'admin',
                targetScreen: 'AdminClients',
            });

            // Trigger In-App Confirmation to Client
            sendNotification({
                title: 'Proposal Submitted Successfully 📋',
                message: `Your quote request for ${service.title} has been received. Our team will review your scope and assign a lead developer shortly!`,
                type: 'project',
                role: 'client',
                userId: user.uid,
                userEmail: user.email,
                targetScreen: 'Services',
            });

            try {
                await emailjs.send(
                    EMAILJS_SERVICE_ID,
                    EMAILJS_TEMPLATE_ID,
                    {
                        to_email: ADMIN_EMAIL,
                        client_name: user.displayName || 'N/A',
                        client_email: user.email,
                        service_name: service.title,
                        budget: budget.trim(),
                        notes: notes.trim() || 'No additional notes',
                    },
                    EMAILJS_PUBLIC_KEY
                );
            } catch (emailError) {
                console.log('Email send failed:', emailError);
            }

            Alert.alert(
                'Request Submitted Successfully! 🎉',
                'Your service request has been received. Our solutions team will review your requirements and get in touch within 24 hours.',
                [{ text: 'Great!', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.log('Request submit error:', error.message);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header Back Bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <ArrowLeft size={20} color="#0f172a" />
                    </TouchableOpacity>
                    <Text style={styles.topBarTitle} numberOfLines={1}>
                        {service.title}
                    </Text>
                </View>

                <ScrollView
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Hero Banner */}
                    <View style={styles.heroWrap}>
                        <Image
                            source={service.image || { uri: service.imageUrl }}
                            style={styles.heroImage}
                            resizeMode="cover"
                        />
                        <View style={styles.heroOverlay} />
                        <View style={styles.badgeRow}>
                            <View style={styles.verifiedBadge}>
                                <Award size={13} color="#ffffff" />
                                <Text style={styles.verifiedText}>Official Tech X Service</Text>
                            </View>
                            {service.category && (
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryBadgeText}>{service.category}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Service Overview */}
                    <View style={styles.infoBlock}>
                        <Text style={styles.title}>{service.title}</Text>
                        <Text style={styles.description}>{service.description}</Text>

                        {/* Quick Highlights Pill Row */}
                        <View style={styles.highlightRow}>
                            <View style={styles.highlightItem}>
                                <Clock size={14} color="#0284c7" />
                                <Text style={styles.highlightText}>
                                    {service.timeline || 'Custom MileStone'}
                                </Text>
                            </View>
                            <View style={styles.highlightItem}>
                                <ShieldCheck size={14} color="#0d9488" />
                                <Text style={styles.highlightText}>NDA Protected</Text>
                            </View>
                            <View style={styles.highlightItem}>
                                <Sparkles size={14} color="#7c3aed" />
                                <Text style={styles.highlightText}>Senior Devs</Text>
                            </View>
                        </View>
                    </View>

                    {/* What's Included */}
                    <View style={styles.includedCard}>
                        <Text style={styles.includedHeading}>What You Get</Text>
                        <View style={styles.perksList}>
                            {INCLUDED_PERKS.map((perk, index) => (
                                <View key={index} style={styles.perkItem}>
                                    <View style={styles.checkWrap}>
                                        <CheckCircle2 size={16} color="#0284c7" />
                                    </View>
                                    <View style={styles.perkTextWrap}>
                                        <Text style={styles.perkTitle}>{perk.title}</Text>
                                        <Text style={styles.perkDesc}>{perk.desc}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Request Form */}
                    <View style={styles.formCard}>
                        <View style={styles.formHeader}>
                            <Text style={styles.formHeading}>Request a Formal Proposal</Text>
                            <Text style={styles.formSub}>
                                Share your target budget and goals to receive a scoped estimate.
                            </Text>
                        </View>

                        {/* Budget Input */}
                        <Text style={styles.label}>Estimated Budget (₹)</Text>
                        <View style={styles.budgetInputContainer}>
                            <View style={styles.currencySymbolBox}>
                                <Text style={styles.currencySymbol}>₹</Text>
                            </View>
                            <TextInput
                                style={styles.budgetInput}
                                placeholder="e.g. 25,000"
                                placeholderTextColor="#94a3b8"
                                value={budget}
                                onChangeText={setBudget}
                                keyboardType="numeric"
                                editable={!loading}
                            />
                        </View>

                        {/* Quick Budget Chips */}
                        <View style={styles.quickBudgetRow}>
                            {SUGGESTED_BUDGETS.map((amount) => {
                                const isSelected = budget === amount;
                                return (
                                    <TouchableOpacity
                                        key={amount}
                                        style={[
                                            styles.budgetChip,
                                            isSelected && styles.budgetChipSelected,
                                        ]}
                                        onPress={() => setBudget(amount)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.budgetChipText,
                                                isSelected && styles.budgetChipTextSelected,
                                            ]}
                                        >
                                            ₹{parseInt(amount, 10) >= 100000 ? '1 Lakh' : `${parseInt(amount, 10) / 1000}k`}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Additional Notes */}
                        <Text style={styles.label}>Project Scope & Requirements</Text>
                        <View style={styles.textAreaWrapper}>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Describe your key deliverables, target deadline, reference links, or questions..."
                                placeholderTextColor="#94a3b8"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={4}
                                editable={!loading}
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.88}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <View style={styles.submitBtnRow}>
                                    <Text style={styles.submitBtnText}>Submit Project Request</Text>
                                    <Send size={16} color="#ffffff" style={styles.submitIcon} />
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Trust Footnote */}
                        <View style={styles.trustFootnote}>
                            <ShieldCheck size={14} color="#64748b" />
                            <Text style={styles.trustFootnoteText}>
                                Confidential. Never shared with third parties.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default ServiceDetail

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginRight: 12,
    },
    topBarTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        flex: 1,
    },
    container: {
        flexGrow: 1,
        backgroundColor: '#f8fafc',
        paddingBottom: 40,
    },
    heroWrap: {
        position: 'relative',
        width: '100%',
        height: 200,
        backgroundColor: '#0f172a',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
    },
    badgeRow: {
        position: 'absolute',
        bottom: 14,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0284c7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 5,
    },
    verifiedText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },
    categoryBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    categoryBadgeText: {
        color: '#0f172a',
        fontSize: 11,
        fontWeight: '700',
    },
    infoBlock: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
    highlightRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 16,
    },
    highlightItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 6,
    },
    highlightText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
    },
    includedCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    includedHeading: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 14,
    },
    perksList: {
        gap: 12,
    },
    perkItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkWrap: {
        marginTop: 2,
        marginRight: 10,
    },
    perkTextWrap: {
        flex: 1,
    },
    perkTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    perkDesc: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
        lineHeight: 16,
    },
    formCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 3,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    formHeader: {
        marginBottom: 16,
    },
    formHeading: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    formSub: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        lineHeight: 17,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 6,
        marginTop: 10,
    },
    budgetInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        overflow: 'hidden',
    },
    currencySymbolBox: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: '#f1f5f9',
        borderRightWidth: 1,
        borderRightColor: '#cbd5e1',
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0284c7',
    },
    budgetInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
    },
    quickBudgetRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    budgetChip: {
        flex: 1,
        paddingVertical: 7,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    budgetChipSelected: {
        backgroundColor: '#0284c7',
        borderColor: '#0284c7',
    },
    budgetChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
    },
    budgetChipTextSelected: {
        color: '#ffffff',
    },
    textAreaWrapper: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        padding: 12,
    },
    textArea: {
        height: 85,
        textAlignVertical: 'top',
        fontSize: 14,
        color: '#0f172a',
    },
    submitBtn: {
        backgroundColor: '#0284c7',
        borderRadius: 14,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#0284c7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
    },
    submitBtnDisabled: {
        opacity: 0.65,
    },
    submitBtnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    submitBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    submitIcon: {
        marginTop: 1,
    },
    trustFootnote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 14,
    },
    trustFootnoteText: {
        fontSize: 11,
        color: '#64748b',
    },
})
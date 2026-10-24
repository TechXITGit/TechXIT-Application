import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, TextInput } from 'react-native'
import React, { useState, useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, ArrowRight, Search, CheckCircle2, Sparkles } from 'lucide-react-native'

export const SERVICES_DATA = [
    {
        id: '1',
        category: 'Marketing',
        title: 'Youtube SEO',
        description: 'Rank your videos higher and grow organic watch time with data-driven audience & tag optimization.',
        badge: 'High Organic Growth',
        timeline: 'Custom MileStone',
        features: ['Keyword & Tag Research', 'Thumbnail & Title A/B', 'Algorithm Optimization'],
        image: require('../assets/services/youtube_seo.jpg'),
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80',
    },
    {
        id: '2',
        category: 'Marketing',
        title: 'Google Ads',
        description: 'Performance-first Google Ads campaigns built to scale your return on ad spend with verified lead generation.',
        badge: 'High Conversion ROI',
        timeline: 'Custom MileStone',
        features: ['Search & Display Funnels', 'Negative Keywords Filter', 'Real-time ROI Tracking'],
        image: require('../assets/services/google_ads.jpg'),
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    },
    {
        id: '3',
        category: 'Development',
        title: 'Website Development',
        description: 'Modern, lightning-fast web applications engineered with Next.js, React, and robust cloud infrastructure.',
        badge: 'Top Tier Architecture',
        timeline: 'Custom MileStone',
        features: ['Mobile-First Responsive', 'SEO & Speed Optimized', 'Secure Admin CMS'],
        image: require('../assets/services/web_dev.jpg'),
        imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    },
    {
        id: '4',
        category: 'Development',
        title: 'Mobile App Development',
        description: 'Native-quality iOS and Android applications built with React Native and Expo for fast time-to-market.',
        badge: 'iOS & Android Native',
        timeline: 'Custom MileStone',
        features: ['Cross-Platform Parity', 'Push Notifications', 'Offline-First Storage'],
        image: require('../assets/services/mobile_app.jpg'),
        imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
    },
    {
        id: '5',
        category: 'Development',
        title: 'Software Development',
        description: 'Custom enterprise software, internal ERPs, and cloud SaaS platforms engineered for security and reliability.',
        badge: 'Enterprise Scalable',
        timeline: 'Custom MileStone',
        features: ['Role-Based Access', 'Automated Backups', 'REST & GraphQL APIs'],
        image: require('../assets/services/software_dev.jpg'),
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    },
    {
        id: '6',
        category: 'Design',
        title: 'Brochure & Logo Design',
        description: 'Iconic brand identities, corporate stationery, and print collateral that command attention and drive prestige.',
        badge: 'Creative Identity',
        timeline: 'Custom MileStone',
        features: ['Vector SVG & Print Formats', 'Brand Color Palette', 'Full Commercial Rights'],
        image: require('../assets/services/branding_logo.jpg'),
        imageUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80',
    },
    {
        id: '7',
        category: 'Marketing',
        title: 'Social Media Marketing',
        description: 'Full-funnel social media growth, viral short-form reels, influencer outreach, and ROI-driven Meta ad campaigns.',
        badge: 'Viral Brand Reach',
        timeline: 'Custom MileStone',
        features: ['Content Strategy & Reels', 'Audience Growth Funnels', 'Multi-Platform Ad Scaling'],
        image: require('../assets/services/social_media.jpg'),
        imageUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=1200&q=80',
    },
    {
        id: '8',
        category: 'Media',
        title: 'Photography and VideoGraphy',
        description: 'Commercial 4K cinematography, corporate brand shoots, product photography, and high-impact event coverage.',
        badge: '4K Cinema Grade',
        timeline: 'Custom MileStone',
        features: ['4K Commercial Video Shoots', 'Studio Product Photography', 'Color Grading & Motion FX'],
        image: require('../assets/services/photography_video.jpg'),
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    },
];

const CATEGORIES = ['All', 'Development', 'Marketing', 'Design', 'Media'];

const ServiceCard = ({ item, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
        <View style={styles.imageWrap}>
            <Image
                source={item.image || { uri: item.imageUrl }}
                style={styles.cardImage}
                resizeMode="cover"
            />
            <View style={styles.badgeWrap}>
                <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
        </View>

        <View style={styles.cardBody}>
            <View style={styles.cardHeaderRow}>
                <Text style={styles.categoryPill}>{item.category}</Text>
                
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>

            {item.features && (
                <View style={styles.featurePills}>
                    {item.features.map((feat, index) => (
                        <View key={index} style={styles.featureItem}>
                            <CheckCircle2 size={13} color="#0284c7" />
                            <Text style={styles.featureText}>{feat}</Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.cardFooter}>
                <Text style={styles.timelineText}>⚡ {item.timeline || 'Custom MileStone'}</Text>

                <View style={styles.requestBtn}>
                    <Text style={styles.requestBtnText}>Request Quote</Text>
                    <ArrowRight size={15} color="#ffffff" style={styles.requestIcon} />
                </View>
            </View>
        </View>
    </TouchableOpacity>
);

const ServicePage = ({ navigation }) => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredServices = useMemo(() => {
        return SERVICES_DATA.filter((item) => {
            const matchesCategory =
                selectedCategory === 'All' || item.category === selectedCategory;
            const matchesSearch =
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchQuery]);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <ArrowLeft size={20} color="#0f172a" />
                </TouchableOpacity>
                <View style={styles.topBarTitleWrap}>
                    <Text style={styles.topBarTitle}>Our Services</Text>
                    <Text style={styles.topBarSubtitle}>Customized digital solutions for your business</Text>
                </View>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Search Bar */}
                <View style={styles.searchWrap}>
                    <Search size={18} color="#64748b" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search services, development, marketing..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                    />
                </View>

                {/* Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContainer}
                >
                    {CATEGORIES.map((category) => {
                        const isActive = selectedCategory === category;
                        return (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.filterChip,
                                    isActive && styles.filterChipActive,
                                ]}
                                onPress={() => setSelectedCategory(category)}
                                activeOpacity={0.8}
                            >
                                {isActive && <Sparkles size={12} color="#ffffff" style={{ marginRight: 4 }} />}
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        isActive && styles.filterChipTextActive,
                                    ]}
                                >
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Services List */}
                <View style={styles.listWrap}>
                    {filteredServices.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyTitle}>No matching services found</Text>
                            <Text style={styles.emptySub}>Try searching for a different keyword or category.</Text>
                        </View>
                    ) : (
                        filteredServices.map((item) => (
                            <ServiceCard
                                key={item.id}
                                item={item}
                                onPress={() => navigation.navigate('ServiceDetail', { service: item })}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default ServicePage

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
    topBarTitleWrap: {
        flex: 1,
    },
    topBarTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    topBarSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 46,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
        marginBottom: 12,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#0f172a',
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 14,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    filterChipActive: {
        backgroundColor: '#0284c7',
        borderColor: '#0284c7',
        shadowColor: '#0284c7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 2,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    filterChipTextActive: {
        color: '#ffffff',
    },
    listWrap: {
        gap: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    imageWrap: {
        position: 'relative',
        width: '100%',
        height: 160,
        backgroundColor: '#e2e8f0',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    badgeWrap: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    cardBody: {
        padding: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    categoryPill: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0284c7',
        backgroundColor: '#f0f9ff',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    timelineText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    cardDescription: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 19,
        marginBottom: 12,
    },
    featurePills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#edf2f7',
        gap: 5,
    },
    featureText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 12,
    },
    priceLabel: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
    },
    priceVal: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
    },
    requestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0284c7',
        paddingVertical: 9,
        paddingHorizontal: 15,
        borderRadius: 10,
        gap: 6,
        shadowColor: '#0284c7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 2,
    },
    requestBtnText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
    },
    requestIcon: {
        marginLeft: 2,
    },
    emptyWrap: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    emptySub: {
        fontSize: 13,
        color: '#64748b',
    },
})
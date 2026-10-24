import {
  StyleSheet,
  View,
  StatusBar,
  ScrollView,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  Linking,
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { auth, db } from '../firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import {
  Users,
  UserCheck,
  Briefcase,
  FileText,
  FolderKanban,
  UserCircle,
  ArrowRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  UserPlus,
} from 'lucide-react-native'

import Header from './Header'
import Hero from './Hero'
import YoutubeFrame from './YoutubeFrame'
import Fourpillars from './Fourpillars'
import Capability from './Capability'
import Clients from './Clients'
import { SERVICES_DATA } from './ServicePage'

const { width } = Dimensions.get('window');
const PHONE_NUMBER = '+911234567890';

const Home = (props) => {
  const navigation = useNavigation();
  const [role, setRole] = useState(props.role || 'client');
  const [userName, setUserName] = useState('');

  // Fetch or sync role & name if not provided
  useEffect(() => {
    if (props.role) {
      setRole(props.role);
    }

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserName(currentUser.displayName || currentUser.email?.split('@')[0] || 'User');
        
        if (!props.role) {
          getDoc(doc(db, 'users', currentUser.uid))
            .then((snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data();
                if (data.role) setRole(data.role);
                if (data.name) setUserName(data.name);
              }
            })
            .catch((err) => console.log('Role sync error:', err.message));
        }
      }
    });

    return () => unsubAuth();
  }, [props.role]);

  // =========================================================================
  // ADMIN DASHBOARD BANNER & SHORTCUTS
  // =========================================================================
  const renderAdminDashboard = () => (
    <View style={styles.adminSection}>
      <View style={styles.adminBanner}>
        <View style={styles.adminBannerBadge}>
          <Sparkles size={13} color="#059669" />
          <Text style={styles.adminBannerBadgeText}>ADMIN EXECUTIVE PORTAL</Text>
        </View>
        <Text style={styles.adminBannerTitle}>
          Welcome, {userName || 'Administrator'} 👋
        </Text>
        <Text style={styles.adminBannerSub}>
          Manage operations, client proposals, team approvals, and company billing.
        </Text>
      </View>

      <View style={styles.adminGrid}>
        {/* Client Requests Tile */}
        <TouchableOpacity
          style={styles.adminCard}
          onPress={() => navigation.navigate('AdminClients')}
          activeOpacity={0.85}
        >
          <View style={[styles.adminIconBox, { backgroundColor: '#e0f2fe' }]}>
            <Users size={22} color="#0284c7" />
          </View>
          <View style={styles.adminCardContent}>
            <Text style={styles.adminCardTitle}>Client Requests</Text>
            <Text style={styles.adminCardSub}>Review project scopes & quotes</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* Employee Approvals Tile */}
        <TouchableOpacity
          style={styles.adminCard}
          onPress={() => navigation.navigate('AdminEmployees')}
          activeOpacity={0.85}
        >
          <View style={[styles.adminIconBox, { backgroundColor: '#dcfce7' }]}>
            <UserCheck size={22} color="#16a34a" />
          </View>
          <View style={styles.adminCardContent}>
            <Text style={styles.adminCardTitle}>Employee Approvals</Text>
            <Text style={styles.adminCardSub}>Authorize staff onboarding</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* Manage Projects Tile */}
        <TouchableOpacity
          style={styles.adminCard}
          onPress={() => navigation.navigate('AdminProjects')}
          activeOpacity={0.85}
        >
          <View style={[styles.adminIconBox, { backgroundColor: '#f3e8ff' }]}>
            <Briefcase size={22} color="#9333ea" />
          </View>
          <View style={styles.adminCardContent}>
            <Text style={styles.adminCardTitle}>Manage Projects</Text>
            <Text style={styles.adminCardSub}>Milestones & client assignments</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* Invoices & Billing Tile */}
        <TouchableOpacity
          style={styles.adminCard}
          onPress={() => navigation.navigate('AdminInvoices')}
          activeOpacity={0.85}
        >
          <View style={[styles.adminIconBox, { backgroundColor: '#e0f2fe' }]}>
            <FileText size={22} color="#0284c7" />
          </View>
          <View style={styles.adminCardContent}>
            <Text style={styles.adminCardTitle}>Invoices & Billing</Text>
            <Text style={styles.adminCardSub}>Generate client invoices for accepted projects</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* Manage Hiring Tile */}
        <TouchableOpacity
          style={styles.adminCard}
          onPress={() => navigation.navigate('AdminHiring')}
          activeOpacity={0.85}
        >
          <View style={[styles.adminIconBox, { backgroundColor: '#ecfdf5' }]}>
            <UserPlus size={22} color="#059669" />
          </View>
          <View style={styles.adminCardContent}>
            <Text style={styles.adminCardTitle}>Manage Hiring</Text>
            <Text style={styles.adminCardSub}>Create & publish job openings on app</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* Create Payslips Tile */}
        <TouchableOpacity
          style={styles.adminCard}
          onPress={() => navigation.navigate('AdminPayslips')}
          activeOpacity={0.85}
        >
          <View style={[styles.adminIconBox, { backgroundColor: '#fef3c7' }]}>
            <FileText size={22} color="#d97706" />
          </View>
          <View style={styles.adminCardContent}>
            <Text style={styles.adminCardTitle}>Payroll & Payslips</Text>
            <Text style={styles.adminCardSub}>Generate salary statements & PDF</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <View style={styles.adminDividerRow}>
        <View style={styles.adminDividerLine} />
        <Text style={styles.adminDividerText}>COMPANY STANDARDS & METHODOLOGY</Text>
        <View style={styles.adminDividerLine} />
      </View>
    </View>
  );

  // =========================================================================
  // EMPLOYEE DASHBOARD BANNER & SHORTCUTS
  // =========================================================================
  const renderEmployeeDashboard = () => (
    <View style={styles.employeeSection}>
      <View style={styles.employeeBanner}>
        <View style={styles.employeeBannerBadge}>
          <CheckCircle2 size={13} color="#0284c7" />
          <Text style={styles.employeeBannerBadgeText}>TECH X STAFF HUB</Text>
        </View>
        <Text style={styles.employeeBannerTitle}>
          Welcome back, {userName || 'Team Member'}! 🚀
        </Text>
        <Text style={styles.employeeBannerSub}>
          Track your assigned milestones, view compensation records, and update credentials.
        </Text>
      </View>

      <View style={styles.employeeGrid}>
        {/* My Projects */}
        <TouchableOpacity
          style={styles.employeeCard}
          onPress={() => navigation.navigate('EmployeeProjects')}
          activeOpacity={0.85}
        >
          <View style={[styles.adminIconBox, { backgroundColor: '#e0f2fe' }]}>
            <FolderKanban size={22} color="#0284c7" />
          </View>
          <View style={styles.adminCardContent}>
            <Text style={styles.adminCardTitle}>My Active Projects</Text>
            <Text style={styles.adminCardSub}>Assigned deliverables & deadlines</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* My Payslips */}
        <TouchableOpacity
          style={styles.employeeCard}
          onPress={() => navigation.navigate('EmployeePayslips')}
          activeOpacity={0.85}
        >
          <View style={[styles.adminIconBox, { backgroundColor: '#dcfce7' }]}>
            <FileText size={22} color="#16a34a" />
          </View>
          <View style={styles.adminCardContent}>
            <Text style={styles.adminCardTitle}>My Payslips</Text>
            <Text style={styles.adminCardSub}>Download salary records & PDF</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* My Profile */}
        <TouchableOpacity
          style={styles.employeeCard}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.85}
        >
          <View style={[styles.adminIconBox, { backgroundColor: '#f3e8ff' }]}>
            <UserCircle size={22} color="#9333ea" />
          </View>
          <View style={styles.adminCardContent}>
            <Text style={styles.adminCardTitle}>My Profile & Skills</Text>
            <Text style={styles.adminCardSub}>Update designation, bio & contact</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <View style={styles.adminDividerRow}>
        <View style={styles.adminDividerLine} />
        <Text style={styles.adminDividerText}>COMPANY STANDARDS & CAPABILITIES</Text>
        <View style={styles.adminDividerLine} />
      </View>
    </View>
  );

  // =========================================================================
  // FEATURED SERVICES CAROUSEL / PREVIEW (FOR CLIENT & PREVIEW)
  // =========================================================================
  const featuredServices = SERVICES_DATA.slice(0, 3);

  const renderFeaturedServices = () => (
    <View style={styles.featuredSection}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionBadgeText}>WHAT WE BUILD</Text>
          <Text style={styles.sectionHeadingText}>Featured Solutions</Text>
        </View>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => navigation.navigate('Services')}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllBtnText}>View All</Text>
          <ArrowRight size={14} color="#0284c7" />
        </TouchableOpacity>
      </View>

      <View style={styles.featuredList}>
        {featuredServices.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.featuredCard}
            onPress={() => navigation.navigate('ServiceDetail', { service: item })}
            activeOpacity={0.88}
          >
            <Image
              source={item.image || { uri: item.imageUrl }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <View style={styles.featuredBody}>
              <View style={styles.featuredBadgeRow}>
                <Text style={styles.featuredCategoryText}>{item.category}</Text>
                <Text style={styles.featuredPriceText}>{item.startingPrice}</Text>
              </View>
              <Text style={styles.featuredTitle}>{item.title}</Text>
              <Text style={styles.featuredDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.featuredFooter}>
                <Text style={styles.featuredCtaText}>Request Scope</Text>
                <ArrowRight size={14} color="#0284c7" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // =========================================================================
  // CLIENT CTA BANNER
  // =========================================================================
  const renderClientCtaBanner = () => (
    <View style={styles.ctaCard}>
      <View style={styles.ctaBadge}>
        <ShieldCheck size={14} color="#ffffff" />
        <Text style={styles.ctaBadgeText}>CONFIDENTIAL & RAPID PROTOTYPING</Text>
      </View>
      <Text style={styles.ctaTitle}>Ready to Scale Your Digital Vision?</Text>
      <Text style={styles.ctaSub}>
        Partner with Tech X IT for mission-critical software, custom apps, and data-driven marketing.
      </Text>
      <View style={styles.ctaButtonsRow}>
        <TouchableOpacity
          style={styles.ctaPhoneBtn}
          onPress={() => Linking.openURL(`tel:${PHONE_NUMBER}`)}
          activeOpacity={0.85}
        >
          <PhoneCall size={15} color="#0f172a" />
          <Text style={styles.ctaPhoneBtnText}>Call Direct</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaServicesBtn}
          onPress={() => navigation.navigate('Services')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaServicesBtnText}>Explore All Services</Text>
          <ArrowRight size={15} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Header role={role} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ADMIN DASHBOARD - ONLY SHOWN TO ADMIN */}
        {role === 'admin' && (
          <>
            {renderAdminDashboard()}
            <Fourpillars />
            <Capability />
          </>
        )}

        {/* EMPLOYEE WORKSPACE - ONLY SHOWN TO EMPLOYEE (NO CLIENT SERVICES/QUOTES/HERO) */}
        {role === 'employee' && (
          <>
            {renderEmployeeDashboard()}
            <Fourpillars />
            <Capability />
          </>
        )}

        {/* CLIENT EXPERIENCE - HERO, FEATURED SERVICES & QUOTE REQUESTS ONLY FOR CLIENT */}
        {role === 'client' && (
          <>
            {/* HERO SECTION WITH ANIMATED MARKETING TECH SCENE */}
            <View style={styles.heroSection}>
              <Hero />
            </View>

            {/* FEATURED SERVICES & QUOTE REQUEST */}
            {renderFeaturedServices()}

            {/* HOW WE WORK (FOUR PILLARS) */}
            <Fourpillars />

            {/* ENGINEERING CAPABILITIES */}
            <Capability />

            {/* TRUSTED CLIENT BRANDS */}
            <Clients />

            {/* SPOTLIGHT VIDEO */}
            <YoutubeFrame />

            {/* BOTTOM CALL TO ACTION */}
            {renderClientCtaBanner()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Home

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  heroSection: {
    height: 520,
    width: '100%',
    backgroundColor: '#090d16',
  },

  // -------------------------
  // ADMIN DASHBOARD STYLES
  // -------------------------
  adminSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  adminBanner: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 16,
  },
  adminBannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  adminBannerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  adminBannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: -0.3,
  },
  adminBannerSub: {
    fontSize: 13,
    color: '#047857',
    marginTop: 4,
    lineHeight: 18,
  },
  adminGrid: {
    gap: 10,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  adminIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  adminCardContent: {
    flex: 1,
  },
  adminCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  adminCardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  adminDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 6,
    gap: 10,
  },
  adminDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  adminDividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
  },

  // -------------------------
  // EMPLOYEE DASHBOARD STYLES
  // -------------------------
  employeeSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  employeeBanner: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    marginBottom: 16,
  },
  employeeBannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  employeeBannerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.8,
  },
  employeeBannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0369a1',
    letterSpacing: -0.3,
  },
  employeeBannerSub: {
    fontSize: 13,
    color: '#0284c7',
    marginTop: 4,
    lineHeight: 18,
  },
  employeeGrid: {
    gap: 10,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  // -------------------------
  // FEATURED SERVICES STYLES
  // -------------------------
  featuredSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sectionHeadingText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  viewAllBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
  featuredList: {
    gap: 14,
  },
  featuredCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  featuredImage: {
    width: 110,
    height: '100%',
    minHeight: 110,
    backgroundColor: '#e2e8f0',
  },
  featuredBody: {
    flex: 1,
    padding: 12,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  featuredCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
    textTransform: 'uppercase',
  },
  featuredPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  featuredTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  featuredDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 8,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },

  // -------------------------
  // BOTTOM CTA CARD STYLES
  // -------------------------
  ctaCard: {
    backgroundColor: '#0f172a',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  ctaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  ctaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 0.8,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  ctaSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 19,
    marginBottom: 18,
  },
  ctaButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ctaPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  ctaPhoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  ctaServicesBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  ctaServicesBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
})
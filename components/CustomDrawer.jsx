import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    Alert,
    Platform,
} from 'react-native';

import React from 'react';

import {
    DrawerContentScrollView,
} from '@react-navigation/drawer';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
    Home as HomeIcon,
    Briefcase,
    FileText,
    UserPlus,
    LogOut,
    Users,
    UserCheck,
    UserCircle,
    FolderKanban,
} from 'lucide-react-native';

import {
    getAuth,
    signOut,
} from 'firebase/auth';

const CustomDrawer = (props) => {
    const {
        navigation,
        isAdmin,
        isEmployee,
    } = props;

    const auth = getAuth();
    const currentUser = auth.currentUser;
    const userEmail = currentUser?.email || 'User';
    const userName = currentUser?.displayName || userEmail.split('@')[0];

    const getRoleInfo = () => {
        if (isAdmin) {
            return { title: 'Admin', color: '#059669', bg: '#ecfdf5' };
        }
        if (isEmployee) {
            return { title: 'Employee', color: '#6366f1', bg: '#eef2ff' };
        }
        return { title: 'Client', color: '#0284c7', bg: '#e0f2fe' };
    };

    const roleInfo = getRoleInfo();

    const handleLogout = async () => {
        const doLogout = async () => {
            try {
                await signOut(auth);
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'RoleSelect' }],
                });
            } catch (error) {
                console.log('Logout error:', error.message);
            }
        };

        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined' && window.confirm) {
                if (window.confirm('Are you sure you want to log out?')) {
                    await doLogout();
                }
            } else {
                await doLogout();
            }
        } else {
            Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: doLogout,
                    },
                ]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <DrawerContentScrollView
                {...props}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Drawer Header with User Profile Card */}
                <View style={styles.header}>
                    <View style={styles.userCard}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>
                                {userName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.userInfo}>
                            <View style={styles.userNameRow}>
                                <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                                    {userName}
                                </Text>
                                <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
                                    <Text style={[styles.roleBadgeText, { color: roleInfo.color }]}>
                                        {roleInfo.title}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">
                                {userEmail}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Navigation Items */}
                <View style={styles.menuSection}>
                    {isAdmin ? (
                        <>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('AdminEmployees')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <Users size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>Employees Directory</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('AdminClients')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <Briefcase size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>Client Requests</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('AdminProjects')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <FolderKanban size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>Manage Projects</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('AdminInvoices')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <FileText size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>Invoices & Billing</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('AdminHiring')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <UserPlus size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>Manage Hiring</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('AdminPayslips')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <FileText size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>Payroll & Payslips</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('Profile')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <UserCircle size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>My Profile</Text>
                            </TouchableOpacity>
                        </>
                    ) : isEmployee ? (
                        <>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('EmployeeProjects')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <FolderKanban size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>My Projects</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('EmployeePayslips')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <FileText size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>My Payslips</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('Profile')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <UserCircle size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>My Profile</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        /* CLIENT NAVIGATION - NO DASHBOARD HOME LINK */
                        <>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('Services')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <Briefcase size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>Our Services</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('Invoice')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <FileText size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>My Invoices</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('Hiring')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <UserPlus size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>Careers & Hiring</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('Profile')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <UserCircle size={20} color="#0284c7" />
                                </View>
                                <Text style={styles.menuText}>My Profile</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </DrawerContentScrollView>

            {/* Logout Footer - Works on both Web and Mobile App */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <View style={styles.logoutIconBox}>
                        <LogOut size={18} color="#ef4444" />
                    </View>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default CustomDrawer;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 0 : 8,
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        marginBottom: 12,
    },
    logo: {
        height: 36,
        width: 130,
        marginBottom: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    avatarCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#0284c7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    userInfo: {
        marginLeft: 12,
        flex: 1,
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
    },
    userName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
        flexShrink: 1,
    },
    roleBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    userEmail: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    menuSection: {
        paddingHorizontal: 12,
        gap: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f0f9ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginLeft: 12,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        padding: 16,
        backgroundColor: '#ffffff',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#fef2f2',
        borderRadius: 12,
    },
    logoutIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ef4444',
        marginLeft: 12,
    },
});
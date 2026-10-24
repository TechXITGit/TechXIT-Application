import { StyleSheet, View, Image, TouchableOpacity, Text } from 'react-native'
import React, { useState } from 'react'
import { Menu, Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native'
import { useNotifications } from './NotificationService';
import NotificationsModal from './NotificationsModal';

const Header = ({ role }) => {
    const navigation = useNavigation();
    const [showNotifications, setShowNotifications] = useState(false);

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        clearAll,
    } = useNotifications(role);

    const getRoleBadge = () => {
        if (role === 'admin') {
            return { label: 'Admin', bg: '#ecfdf5', text: '#059669' };
        }
        if (role === 'employee') {
            return { label: 'Staff', bg: '#e0f2fe', text: '#0284c7' };
        }
        return null;
    };

    const badge = getRoleBadge();

    return (
        <View style={styles.container}>
            {/* Logo and Brand */}
            <View style={styles.logoRow}>
                <Image
                    source={require('../assets/logo.png')}
                    style={styles.image}
                    resizeMode="contain"
                />
                <View style={styles.brandInfo}>
                    <View style={styles.brandTitleRow}>
                        <Text style={styles.brandText}>Tech</Text>
                        <Text style={styles.brandTextAccent}>X</Text>
                    </View>
                    <Text style={styles.brandSub}>IT SERVICES</Text>
                </View>
                {badge && (
                    <View style={[styles.rolePill, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.rolePillText, { color: badge.text }]}>
                            {badge.label}
                        </Text>
                    </View>
                )}
            </View>

            {/* Right Action Icons: Notification Bell & Menu */}
            <View style={styles.rightActions}>
                <TouchableOpacity
                    onPress={() => setShowNotifications(true)}
                    style={styles.iconButton}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Bell size={20} color="#0f172a" />
                    {unreadCount > 0 && (
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.openDrawer()}
                    style={styles.menuButton}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Menu size={20} color="#0f172a" />
                </TouchableOpacity>
            </View>

            {/* Notifications Modal */}
            <NotificationsModal
                visible={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                unreadCount={unreadCount}
                loading={loading}
                markAsRead={markAsRead}
                markAllAsRead={markAllAsRead}
                clearAll={clearAll}
            />
        </View>
    )
}

export default Header

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        height: 64,
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#e2e8f0',
        elevation: 6,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        zIndex: 100,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    image: {
        height: 38,
        width: 38,
    },
    brandInfo: {
        justifyContent: 'center',
    },
    brandTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    brandTextAccent: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0284c7',
        letterSpacing: -0.5,
    },
    brandSub: {
        fontSize: 8.5,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 1.2,
        marginTop: -2,
    },
    rolePill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginLeft: 2,
    },
    rolePillText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconButton: {
        width: 40,
        height: 40,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        position: 'relative',
    },
    badgeContainer: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#ffffff',
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '800',
    },
    menuButton: {
        width: 40,
        height: 40,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
})
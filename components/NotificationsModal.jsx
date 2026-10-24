import {
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Platform,
} from 'react-native';
import React, { useState, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
    Bell,
    X,
    CheckCheck,
    FolderKanban,
    FileText,
    Award,
    UserCheck,
    BellRing,
    Inbox,
    Trash2,
    ChevronRight,
} from 'lucide-react-native';
import { getRelativeTime } from './NotificationService';

const NotificationsModal = ({
    visible,
    onClose,
    notifications = [],
    unreadCount = 0,
    loading = false,
    markAsRead,
    markAllAsRead,
    clearAll,
}) => {
    const navigation = useNavigation();
    const [tabFilter, setTabFilter] = useState('ALL'); // 'ALL' | 'UNREAD'

    const filteredList = useMemo(() => {
        if (tabFilter === 'UNREAD') {
            return notifications.filter((n) => !n.isRead);
        }
        return notifications;
    }, [notifications, tabFilter]);

    const getIconForType = (type) => {
        switch (type) {
            case 'project':
                return {
                    icon: <FolderKanban size={18} color="#0284c7" />,
                    bg: '#e0f2fe',
                };
            case 'invoice':
                return {
                    icon: <FileText size={18} color="#16a34a" />,
                    bg: '#dcfce7',
                };
            case 'payslip':
                return {
                    icon: <Award size={18} color="#9333ea" />,
                    bg: '#f3e8ff',
                };
            case 'staff':
            case 'employee':
                return {
                    icon: <UserCheck size={18} color="#d97706" />,
                    bg: '#fef3c7',
                };
            default:
                return {
                    icon: <BellRing size={18} color="#0284c7" />,
                    bg: '#e0f2fe',
                };
        }
    };

    const handleNotificationPress = (item) => {
        if (typeof markAsRead === 'function') {
            markAsRead(item.id);
        }
        onClose();

        if (item.targetScreen) {
            try {
                if (item.targetParams) {
                    navigation.navigate(item.targetScreen, item.targetParams);
                } else {
                    navigation.navigate(item.targetScreen);
                }
            } catch (err) {
                console.log('Navigation from notification note:', err.message);
            }
        }
    };

    const renderItem = ({ item }) => {
        const { icon, bg } = getIconForType(item.type);
        const isUnread = !item.isRead;

        return (
            <TouchableOpacity
                style={[styles.notifCard, isUnread && styles.notifCardUnread]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.85}
            >
                <View style={[styles.iconWrap, { backgroundColor: bg }]}>
                    {icon}
                </View>

                <View style={styles.contentWrap}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.notifTitle, isUnread && styles.notifTitleBold]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={styles.timeText}>
                            {getRelativeTime(item.createdAt)}
                        </Text>
                    </View>

                    <Text style={styles.messageText} numberOfLines={2}>
                        {item.message}
                    </Text>
                </View>

                {isUnread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View style={styles.sheetContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleRow}>
                            <View style={styles.headerIconWrap}>
                                <Bell size={18} color="#0284c7" />
                            </View>
                            <Text style={styles.headerTitle}>Notifications</Text>
                            {unreadCount > 0 && (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadBadgeText}>
                                        {unreadCount} NEW
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.headerActions}>
                            {unreadCount > 0 && (
                                <TouchableOpacity
                                    style={styles.markReadBtn}
                                    onPress={markAllAsRead}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <CheckCheck size={16} color="#0284c7" />
                                    <Text style={styles.markReadBtnText}>Mark read</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={onClose}
                                activeOpacity={0.7}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Filter Tabs */}
                    <View style={styles.tabRow}>
                        <TouchableOpacity
                            style={[styles.tab, tabFilter === 'ALL' && styles.tabActive]}
                            onPress={() => setTabFilter('ALL')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, tabFilter === 'ALL' && styles.tabTextActive]}>
                                All ({notifications.length})
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, tabFilter === 'UNREAD' && styles.tabActive]}
                            onPress={() => setTabFilter('UNREAD')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, tabFilter === 'UNREAD' && styles.tabTextActive]}>
                                Unread ({unreadCount})
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Notifications List */}
                    {loading ? (
                        <View style={styles.centerBox}>
                            <ActivityIndicator size="small" color="#0284c7" />
                            <Text style={styles.loadingText}>Syncing notifications...</Text>
                        </View>
                    ) : filteredList.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Inbox size={42} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>No Notifications</Text>
                            <Text style={styles.emptyDesc}>
                                {tabFilter === 'UNREAD'
                                    ? 'You have read all your notifications!'
                                    : 'New project updates, client proposals, and milestones will appear here in real time.'}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredList}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}

                    {/* Footer Actions */}
                    {notifications.length > 0 && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.clearBtn}
                                onPress={clearAll}
                                activeOpacity={0.7}
                            >
                                <Trash2 size={14} color="#94a3b8" />
                                <Text style={styles.clearBtnText}>Clear All</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default NotificationsModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheetContainer: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        minHeight: 340,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#e0f2fe',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    unreadBadge: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
    },
    unreadBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#dc2626',
        letterSpacing: 0.4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    markReadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: '#f0f9ff',
        borderRadius: 8,
    },
    markReadBtnText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: '#0284c7',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 8,
    },
    tab: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
    },
    tabActive: {
        backgroundColor: '#0284c7',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
    },
    tabTextActive: {
        color: '#ffffff',
    },
    listContent: {
        paddingHorizontal: 18,
        paddingTop: 6,
        paddingBottom: 16,
        gap: 10,
    },
    notifCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    notifCardUnread: {
        backgroundColor: '#f8fafc',
        borderColor: '#bae6fd',
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentWrap: {
        flex: 1,
        marginLeft: 12,
        marginRight: 6,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    notifTitle: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#0f172a',
        flex: 1,
        paddingRight: 8,
    },
    notifTitleBold: {
        fontWeight: '800',
        color: '#0f172a',
    },
    timeText: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
    },
    messageText: {
        fontSize: 12,
        color: '#64748b',
        lineHeight: 16,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0284c7',
    },
    centerBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        fontSize: 12.5,
        color: '#64748b',
        marginTop: 8,
    },
    emptyBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 45,
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
        marginTop: 10,
    },
    emptyDesc: {
        fontSize: 12.5,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 18,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 10,
        paddingHorizontal: 18,
        alignItems: 'center',
    },
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    clearBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94a3b8',
    },
});

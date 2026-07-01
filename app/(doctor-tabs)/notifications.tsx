import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Filter, CheckCheck } from 'lucide-react-native';
import { config } from '@/utils/config';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getSession, handleTokenExpiration } from '@/utils/auth';
import { FilterBottomSheet, FilterOptions } from '@/components/FilterBottomSheet';
import { NotificationDetail } from '@/components/NotificationDetail';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';

interface DoctorNotification {
  id: string;
  category: string;
  message_header: string;
  message_body: string;
  read: boolean;
  created_at: string;
  objective_id: string | null;
  completed: boolean;
  auth_status: string | null;
}

export default function DoctorNotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isDark } = useTheme();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<DoctorNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<DoctorNotification | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    sort: 'newest',
    dateRange: 'all',
    status: 'all',
    category: 'all',
  });

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const session = await getSession();
      console.log('Session exists:', !!session);

      if (!session) {
        console.log('No session found');
        setError(t('doctorNotifications.noSessionError'));
        return;
      }

      console.log('Session token exists:', !!session.access_token);
      console.log('User type:', session.user_type);
      console.log('Fetching doctor notifications...');

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-notifications`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': session.access_token,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Result:', result);

      if (result.success && result.notifications) {
        console.log('Notifications loaded:', result.notifications.length);
        setNotifications(result.notifications);
        setError(null);
      } else if (result.error) {
        console.error('API error:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError(error instanceof Error ? error.message : t('doctorNotifications.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const applyFilters = useCallback(() => {
    let filtered = [...notifications];

    if (filters.status === 'read') {
      filtered = filtered.filter((n) => n.read);
    } else if (filters.status === 'unread') {
      filtered = filtered.filter((n) => !n.read);
    }

    if (filters.category !== 'all') {
      if (filters.category.toLowerCase() === 'reminder') {
        filtered = filtered.filter((n) =>
          n.category.toLowerCase() === 'reminder' ||
          n.category.toLowerCase() === 'custom reminder'
        );
      } else {
        filtered = filtered.filter((n) => n.category.toLowerCase() === filters.category.toLowerCase());
      }
    }

    const now = new Date();
    if (filters.dateRange === 'today') {
      filtered = filtered.filter((n) => {
        const notifDate = new Date(n.created_at);
        return notifDate.toDateString() === now.toDateString();
      });
    } else if (filters.dateRange === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((n) => new Date(n.created_at) >= sevenDaysAgo);
    } else if (filters.dateRange === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((n) => new Date(n.created_at) >= thirtyDaysAgo);
    }

    if (filters.sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredNotifications(filtered);
  }, [notifications, filters]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (session?.user?.company_id) {
      loadNotifications();
    }
  }, [session?.user?.company_id, loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const session = await getSession();
      if (!session) return;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-mark-doctor-notification-read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': session.access_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notificationId }),
        }
      );

      if (response.ok) {
        console.log('Notification marked as read, refetching notifications');
        // Refetch notifications to ensure state is in sync with database
        await loadNotifications();
      } else {
        console.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      await handleTokenExpiration(error, router);
    }
  };

  const markAllAsRead = async () => {
    try {
      const session = await getSession();
      if (!session) return;

      console.log('Marking all notifications as read...');
      console.log('Current notifications before update:', notifications.map(n => ({ id: n.id, read: n.read })));

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-mark-all-doctor-notifications-read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': session.access_token,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      console.log('Mark all as read result:', result);

      if (response.ok && result.success) {
        console.log('All notifications marked as read in DB, refetching from server');
        // Refetch notifications to ensure state is in sync with database
        await loadNotifications();
      } else {
        console.error('Failed to mark all notifications as read:', result.error);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      await handleTokenExpiration(error, router);
    }
  };

  const handleNotificationPress = (notification: DoctorNotification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleAuthorization = async (notificationId: string, action: 'authorize' | 'deny') => {
    try {
      const session = await getSession();
      if (!session) return;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-handle-authorization`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': session.access_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notificationId, action }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Authorization processed successfully');
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, completed: true, auth_status: result.auth_status, read: true }
              : n
          )
        );
      } else {
        console.error('Failed to process authorization:', result.error);
      }
    } catch (error) {
      console.error('Error processing authorization:', error);
      await handleTokenExpiration(error, router);
    }
  };

  const normalizeCategory = (cat: string): string => {
    const categoryLower = cat?.toLowerCase();
    switch (categoryLower) {
      case 'appointment':
        return t('doctorNotifications.categoryAppointment');
      case 'order':
        return t('doctorNotifications.categoryOrder');
      case 'question':
        return t('doctorNotifications.categoryQuestion');
      case 'authorization':
        return t('doctorNotifications.categoryAuthorization');
      case 'reminder':
      case 'custom reminder':
        return t('doctorNotifications.categoryReminder');
      default:
        return cat;
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryLower = category.toLowerCase();
    switch (categoryLower) {
      case 'appointment':
        return P.primary;
      case 'order':
        return '#15C2B0';
      case 'question':
        return '#2D7DD2';
      case 'authorization':
        return '#F59E0B';
      case 'reminder':
      case 'custom reminder':
        return '#15C2B0';
      default:
        return P.textSecondary;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('doctorNotifications.timeJustNow');
    if (diffMins < 60) return t('doctorNotifications.timeMinutesAgo', { count: diffMins });
    if (diffHours < 24) return t('doctorNotifications.timeHoursAgo', { count: diffHours });
    if (diffDays === 1) return t('doctorNotifications.timeYesterday');
    if (diffDays < 7) return t('doctorNotifications.timeDaysAgo', { count: diffDays });

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={P.text} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('doctorNotifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowFilterSheet(true)}>
            <Filter size={22} color={P.text} strokeWidth={2} />
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.iconButton} onPress={markAllAsRead}>
              <CheckCheck size={22} color={P.primary} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={P.primary} />
        </View>
      ) : error ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[P.primary]}
              tintColor={P.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>⚠️</Text>
          </View>
          <Text style={styles.emptyTitle}>{t('common.error')}</Text>
          <Text style={styles.emptyDescription}>{error}</Text>
        </ScrollView>
      ) : filteredNotifications.length === 0 ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[P.primary]}
              tintColor={P.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>🔔</Text>
          </View>
          <Text style={styles.emptyTitle}>{t('doctorNotifications.emptyTitle')}</Text>
          <Text style={styles.emptyDescription}>
            {t('doctorNotifications.emptyDescription')}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[P.primary]}
              tintColor={P.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadCard,
              ]}
              activeOpacity={0.7}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: `${getCategoryColor(notification.category)}15` },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: getCategoryColor(notification.category) },
                    ]}
                  >
                    {normalizeCategory(notification.category)}
                  </Text>
                </View>
                <Text style={styles.timeText}>{formatTime(notification.created_at)}</Text>
              </View>

              <Text style={styles.messageText} numberOfLines={3}>
                {notification.message_body}
              </Text>

              {notification.category.toLowerCase() === 'authorization' && !notification.auth_status && (
                <View style={styles.authorizationButtons}>
                  <TouchableOpacity
                    style={[styles.authButton, styles.authorizeButton]}
                    onPress={() => handleAuthorization(notification.id, 'authorize')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.authorizeButtonText}>{t('doctorNotifications.authorize')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.authButton, styles.denyButton]}
                    onPress={() => handleAuthorization(notification.id, 'deny')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.denyButtonText}>{t('doctorNotifications.deny')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {notification.category.toLowerCase() === 'authorization' && notification.auth_status === 'authorized' && (
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, styles.statusCompleted]}>
                    <Text style={[styles.statusText, { color: '#15C2B0' }]}>
                      {t('doctorNotifications.statusAuthorized')}
                    </Text>
                  </View>
                </View>
              )}

              {notification.category.toLowerCase() === 'authorization' && notification.auth_status === 'denied' && (
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, styles.statusCancelled]}>
                    <Text style={[styles.statusText, { color: '#FF6F61' }]}>
                      {t('doctorNotifications.statusDenied')}
                    </Text>
                  </View>
                </View>
              )}

              {!notification.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FilterBottomSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        currentFilters={filters}
      />

      <NotificationDetail
        visible={selectedNotification !== null}
        onClose={() => setSelectedNotification(null)}
        notification={selectedNotification}
        formatTime={formatTime}
        onAuthorizationAction={async (notificationId: string, approved: boolean) => {
          await handleAuthorization(notificationId, approved ? 'authorize' : 'deny');
          setSelectedNotification(null);
        }}
      />
    </SafeAreaView>
  );
}

const makeStyles = (P: DoctorPalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: P.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: P.text,
  },
  badge: {
    backgroundColor: P.danger,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 999,
    marginLeft: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: P.elevatedBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    minHeight: '100%',
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: P.rowBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  emptyIconText: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: P.text,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: P.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  notificationCard: {
    backgroundColor: P.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: P.border,
    position: 'relative',
  },
  unreadCard: {
    borderColor: P.primary,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 13,
    color: P.textSecondary,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 15,
    color: P.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  statusContainer: {
    marginTop: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: P.rowBg,
  },
  statusCompleted: {
    backgroundColor: '#15C2B015',
  },
  statusCancelled: {
    backgroundColor: '#FF6F6115',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.textSecondary,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: P.primary,
  },
  authorizationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  authButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorizeButton: {
    backgroundColor: '#15C2B0',
  },
  denyButton: {
    backgroundColor: '#FF6F61',
  },
  authorizeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  denyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

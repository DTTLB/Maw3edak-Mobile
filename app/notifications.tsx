import React, { useState, useEffect, useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Filter, CheckCheck } from 'lucide-react-native';
import { config } from '@/utils/config';
import { NotificationCard } from '@/components/NotificationCard';
import { NotificationDetail } from '@/components/NotificationDetail';
import { FilterBottomSheet, FilterOptions } from '@/components/FilterBottomSheet';
import { NOTIFICATION_REFRESH_EVENT } from '@/utils/notifications';
import { useTheme } from '@/contexts/ThemeContext';
import { getSession, handleTokenExpiration } from '@/utils/auth';

interface Notification {
  id: string;
  category: string;
  message_header: string;
  message_body: string;
  read: boolean;
  completed: boolean;
  created_at: string;
  doctor_id: string | null;
  patient_id?: string;
  objective_id?: string | null;
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    sort: 'newest',
    dateRange: 'all',
    status: 'all',
    category: 'all',
  });

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const session = await getSession();
      if (!session) return;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-notifications`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      if (result.success && result.notifications) {
        setNotifications(result.notifications);
      } else if (result.error) {
        await handleTokenExpiration(result.error, router);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      await handleTokenExpiration(error, router);
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      NOTIFICATION_REFRESH_EVENT,
      () => {
        console.log('Notification event received, refreshing list...');
        loadNotifications();
      }
    );

    return () => {
      subscription.remove();
    };
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const session = await getSession();
      if (!session) return;

      await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-mark-notification-read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notificationId }),
        }
      );

      // Refetch notifications to ensure state is in sync with database
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      await handleTokenExpiration(error, router);
    }
  };


  const markAllAsRead = async () => {
    try {
      const session = await getSession();
      if (!session) return;

      await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-mark-all-notifications-read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Refetch notifications to ensure state is in sync with database
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      await handleTokenExpiration(error, router);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleAuthorizationAction = async (notificationId: string, approved: boolean) => {
    try {
      const session = await getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-handle-authorization`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': session.access_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationId,
            action: approved ? 'authorize' : 'deny',
          }),
        }
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to process authorization');
      }

      await loadNotifications();
    } catch (error) {
      console.error('Error handling authorization:', error);
      const wasTokenExpired = await handleTokenExpiration(error, router);
      if (!wasTokenExpired) {
        throw error;
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.timeJustNow');
    if (diffMins < 60) return t('notifications.timeMinutesAgo', { count: diffMins });
    if (diffHours < 24) return t('notifications.timeHoursAgo', { count: diffHours });
    if (diffDays === 1) return t('notifications.timeYesterday');
    if (diffDays < 7) return t('notifications.timeDaysAgo', { count: diffDays });

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowFilterSheet(true)}>
            <Filter size={22} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.iconButton} onPress={markAllAsRead}>
              <CheckCheck size={22} color={colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>🔔</Text>
          </View>
          <Text style={styles.emptyTitle}>{t('notifications.emptyTitle')}</Text>
          <Text style={styles.emptyDescription}>
            {t('notifications.emptyDescription')}
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
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              id={notification.id}
              category={notification.category}
              title={notification.message_header}
              body={notification.message_body}
              time={formatTime(notification.created_at)}
              read={notification.read}
              onPress={() => handleNotificationPress(notification)}
            />
          ))}
        </ScrollView>
      )}

      <NotificationDetail
        visible={selectedNotification !== null}
        onClose={() => setSelectedNotification(null)}
        notification={selectedNotification}
        formatTime={formatTime}
        onAuthorizationAction={handleAuthorizationAction}
      />

      <FilterBottomSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        currentFilters={filters}
      />
    </SafeAreaView>
  );
}


const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.error,
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
    backgroundColor: colors.backgroundSecondary,
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
    backgroundColor: colors.backgroundTertiary,
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
    color: colors.text,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 24,
  },
});

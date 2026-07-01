import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Calendar,
  ShieldCheck,
  FileText,
  MessageCircle,
  SlidersHorizontal,
  CheckCheck,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { listNotifications, markNotificationsRead, type ReceptionNotification } from '@/utils/receptionApi';
import { FilterBottomSheet, FilterOptions } from '@/components/FilterBottomSheet';

// Notification feed for receptionists — every notification addressed to the
// doctors they have access to (resolved server-side). Supports tap-to-read,
// mark-all-read, and the shared filter sheet (status / category / date / sort).
function iconFor(category: string) {
  switch ((category || '').toLowerCase()) {
    case 'appointment': return Calendar;
    case 'authorization': return ShieldCheck;
    case 'question': return MessageCircle;
    default: return FileText;
  }
}

function formatWhen(dateStr: string, lang?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang || undefined, { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(lang || undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function ReceptionNotificationsScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();

  const userId = session?.user?.realUserId || session?.user?.global_id || '';
  const companyId = session?.user?.company_id || null;

  const [items, setItems] = useState<ReceptionNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    sort: 'newest',
    dateRange: 'all',
    status: 'all',
    category: 'all',
  });

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setError('');
    try {
      const { notifications } = await listNotifications(userId, companyId);
      setItems(notifications);
    } catch (e: any) {
      setError(e?.message || t('reception.errorGeneric'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, companyId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // Apply status / category / date / sort filters (mirrors the doctor screen).
  const filtered = useMemo(() => {
    let out = [...items];
    if (filters.status === 'read') out = out.filter((n) => n.read);
    else if (filters.status === 'unread') out = out.filter((n) => !n.read);

    if (filters.category !== 'all') {
      out = out.filter((n) => (n.category || '').toLowerCase() === filters.category.toLowerCase());
    }

    const now = new Date();
    if (filters.dateRange === 'today') {
      out = out.filter((n) => new Date(n.created_at).toDateString() === now.toDateString());
    } else if (filters.dateRange === '7days') {
      const since = new Date(now.getTime() - 7 * 864e5);
      out = out.filter((n) => new Date(n.created_at) >= since);
    } else if (filters.dateRange === '30days') {
      const since = new Date(now.getTime() - 30 * 864e5);
      out = out.filter((n) => new Date(n.created_at) >= since);
    }

    out.sort((a, b) =>
      filters.sort === 'oldest'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return out;
  }, [items, filters]);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);
  const activeFilters =
    (filters.status !== 'all' ? 1 : 0) +
    (filters.category !== 'all' ? 1 : 0) +
    (filters.dateRange !== 'all' ? 1 : 0) +
    (filters.sort !== 'newest' ? 1 : 0);

  const handleMarkRead = async (n: ReceptionNotification) => {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    try {
      await markNotificationsRead(userId, companyId, n.id);
    } catch {
      // revert on failure
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)));
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    const prev = items;
    setItems((p) => p.map((x) => ({ ...x, read: true })));
    try {
      await markNotificationsRead(userId, companyId);
    } catch {
      setItems(prev);
    }
  };

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('reception.notificationsTitle')}</Text>
          {unreadCount > 0 ? (
            <Text style={[styles.headerSub, { color: colors.primary }]}>
              {t('reception.unreadCount', { count: unreadCount })}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowFilter(true)} activeOpacity={0.7}>
          <SlidersHorizontal size={20} color={colors.text} strokeWidth={2} />
          {activeFilters > 0 ? <View style={[styles.badge, { backgroundColor: colors.primary }]} /> : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleMarkAll}
          activeOpacity={0.7}
          disabled={unreadCount === 0}
        >
          <CheckCheck size={20} color={unreadCount === 0 ? colors.textTertiary : colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContent : styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {error ? (
            <View style={styles.center}>
              <Bell size={52} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
              <TouchableOpacity onPress={load} style={[styles.retry, { borderColor: colors.primary }]} activeOpacity={0.7}>
                <Text style={[styles.retryText, { color: colors.primary }]}>{t('reception.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.center}>
              <Bell size={56} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('reception.noNotifications')}</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('reception.noNotificationsText')}</Text>
            </View>
          ) : (
            filtered.map((n) => {
              const Icon = iconFor(n.category);
              return (
                <TouchableOpacity
                  key={n.id}
                  activeOpacity={0.8}
                  onPress={() => handleMarkRead(n)}
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: n.read ? 'transparent' : colors.primary },
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight || '#EAF3FC' }]}>
                    <Icon size={20} color={colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.body}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                        {n.message_header || t('reception.notification')}
                      </Text>
                      {!n.read ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
                    </View>
                    {n.message_body ? (
                      <Text style={[styles.message, { color: colors.textSecondary }]}>{n.message_body}</Text>
                    ) : null}
                    <Text style={[styles.time, { color: colors.textTertiary }]}>{formatWhen(n.created_at, i18n.language)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      <FilterBottomSheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={setFilters}
        currentFilters={filters}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    headerBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerCenter: { flex: 1, paddingHorizontal: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    headerSub: { fontSize: 12.5, fontWeight: '600', marginTop: 1 },
    badge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },

    scroll: { flex: 1 },
    listContent: { padding: 16, gap: 12 },
    emptyContent: { flexGrow: 1, justifyContent: 'center' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
    emptyTitle: { fontSize: 19, fontWeight: '700', marginTop: 6 },
    emptyText: { fontSize: 14, textAlign: 'center' },
    retry: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, marginTop: 4 },
    retryText: { fontSize: 14, fontWeight: '700' },

    card: {
      flexDirection: 'row',
      gap: 12,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1.5,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    iconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    body: { flex: 1, gap: 4 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { flex: 1, fontSize: 15, fontWeight: '700' },
    dot: { width: 8, height: 8, borderRadius: 4 },
    message: { fontSize: 13.5, lineHeight: 19 },
    time: { fontSize: 12, marginTop: 2 },
  });

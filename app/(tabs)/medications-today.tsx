import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { SUPABASE_URL } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import { ArrowLeft, Pill, Check, X, CircleCheck } from 'lucide-react-native';
import { config } from '@/utils/config';
import { getSession } from '@/utils/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { getBrandPalette } from '@/constants/brand';

interface ParsedSchedule {
  timesPerDay: number;
  reminderTimes: string[];
  durationDays: number;
  patientMessage: string;
  startDate?: string | null;
  endDate?: string | null;
  remindersStatus?: 'active' | 'paused' | 'off';
}

interface Dose {
  key: string;
  itemId: string;
  medicineName: string;
  dosage: string;
  notes: string | null;
  time: string; // "HH:MM"
}

type DoseStatus = 'taken' | 'skipped';

function todayStr(): string {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate()).toISOString().slice(0, 10);
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${period}`;
}

export default function TodaysMedicationsScreen() {
  const router = useRouter();
  const { colors: themeColors, isDark } = useTheme();
  const bp = getBrandPalette(isDark);
  // Brand-aligned color set: keep theme neutrals, inject brand identity.
  const colors = {
    ...themeColors,
    primary: bp.primary,
    primaryLight: bp.lightBlue,
    turquoise: bp.turquoise,
    turquoiseSoft: bp.turquoiseSoft,
    blue: bp.blue,
    blueSoft: bp.blueSoft,
    coral: bp.coral,
    coralSoft: bp.coralSoft,
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [statuses, setStatuses] = useState<Record<string, DoseStatus>>({});

  const load = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const session = await getSession();
      const medicalId = session?.patient?.medical_id ?? null;
      if (!medicalId) {
        setDoses([]);
        return;
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/mobile-get-patient-prescriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicalId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const json = await res.json();

      const today = todayStr();
      const list: Dose[] = [];

      if (json.success) {
        for (const p of json.prescriptions) {
          for (const item of p.items as any[]) {
            const s: ParsedSchedule | null | undefined = item.parsed_schedule;
            if (!s || !s.reminderTimes?.length) continue; // PRN / unparsed -> no doses
            if (s.remindersStatus === 'paused' || s.remindersStatus === 'off') continue;
            const start = s.startDate ?? today;
            const end = s.endDate ?? today;
            if (today < start || today > end) continue; // not active today
            for (const t of s.reminderTimes) {
              list.push({
                key: `${item.id}-${t}`,
                itemId: item.id,
                medicineName: item.medicine_name,
                dosage: item.dosage,
                notes: item.notes,
                time: t,
              });
            }
          }
        }
      }

      list.sort((a, b) => a.time.localeCompare(b.time));
      setDoses(list);
    } catch (e) {
      console.error('Error loading today medications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Phase 2: also POST to a `log-medication` function to write medication_logs.
  const setStatus = (key: string, status: DoseStatus) => {
    setStatuses((prev) => ({ ...prev, [key]: prev[key] === status ? undefined as any : status }));
  };

  const styles = createStyles(colors);
  const remaining = doses.filter((d) => !statuses[d.key]).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today&apos;s Meds</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : doses.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.empty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        >
          <CircleCheck size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>Nothing scheduled today</Text>
          <Text style={styles.emptySubtitle}>You have no medication doses for today.</Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        >
          <Text style={styles.summary}>
            {remaining === 0 ? 'All doses handled 🎉' : `${remaining} dose${remaining === 1 ? '' : 's'} remaining`}
          </Text>

          {doses.map((dose) => {
            const status = statuses[dose.key];
            return (
              <View
                key={dose.key}
                style={[styles.doseCard, status === 'taken' && styles.doseCardTaken, status === 'skipped' && styles.doseCardSkipped]}
              >
                <View style={styles.doseTimeCol}>
                  <Text style={styles.doseTime}>{formatTime(dose.time)}</Text>
                </View>
                <View style={styles.doseBody}>
                  <View style={styles.doseHeader}>
                    <Pill size={16} color={colors.primary} />
                    <Text style={styles.doseName}>{dose.medicineName}</Text>
                  </View>
                  {!!dose.dosage && <Text style={styles.doseDetail}>{dose.dosage}</Text>}
                  {!!dose.notes && <Text style={styles.doseDetailMuted}>{dose.notes}</Text>}

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, status === 'taken' && styles.actionBtnTakenActive]}
                      onPress={() => setStatus(dose.key, 'taken')}
                      activeOpacity={0.8}
                    >
                      <Check size={16} color={status === 'taken' ? '#FFFFFF' : colors.turquoise} />
                      <Text style={[styles.actionText, { color: status === 'taken' ? '#FFFFFF' : colors.turquoise }]}>Taken</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnSkip, status === 'skipped' && styles.actionBtnSkipActive]}
                      onPress={() => setStatus(dose.key, 'skipped')}
                      activeOpacity={0.8}
                    >
                      <X size={16} color={status === 'skipped' ? '#FFFFFF' : colors.textSecondary} />
                      <Text style={[styles.actionText, { color: status === 'skipped' ? '#FFFFFF' : colors.textSecondary }]}>Skip</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background ?? '#F8FAFC' },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  scrollContent: { padding: 20 },
  summary: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 16 },
  doseCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  doseCardTaken: { borderColor: colors.turquoise, borderWidth: 1.5 },
  doseCardSkipped: { opacity: 0.6 },
  doseTimeCol: { width: 76, paddingRight: 12, justifyContent: 'flex-start' },
  doseTime: { fontSize: 15, fontWeight: '800', color: colors.blue },
  doseBody: { flex: 1, borderLeftWidth: 1, borderLeftColor: colors.borderLight, paddingLeft: 14 },
  doseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  doseName: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  doseDetail: { fontSize: 13, color: colors.text, marginBottom: 2 },
  doseDetailMuted: { fontSize: 13, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.turquoise,
    backgroundColor: colors.turquoiseSoft,
  },
  actionBtnTakenActive: { backgroundColor: colors.turquoise },
  actionBtnSkip: { borderColor: colors.border, backgroundColor: colors.backgroundSecondary },
  actionBtnSkipActive: { backgroundColor: colors.textSecondary, borderColor: colors.textSecondary },
  actionText: { fontSize: 13, fontWeight: '600' },
});

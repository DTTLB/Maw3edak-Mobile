import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Check, CalendarDays, Stethoscope, X, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  getDoctors,
  listMyAppointments,
  toDateKey,
  type ReceptionDoctor,
  type ReceptionAppointment,
} from '@/utils/receptionApi';
import DoctorCalendarView from '@/components/reception/DoctorCalendarView';
import AppointmentEditModal from '@/components/reception/AppointmentEditModal';

// Receptionist "Doctor Calendar": pick one or more doctors, then view their
// appointments on a Day / Week / Month calendar. Reuses the existing booking
// endpoints (getDoctors + listMyAppointments) — no new backend needed.
export default function ReceptionDoctorCalendarScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();

  const userId = session?.user?.realUserId || session?.user?.global_id || '';
  const companyId = session?.user?.company_id || null;

  const [doctors, setDoctors] = useState<ReceptionDoctor[]>([]);
  const [appointments, setAppointments] = useState<ReceptionAppointment[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const [docs, appts] = await Promise.all([
        getDoctors(userId, companyId),
        listMyAppointments(userId, companyId),
      ]);
      setDoctors(docs);
      setAppointments(appts);
      // Default to the first doctor selected so the calendar isn't blank.
      setSelected((prev) => (prev.length === 0 && docs.length > 0 ? [docs[0].id] : prev));
    } catch (e) {
      console.error('Failed to load doctor calendar:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, companyId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const toggleDoctor = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Appointments for the chosen doctors only.
  const filtered = useMemo(() => {
    if (selected.length === 0) return [];
    const set = new Set(selected);
    return appointments.filter((a) => set.has(a.doctorId));
  }, [appointments, selected]);

  // Edit modal state.
  const [editAppt, setEditAppt] = useState<ReceptionAppointment | null>(null);
  const [editVisible, setEditVisible] = useState(false);

  // When several doctors are selected, "+ Add" must ask which one the new
  // appointment is for; this holds the pending date/time until they choose.
  const [addCtx, setAddCtx] = useState<{ date: Date; time?: string } | null>(null);

  const goToBooking = useCallback(
    (doctorId: string | null, date: Date, time?: string) => {
      router.push({
        pathname: '/(reception-tabs)/book-appointment',
        params: {
          date: toDateKey(date),
          ...(time ? { time } : {}),
          ...(doctorId ? { doctorId } : {}),
        },
      } as any);
    },
    [router]
  );

  // "+ Add" → booking wizard, prefilled with the tapped date/time. One doctor
  // selected: go straight in for that doctor. Several: ask which doctor first.
  const handleAdd = useCallback(
    (date: Date, time?: string) => {
      if (selected.length === 1) {
        goToBooking(selected[0], date, time);
      } else {
        setAddCtx({ date, time });
      }
    },
    [selected, goToBooking]
  );

  const handleEdit = useCallback((appt: ReceptionAppointment) => {
    setEditAppt(appt);
    setEditVisible(true);
  }, []);

  // Doctors offered in the "which doctor?" picker = the currently selected ones.
  const selectedDoctors = useMemo(
    () => doctors.filter((d) => selected.includes(d.id)),
    [doctors, selected]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('reception.doctorCalendarTitle')}</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {doctors.length === 0 ? (
            <View style={styles.center}>
              <Stethoscope size={52} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('reception.noDoctors')}</Text>
            </View>
          ) : (
            <>
              {/* Doctor picker */}
              <View style={styles.pickHead}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('reception.selectDoctorsTitle')}</Text>
                {selected.length > 0 ? (
                  <TouchableOpacity onPress={() => setSelected([])} hitSlop={8}>
                    <Text style={[styles.clearText, { color: colors.primary }]}>{t('reception.calClearSelection')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.doctorGrid}>
                {doctors.map((d) => {
                  const isSel = selected.includes(d.id);
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        styles.docCard,
                        { backgroundColor: colors.card, borderColor: isSel ? colors.primary : colors.border },
                      ]}
                      onPress={() => toggleDoctor(d.id)}
                      activeOpacity={0.85}
                    >
                      {d.image_url ? (
                        <Image source={{ uri: d.image_url }} style={styles.docAvatar} />
                      ) : (
                        <View style={[styles.docAvatar, styles.docAvatarFallback, { backgroundColor: colors.primary }]}>
                          <Text style={styles.docAvatarText}>
                            {(d.first_name?.[0] || '') + (d.last_name?.[0] || '')}
                          </Text>
                        </View>
                      )}
                      <View style={styles.docInfo}>
                        <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>
                          {`${d.first_name} ${d.last_name}`.trim()}
                        </Text>
                        {d.specialization ? (
                          <Text style={[styles.docSpec, { color: colors.textSecondary }]} numberOfLines={1}>
                            {d.specialization}
                          </Text>
                        ) : null}
                      </View>
                      {isSel ? (
                        <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      ) : (
                        <View style={[styles.checkEmpty, { borderColor: colors.border }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Calendar */}
              {selected.length === 0 ? (
                <View style={[styles.prompt, { backgroundColor: colors.card }]}>
                  <CalendarDays size={44} color={colors.textTertiary} strokeWidth={1.5} />
                  <Text style={[styles.promptText, { color: colors.textSecondary }]}>
                    {t('reception.calSelectPrompt')}
                  </Text>
                </View>
              ) : (
                <View style={styles.calWrap}>
                  <DoctorCalendarView appointments={filtered} onAdd={handleAdd} onEditAppt={handleEdit} />
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      <AppointmentEditModal
        visible={editVisible}
        appointment={editAppt}
        userId={userId}
        onClose={() => setEditVisible(false)}
        onChanged={load}
      />

      {/* "Which doctor?" picker — shown when adding with several doctors selected. */}
      <Modal visible={!!addCtx} transparent animationType="fade" onRequestClose={() => setAddCtx(null)}>
        <TouchableOpacity style={styles.pickerScrim} activeOpacity={1} onPress={() => setAddCtx(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerCard, { backgroundColor: colors.card }]}>
            <View style={[styles.pickerHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('reception.addPickDoctorTitle')}</Text>
              <TouchableOpacity onPress={() => setAddCtx(null)} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
              {selectedDoctors.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.pickerRow, { borderColor: colors.border }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    const ctx = addCtx;
                    setAddCtx(null);
                    if (ctx) goToBooking(d.id, ctx.date, ctx.time);
                  }}
                >
                  {d.image_url ? (
                    <Image source={{ uri: d.image_url }} style={styles.pickerAvatar} />
                  ) : (
                    <View style={[styles.pickerAvatar, styles.docAvatarFallback, { backgroundColor: colors.primary }]}>
                      <Text style={styles.docAvatarText}>
                        {(d.first_name?.[0] || '') + (d.last_name?.[0] || '')}
                      </Text>
                    </View>
                  )}
                  <View style={styles.docInfo}>
                    <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>
                      {`${d.first_name} ${d.last_name}`.trim()}
                    </Text>
                    {d.specialization ? (
                      <Text style={[styles.docSpec, { color: colors.textSecondary }]} numberOfLines={1}>
                        {d.specialization}
                      </Text>
                    ) : null}
                  </View>
                  <ChevronRight size={20} color={colors.primary} strokeWidth={2} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },

    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 32 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, minHeight: 280 },
    emptyText: { fontSize: 14.5, fontWeight: '600', textAlign: 'center' },

    pickHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '800' },
    clearText: { fontSize: 13.5, fontWeight: '700' },

    doctorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    docCard: {
      flexBasis: '47%',
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: 16,
      borderWidth: 2,
    },
    docAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E2E8F0' },
    docAvatarFallback: { justifyContent: 'center', alignItems: 'center' },
    docAvatarText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
    docInfo: { flex: 1 },
    docName: { fontSize: 13.5, fontWeight: '700' },
    docSpec: { fontSize: 11.5, marginTop: 1 },
    checkBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    checkEmpty: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },

    prompt: { borderRadius: 18, padding: 40, alignItems: 'center', gap: 12 },
    promptText: { fontSize: 14.5, fontWeight: '600', textAlign: 'center' },

    calWrap: { marginTop: 2 },

    // "Which doctor?" picker
    pickerScrim: { flex: 1, backgroundColor: 'rgba(2,6,23,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    pickerCard: { width: '100%', maxWidth: 420, borderRadius: 22, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, maxHeight: '70%' },
    pickerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 4, borderBottomWidth: 1 },
    pickerTitle: { fontSize: 17, fontWeight: '800', flex: 1, paddingRight: 12 },
    pickerList: { paddingTop: 8 },
    pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
    pickerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0' },
  });

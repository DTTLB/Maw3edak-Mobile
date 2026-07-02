import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Users,
  Stethoscope,
  Building2,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Search,
  X,
  ClipboardList,
  DoorOpen,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  getPatientsByDoctor,
  getDoctors,
  getSlots,
  getBookingOptions,
  book,
  toDateKey,
  formatTime12,
  normalizeTime,
  type ReceptionPatient,
  type ReceptionDoctor,
  type ReceptionClinic,
  type ReceptionSlot,
  type ReceptionService,
  type ReceptionRoom,
} from '@/utils/receptionApi';
import PatientCard from '@/components/reception/PatientCard';
import DoctorCard from '@/components/reception/DoctorCard';
import ClinicCard from '@/components/reception/ClinicCard';
import SlotGrid from '@/components/reception/SlotGrid';
import BookingCalendar from '@/components/reception/BookingCalendar';
import StepProgress, { WizardStep } from '@/components/reception/StepProgress';

type StepId = 'doctor' | 'clinic' | 'details' | 'patient' | 'date' | 'time' | 'confirm';
// Doctor is chosen FIRST (from the logged-in user's access); clinic, service,
// room and patient are then all scoped to that selected doctor. Clinic + details
// come before patient so staff narrow down the visit before picking who it's for.
const STEP_ORDER: StepId[] = ['doctor', 'clinic', 'details', 'patient', 'date', 'time', 'confirm'];

const MAX_ADVANCE_DAYS = 30;

export default function ReceptionBookAppointmentScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();
  // Optional prefill from the Doctor Calendar "+ Add" affordances.
  const params = useLocalSearchParams<{ patientId?: string; doctorId?: string; date?: string; time?: string }>();
  const prefillApplied = useRef(false);
  const patientPrefillApplied = useRef(false);
  const autoDoctorApplied = useRef(false);

  // Receptionist's data-resolution key is their own user_id (UUID).
  const userId = session?.user?.realUserId || session?.user?.global_id || '';
  const companyId = session?.user?.company_id || null;

  const steps: WizardStep[] = useMemo(
    () => [
      { id: 'doctor', label: t('reception.stepDoctor'), icon: Stethoscope },
      { id: 'clinic', label: t('reception.stepClinic'), icon: Building2 },
      { id: 'details', label: t('reception.stepDetails'), icon: ClipboardList },
      { id: 'patient', label: t('reception.stepPatient'), icon: Users },
      { id: 'date', label: t('reception.stepDate'), icon: CalendarIcon },
      { id: 'time', label: t('reception.stepTime'), icon: Clock },
      { id: 'confirm', label: t('reception.stepConfirm'), icon: CheckCircle2 },
    ],
    [t]
  );

  const [step, setStep] = useState<StepId>('doctor');
  const stepIndex = STEP_ORDER.indexOf(step);

  // Data
  const [patients, setPatients] = useState<ReceptionPatient[]>([]);
  const [doctors, setDoctors] = useState<ReceptionDoctor[]>([]);
  // Patients load only after a doctor is chosen (scoped to that doctor).
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  // Selections
  const [patient, setPatient] = useState<ReceptionPatient | null>(null);
  const [doctor, setDoctor] = useState<ReceptionDoctor | null>(null);
  const [clinic, setClinic] = useState<ReceptionClinic | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);

  // Service + room (company-level) for this appointment.
  const [services, setServices] = useState<ReceptionService[]>([]);
  const [rooms, setRooms] = useState<ReceptionRoom[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [service, setService] = useState<ReceptionService | null>(null);
  const [room, setRoom] = useState<ReceptionRoom | null>(null);
  const [openPicker, setOpenPicker] = useState<'service' | 'room' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // Slots
  const [slots, setSlots] = useState<ReceptionSlot[]>([]);
  const [slotsFallback, setSlotsFallback] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [customTimeError, setCustomTimeError] = useState('');

  // Booking
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);

  const today = useMemo(() => new Date(), []);
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + MAX_ADVANCE_DAYS);
    return d;
  }, [today]);

  // ---- Data loading --------------------------------------------------------

  // On load, fetch ONLY the doctors accessible to the logged-in user
  // (user_doctor_access). Patients/services/clinics/rooms are never fetched
  // globally — they are loaded per selected doctor below.
  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoadError('');
    setLoadingDoctors(true);
    try {
      const docs = await getDoctors(userId, companyId).catch(() => {
        throw new Error(t('reception.errorLoadDoctors'));
      });
      setDoctors(docs);
    } catch (e: any) {
      setLoadError(e?.message || t('reception.errorGeneric'));
    } finally {
      setLoadingDoctors(false);
    }
  }, [userId, companyId, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Patients are loaded ONLY for the chosen doctor (patient_doctor_access) — a
  // doctor's own patients, not the receptionist's full roster.
  const doctorId = doctor?.id;
  useEffect(() => {
    if (!doctorId || !userId) {
      setPatients([]);
      return;
    }
    let cancelled = false;
    setLoadingPatients(true);
    getPatientsByDoctor(userId, doctorId, companyId)
      .then((pts) => { if (!cancelled) setPatients(pts); })
      .catch(() => {
        if (!cancelled) {
          setPatients([]);
          setLoadError(t('reception.errorLoadPatients'));
        }
      })
      .finally(() => { if (!cancelled) setLoadingPatients(false); });
    return () => { cancelled = true; };
  }, [doctorId, userId, companyId, t]);

  // Auto-select the doctor when the user has exactly one accessible doctor and
  // advance past the doctor step (a single-choice doctor screen is redundant).
  // Skips straight to details when that doctor also has a single clinic.
  useEffect(() => {
    if (autoDoctorApplied.current || loadingDoctors || doctor) return;
    if (doctors.length !== 1 || params.doctorId) return;
    autoDoctorApplied.current = true;
    const d = doctors[0];
    setDoctor(d);
    if (d.clinics.length === 1) {
      setClinic(d.clinics[0]);
      setStep('details');
    } else {
      setStep('clinic');
    }
  }, [loadingDoctors, doctors, doctor, params.doctorId]);

  // Calendar prefill: preset the doctor (+ date/time defaults), then move to the
  // clinic/details step. Clinic/patient are resolved per the chosen doctor.
  useEffect(() => {
    if (prefillApplied.current || loadingDoctors || doctors.length === 0) return;
    if (!params.doctorId && !params.date && !params.time) return;
    prefillApplied.current = true;

    if (params.doctorId) {
      const d = doctors.find((doc) => doc.id === params.doctorId);
      if (d) {
        setDoctor(d);
        if (d.clinics.length === 1) {
          setClinic(d.clinics[0]);
          setStep('details');
        } else {
          setStep('clinic');
        }
      }
    }
    if (params.date) {
      const parsed = new Date(`${params.date}T00:00:00`);
      if (!isNaN(parsed.getTime())) setDate(parsed);
    }
    if (params.time) setTime(params.time);
  }, [loadingDoctors, doctors, params.doctorId, params.date, params.time]);

  // Patients-tab shortcut: a patientId is passed without a doctor. Once a doctor
  // is chosen and their patients load, auto-select that patient if present.
  useEffect(() => {
    if (patientPrefillApplied.current || !params.patientId) return;
    if (loadingPatients || patients.length === 0) return;
    const p = patients.find((pt) => pt.patient_id === params.patientId);
    if (!p) return;
    patientPrefillApplied.current = true;
    setPatient(p);
  }, [loadingPatients, patients, params.patientId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Slot loading whenever doctor + clinic + date are known.
  const loadSlots = useCallback(async () => {
    if (!doctor || !clinic || !date) return;
    setLoadingSlots(true);
    try {
      const { slots: result, fallback } = await getSlots(doctor.id, clinic.id, toDateKey(date));
      // For "today", greys out slots whose start time has already passed.
      const isToday = toDateKey(date) === toDateKey(new Date());
      const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
      const adjusted = result.map((s) => {
        if (!isToday) return s;
        const [h, m] = s.time.split(':').map(Number);
        return h * 60 + m <= nowMins ? { ...s, available: false } : s;
      });
      setSlots(adjusted);
      setSlotsFallback(fallback);
    } catch {
      setSlots([]);
      setSlotsFallback(false);
    } finally {
      setLoadingSlots(false);
    }
  }, [doctor, clinic, date]);

  useEffect(() => {
    if (step === 'time') loadSlots();
  }, [step, loadSlots]);

  // Load services + rooms for the chosen doctor's company (on the details step).
  const loadOptions = useCallback(async () => {
    if (!doctor) return;
    setLoadingOptions(true);
    try {
      const { services: svc, rooms: rms } = await getBookingOptions(doctor.id, companyId);
      setServices(svc);
      setRooms(rms);
    } catch {
      setServices([]);
      setRooms([]);
    } finally {
      setLoadingOptions(false);
    }
  }, [doctor, companyId]);

  useEffect(() => {
    if (step === 'details') loadOptions();
  }, [step, loadOptions]);

  // ---- Navigation ----------------------------------------------------------

  const goNext = (next: StepId) => setStep(next);
  const goBack = () => {
    if (stepIndex > 0) {
      setStep(STEP_ORDER[stepIndex - 1]);
    } else {
      router.back();
    }
  };

  const resetFlow = () => {
    setPatient(null);
    setDoctor(null);
    setClinic(null);
    setDate(null);
    setTime(null);
    setSlots([]);
    setService(null);
    setRoom(null);
    setServices([]);
    setRooms([]);
    setSuccess(false);
    setPatientSearch('');
    setStep('doctor');
  };

  const handleSelectDoctor = (d: ReceptionDoctor) => {
    setDoctor(d);
    // Changing the doctor invalidates every downstream selection — clinic,
    // service, room and patient are all re-scoped to this doctor.
    setPatient(null);
    setClinic(null);
    setDate(null);
    setTime(null);
    setService(null);
    setRoom(null);
    setServices([]);
    setRooms([]);
    // Auto-skip the clinic step when the doctor has only one clinic.
    if (d.clinics.length === 1) {
      setClinic(d.clinics[0]);
      goNext('details');
    } else {
      goNext('clinic');
    }
  };
  const handleSelectClinic = (c: ReceptionClinic) => {
    setClinic(c);
    setDate(null);
    setTime(null);
    goNext('details');
  };
  const handleSelectPatient = (p: ReceptionPatient) => {
    setPatient(p);
    goNext('date');
  };
  const handleSelectDate = (d: Date) => {
    setDate(d);
    setTime(null);
    goNext('time');
  };
  const handleSelectTime = (slotTime: string) => {
    setTime(slotTime);
    goNext('confirm');
  };

  // Manual custom time — lets staff book a doctor who works by custom times
  // (no fixed schedule). Validates HH:MM and proceeds to confirm.
  const handleAddCustomTime = () => {
    const normalized = normalizeTime(customTime);
    if (!normalized) {
      setCustomTimeError(t('reception.invalidTime'));
      return;
    }
    // Block a custom time that collides with an already-booked slot.
    const clash = slots.find((s) => s.time === normalized && !s.available);
    if (clash) {
      setCustomTimeError(t('reception.timeTaken'));
      return;
    }
    setCustomTimeError('');
    setCustomTime('');
    handleSelectTime(normalized);
  };

  const handleConfirm = async () => {
    if (!patient || !doctor || !clinic || !date || !time) return;
    setBooking(true);
    try {
      await book({
        userId,
        patientId: patient.patient_id,
        medicalId: patient.medical_id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        appointmentDate: toDateKey(date),
        appointmentTime: time,
        serviceId: service?.id ?? null,
        roomId: room?.id ?? null,
      });
      setSuccess(true);
    } catch (e: any) {
      Alert.alert(t('reception.bookingFailedTitle'), e?.message || t('reception.errorGeneric'));
    } finally {
      setBooking(false);
    }
  };

  // ---- Derived -------------------------------------------------------------

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.medical_id?.toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q)
    );
  }, [patients, patientSearch]);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  // ---- Success screen ------------------------------------------------------

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: colors.primaryLight }]}>
            <CheckCircle2 size={56} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>{t('reception.successTitle')}</Text>
          <Text style={[styles.successText, { color: colors.textSecondary }]}>
            {t('reception.successText', {
              patient: patient?.full_name,
              doctor: `${doctor?.first_name} ${doctor?.last_name}`,
            })}
          </Text>

          <View style={styles.successActions}>
            <TouchableOpacity style={styles.successPrimaryBtn} onPress={resetFlow} activeOpacity={0.9}>
              <LinearGradient
                colors={['#2D7DD2', '#15C2B0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.successPrimaryGrad}
              >
                <ClipboardList size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.successPrimaryText}>{t('reception.bookAnother')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.successSecondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => router.push('/(reception-tabs)/appointments' as any)}
              activeOpacity={0.85}
            >
              <CalendarIcon size={18} color={colors.primary} strokeWidth={2.5} />
              <Text style={[styles.successSecondaryText, { color: colors.primary }]}>{t('reception.viewAppointments')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Step content --------------------------------------------------------

  const renderPatientStep = () => (
    <ScrollView
      style={styles.stepScroll}
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={[styles.stepTitle, { color: colors.text }]}>{t('reception.selectPatientTitle')}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>{t('reception.selectPatientSubtitle')}</Text>

      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Search size={18} color={colors.textSecondary} strokeWidth={2} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('reception.searchPatients')}
          placeholderTextColor={colors.textTertiary}
          value={patientSearch}
          onChangeText={setPatientSearch}
          autoCorrect={false}
        />
        {patientSearch ? (
          <TouchableOpacity onPress={() => setPatientSearch('')} hitSlop={8}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loadingPatients ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : loadError ? (
        <EmptyState icon={Users} text={loadError} colors={colors} retry={loadData} retryLabel={t('reception.retry')} />
      ) : filteredPatients.length === 0 ? (
        <EmptyState icon={Users} text={t('reception.noPatients')} colors={colors} />
      ) : (
        <View style={styles.list}>
          {filteredPatients.map((p) => (
            <PatientCard
              key={p.patient_id}
              patient={p}
              selected={patient?.patient_id === p.patient_id}
              onPress={() => handleSelectPatient(p)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderDoctorStep = () => (
    <ScrollView
      style={styles.stepScroll}
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={[styles.stepTitle, { color: colors.text }]}>{t('reception.selectDoctorTitle')}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>{t('reception.selectDoctorSubtitle')}</Text>

      {loadingDoctors ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : doctors.length === 0 ? (
        <EmptyState icon={Stethoscope} text={t('reception.noDoctors')} colors={colors} />
      ) : (
        <View style={styles.list}>
          {doctors.map((d) => (
            <DoctorCard
              key={d.id}
              doctor={d}
              selected={doctor?.id === d.id}
              onPress={() => handleSelectDoctor(d)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderClinicStep = () => (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>{t('reception.selectClinicTitle')}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>{t('reception.selectClinicSubtitle')}</Text>

      {!doctor || doctor.clinics.length === 0 ? (
        <EmptyState icon={Building2} text={t('reception.noClinics')} colors={colors} />
      ) : (
        <View style={styles.list}>
          {doctor.clinics.map((c) => (
            <ClinicCard key={c.id} clinic={c} selected={clinic?.id === c.id} onPress={() => handleSelectClinic(c)} />
          ))}
        </View>
      )}
    </ScrollView>
  );

  // Continue is allowed when each list is either empty (nothing to choose) or has
  // a selection — mirrors the web form requiring a service and a room when present.
  const detailsReady =
    (services.length === 0 || !!service) && (rooms.length === 0 || !!room);

  // Filter the open picker's list by the search box (case-insensitive).
  const filteredServices = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, pickerSearch]);
  const filteredRooms = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) => roomLabel(r).toLowerCase().includes(q) || (r.room_type || '').toLowerCase().includes(q));
  }, [rooms, pickerSearch]);

  const openPickerFor = (which: 'service' | 'room') => {
    setPickerSearch('');
    setOpenPicker(which);
  };
  const closePicker = () => {
    setPickerSearch('');
    setOpenPicker(null);
  };

  const renderDetailsStep = () => (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>{t('reception.detailsTitle')}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>{t('reception.detailsSubtitle')}</Text>

      {loadingOptions ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <View style={{ gap: 18 }}>
          {/* Service */}
          <View>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('reception.serviceLabel')}</Text>
            {services.length === 0 ? (
              <Text style={[styles.fieldEmpty, { color: colors.textTertiary }]}>{t('reception.noServices')}</Text>
            ) : (
              <TouchableOpacity
                style={[styles.selectBtn, { backgroundColor: colors.card, borderColor: service ? colors.primary : colors.border }]}
                onPress={() => openPickerFor('service')}
                activeOpacity={0.8}
              >
                <Stethoscope size={18} color={colors.primary} strokeWidth={2} />
                <Text style={[styles.selectText, { color: service ? colors.text : colors.textTertiary }]} numberOfLines={1}>
                  {service ? service.name : t('reception.selectService')}
                </Text>
                <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            )}
            {service?.price != null || service?.duration_minutes != null ? (
              <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
                {[service?.price != null ? `$${service.price}` : null, service?.duration_minutes != null ? t('reception.minutesValue', { minutes: service.duration_minutes }) : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ) : null}
          </View>

          {/* Room */}
          <View>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('reception.roomLabel')}</Text>
            {rooms.length === 0 ? (
              <Text style={[styles.fieldEmpty, { color: colors.textTertiary }]}>{t('reception.noRooms')}</Text>
            ) : (
              <TouchableOpacity
                style={[styles.selectBtn, { backgroundColor: colors.card, borderColor: room ? colors.primary : colors.border }]}
                onPress={() => openPickerFor('room')}
                activeOpacity={0.8}
              >
                <DoorOpen size={18} color={colors.primary} strokeWidth={2} />
                <Text style={[styles.selectText, { color: room ? colors.text : colors.textTertiary }]} numberOfLines={1}>
                  {room ? roomLabel(room) : t('reception.selectRoom')}
                </Text>
                <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !detailsReady && styles.primaryBtnDisabled]}
            onPress={() => detailsReady && goNext('patient')}
            disabled={!detailsReady}
            activeOpacity={0.9}
          >
            <LinearGradient colors={['#2D7DD2', '#15C2B0']} style={styles.primaryBtnGrad}>
              <Text style={styles.primaryBtnText}>{t('reception.continue')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderDateStep = () => (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>{t('reception.selectDateTitle')}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>{t('reception.selectDateSubtitle')}</Text>
      <BookingCalendar selectedDate={date} onSelect={handleSelectDate} minDate={today} maxDate={maxDate} />
    </ScrollView>
  );

  const renderTimeStep = () => (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>{t('reception.selectTimeTitle')}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        {date ? date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
      </Text>

      {!loadingSlots && slotsFallback ? (
        <View style={[styles.noticeBox, { backgroundColor: colors.primaryLight || '#EAF3FC' }]}>
          <Text style={[styles.noticeText, { color: colors.primary }]}>{t('reception.customDayNotice')}</Text>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <SlotGrid slots={slots} selected={time} onSelect={handleSelectTime} loading={loadingSlots} />
      </View>

      {/* Manual custom time — always available so staff can book any time, e.g.
          for doctors who work by custom appointments instead of a schedule. */}
      {!loadingSlots ? (
        <View style={[styles.customCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.customTitle, { color: colors.text }]}>{t('reception.customTimeTitle')}</Text>
          <Text style={[styles.customHint, { color: colors.textSecondary }]}>{t('reception.customTimeHint')}</Text>
          <View style={styles.customRow}>
            <TextInput
              style={[styles.customInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: customTimeError ? '#FCA5A5' : colors.border }]}
              placeholder="14:30"
              placeholderTextColor={colors.textTertiary}
              value={customTime}
              onChangeText={(v) => { setCustomTime(v); setCustomTimeError(''); }}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
            <TouchableOpacity style={styles.customAddBtn} onPress={handleAddCustomTime} activeOpacity={0.85}>
              <LinearGradient colors={['#2D7DD2', '#15C2B0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.customAddGrad}>
                <Text style={styles.customAddText}>{t('reception.addCustomTime')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {customTimeError ? <Text style={styles.customError}>{customTimeError}</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );

  const renderConfirmStep = () => (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>{t('reception.confirmTitle')}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>{t('reception.confirmSubtitle')}</Text>

      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <SummaryRow icon={Users} label={t('reception.stepPatient')} value={patient?.full_name || ''} sub={patient?.medical_id} colors={colors} />
        <Divider colors={colors} />
        <SummaryRow
          icon={Stethoscope}
          label={t('reception.stepDoctor')}
          value={`${doctor?.first_name || ''} ${doctor?.last_name || ''}`.trim()}
          sub={doctor?.specialization}
          colors={colors}
        />
        <Divider colors={colors} />
        <SummaryRow icon={Building2} label={t('reception.stepClinic')} value={clinic?.name || ''} sub={clinic?.address} colors={colors} />
        {service ? (
          <>
            <Divider colors={colors} />
            <SummaryRow
              icon={Stethoscope}
              label={t('reception.serviceLabel')}
              value={service.name}
              sub={service.price != null ? `$${service.price}` : undefined}
              colors={colors}
            />
          </>
        ) : null}
        {room ? (
          <>
            <Divider colors={colors} />
            <SummaryRow icon={DoorOpen} label={t('reception.roomLabel')} value={roomLabel(room)} sub={room.room_type || undefined} colors={colors} />
          </>
        ) : null}
        <Divider colors={colors} />
        <SummaryRow
          icon={CalendarIcon}
          label={t('reception.dateTimeLabel')}
          value={date ? date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
          sub={time ? formatTime12(time) : ''}
          colors={colors}
        />
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm} disabled={booking} activeOpacity={0.9}>
        <LinearGradient colors={['#2D7DD2', '#15C2B0']} style={styles.primaryBtnGrad}>
          {booking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.confirmRow}>
              <CheckCircle2 size={22} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.primaryBtnText}>{t('reception.confirmBooking')}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep = () => {
    switch (step) {
      case 'patient': return renderPatientStep();
      case 'doctor': return renderDoctorStep();
      case 'clinic': return renderClinicStep();
      case 'details': return renderDetailsStep();
      case 'date': return renderDateStep();
      case 'time': return renderTimeStep();
      case 'confirm': return renderConfirmStep();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={goBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('reception.bookTitle')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <StepProgress steps={steps} currentIndex={stepIndex} />

      {renderStep()}

      {/* Service / Room option picker (centered) */}
      <Modal visible={!!openPicker} transparent animationType="fade" onRequestClose={closePicker}>
        <TouchableOpacity style={styles.pickerScrim} activeOpacity={1} onPress={closePicker}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerCard, { backgroundColor: colors.card }]}>
            <View style={[styles.pickerHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                {openPicker === 'service' ? t('reception.selectService') : t('reception.selectRoom')}
              </Text>
              <TouchableOpacity onPress={closePicker} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.pickerSearch, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Search size={16} color={colors.textSecondary} strokeWidth={2} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={openPicker === 'service' ? t('reception.searchServices') : t('reception.searchRooms')}
                placeholderTextColor={colors.textTertiary}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                autoCorrect={false}
                autoFocus
              />
              {pickerSearch ? (
                <TouchableOpacity onPress={() => setPickerSearch('')} hitSlop={8}>
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {openPicker === 'service'
                ? (filteredServices.length === 0
                    ? <Text style={[styles.pickerEmpty, { color: colors.textTertiary }]}>{t('reception.noResults')}</Text>
                    : filteredServices.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.pickerRow}
                      onPress={() => { setService(s); closePicker(); }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerRowText, { color: colors.text }]} numberOfLines={1}>{s.name}</Text>
                        {(s.price != null || s.duration_minutes != null) ? (
                          <Text style={[styles.pickerRowSub, { color: colors.textSecondary }]}>
                            {[s.price != null ? `$${s.price}` : null, s.duration_minutes != null ? t('reception.minutesValue', { minutes: s.duration_minutes }) : null].filter(Boolean).join(' · ')}
                          </Text>
                        ) : null}
                      </View>
                      {service?.id === s.id ? <Check size={18} color={colors.primary} strokeWidth={2.5} /> : null}
                    </TouchableOpacity>
                  )))
                : (filteredRooms.length === 0
                    ? <Text style={[styles.pickerEmpty, { color: colors.textTertiary }]}>{t('reception.noResults')}</Text>
                    : filteredRooms.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={styles.pickerRow}
                      onPress={() => { setRoom(r); closePicker(); }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerRowText, { color: colors.text }]} numberOfLines={1}>{roomLabel(r)}</Text>
                        {r.room_type ? <Text style={[styles.pickerRowSub, { color: colors.textSecondary }]}>{r.room_type}</Text> : null}
                      </View>
                      {room?.id === r.id ? <Check size={18} color={colors.primary} strokeWidth={2.5} /> : null}
                    </TouchableOpacity>
                  )))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// "Room 12 · 2nd floor" style label.
function roomLabel(r: ReceptionRoom): string {
  const num = r.room_number ? `Room ${r.room_number}` : 'Room';
  return r.floor != null ? `${num} · Floor ${r.floor}` : num;
}

// ---- Small presentational helpers ------------------------------------------

function EmptyState({
  icon: Icon,
  text,
  colors,
  retry,
  retryLabel,
}: {
  icon: any;
  text: string;
  colors: any;
  retry?: () => void;
  retryLabel?: string;
}) {
  return (
    <View style={emptyStyles.wrap}>
      <Icon size={48} color={colors.textTertiary} strokeWidth={1.5} />
      <Text style={[emptyStyles.text, { color: colors.textSecondary }]}>{text}</Text>
      {retry ? (
        <TouchableOpacity onPress={retry} style={[emptyStyles.retry, { borderColor: colors.primary }]} activeOpacity={0.7}>
          <Text style={[emptyStyles.retryText, { color: colors.primary }]}>{retryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  sub,
  colors,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string | null;
  colors: any;
}) {
  return (
    <View style={summaryStyles.row}>
      <View style={[summaryStyles.iconWrap, { backgroundColor: colors.backgroundSecondary }]}>
        <Icon size={22} color={colors.primary} strokeWidth={2} />
      </View>
      <View style={summaryStyles.info}>
        <Text style={[summaryStyles.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[summaryStyles.value, { color: colors.text }]}>{value || '—'}</Text>
        {sub ? <Text style={[summaryStyles.sub, { color: colors.textTertiary }]}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={[summaryStyles.divider, { backgroundColor: colors.border }]} />;
}

const emptyStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, gap: 12 },
  text: { fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
  retry: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, marginTop: 4 },
  retryText: { fontSize: 14, fontWeight: '700' },
});

const summaryStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  iconWrap: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, gap: 2 },
  label: { fontSize: 12.5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  value: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 13 },
  divider: { height: 1, marginVertical: 14 },
});

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
    headerBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800' },

    stepScroll: { flex: 1 },
    stepContent: { padding: 20, paddingBottom: 40 },
    stepTitle: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
    stepSubtitle: { fontSize: 15, marginBottom: 18 },

    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      height: 50,
      borderRadius: 14,
      borderWidth: 1.5,
      marginBottom: 16,
    },
    searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

    list: { gap: 12 },
    loader: { marginTop: 40 },
    card: { borderRadius: 18, padding: 16, minHeight: 180 },

    fieldLabel: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
    fieldEmpty: { fontSize: 13.5, fontStyle: 'italic', paddingVertical: 6 },
    fieldHint: { fontSize: 12.5, marginTop: 6 },
    selectBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      height: 52, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14,
    },
    selectText: { flex: 1, fontSize: 15, fontWeight: '600' },

    pickerScrim: { flex: 1, backgroundColor: 'rgba(2,6,23,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    pickerCard: { width: '100%', maxWidth: 420, borderRadius: 22, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16, maxHeight: '70%' },
    pickerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
    pickerTitle: { fontSize: 17, fontWeight: '800' },
    pickerSearch: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 42, borderRadius: 12, borderWidth: 1, marginTop: 12 },
    pickerList: { paddingTop: 4 },
    pickerEmpty: { fontSize: 14, textAlign: 'center', paddingVertical: 28 },
    pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
    pickerRowText: { fontSize: 15, fontWeight: '600' },
    pickerRowSub: { fontSize: 12.5, marginTop: 2 },

    noticeBox: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 },
    noticeText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },

    customCard: { marginTop: 16, borderRadius: 18, borderWidth: 1, padding: 16 },
    customTitle: { fontSize: 15, fontWeight: '800' },
    customHint: { fontSize: 12.5, marginTop: 2, marginBottom: 12 },
    customRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    customInput: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 16, fontWeight: '700' },
    customAddBtn: { borderRadius: 12, overflow: 'hidden' },
    customAddGrad: { paddingHorizontal: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    customAddText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    customError: { color: '#DC2626', fontSize: 12.5, fontWeight: '600', marginTop: 8 },

    summaryCard: {
      borderRadius: 20,
      padding: 18,
      marginBottom: 22,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 18,
      elevation: 2,
    },

    primaryBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 6 },
    primaryBtnDisabled: { opacity: 0.5 },
    primaryBtnGrad: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    primaryBtnText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
    confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

    successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
    successIcon: { width: 104, height: 104, borderRadius: 52, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    successTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
    successText: { fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 360 },
    successActions: { alignSelf: 'stretch', marginTop: 18, gap: 12 },
    successPrimaryBtn: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#15C2B0',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.28,
      shadowRadius: 20,
      elevation: 5,
    },
    successPrimaryGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
    successPrimaryText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
    successSecondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 15,
      borderRadius: 16,
      borderWidth: 1.5,
    },
    successSecondaryText: { fontSize: 15, fontWeight: '800' },
  });

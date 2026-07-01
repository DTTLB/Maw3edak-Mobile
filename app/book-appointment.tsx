import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { config } from '@/utils/config';
import {
  ArrowLeft,
  Stethoscope,
  Building2,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  MapPin,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';
import { getSession } from '@/utils/auth';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  image_url: string | null;
  specialization?: string;
  clinics: Clinic[];
}

interface Clinic {
  id: string;
  name: string;
  address?: string;
}

type Step = 'doctor' | 'clinic' | 'datetime' | 'confirm';

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<Step>('doctor');
  const [loading, setLoading] = useState(false);
  const [medicalId, setMedicalId] = useState<string>('');

  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'doctor', label: t('bookAppointment.stepDoctor'), icon: Stethoscope },
    { id: 'clinic', label: t('bookAppointment.stepClinic'), icon: Building2 },
    { id: 'datetime', label: t('bookAppointment.stepDateTime'), icon: CalendarIcon },
    { id: 'confirm', label: t('common.confirm'), icon: CheckCircle2 },
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const session = await getSession();
      if (session?.patient?.medical_id) {
        setMedicalId(session.patient.medical_id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadDoctors = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctors-for-booking`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            medicalId: medicalId,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setDoctors(result.doctors || []);
      } else {
        Alert.alert(t('common.error'), result.error || t('bookAppointment.failedToLoadDoctors'));
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      Alert.alert(t('common.error'), t('bookAppointment.failedToLoadDoctors'));
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [medicalId, t]);

  const loadAvailableDates = useCallback(async () => {
    if (!selectedDoctor || !selectedClinic) return;

    try {
      setLoadingDates(true);

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-available-dates`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            doctorId: selectedDoctor.id,
            clinicId: selectedClinic.id,
            year: currentMonth.getFullYear(),
            month: currentMonth.getMonth(),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setAvailableDates(result.availableDates || []);
      } else {
        console.error('Failed to load available dates:', result.error);
        setAvailableDates([]);
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
      setAvailableDates([]);
    } finally {
      setLoadingDates(false);
    }
  }, [selectedDoctor, selectedClinic, currentMonth]);

  const loadAvailableSlots = useCallback(async () => {
    if (!selectedDoctor || !selectedClinic || !selectedDate) return;

    try {
      setLoadingSlots(true);

      const dateStr = selectedDate.toISOString().split('T')[0];

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-available-slots`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            doctorId: selectedDoctor.id,
            clinicId: selectedClinic.id,
            date: dateStr,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setAvailableSlots(result.availableSlots || []);
      } else {
        Alert.alert(t('common.error'), result.error || t('bookAppointment.failedToLoadSlots'));
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      Alert.alert(t('common.error'), t('bookAppointment.failedToLoadSlots'));
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDoctor, selectedClinic, selectedDate, t]);

  // Load doctors as soon as we're on the doctor step — even without a medical_id
  // (e.g. staff/receptionist context), in which case all bookable doctors load.
  useEffect(() => {
    if (currentStep === 'doctor') {
      loadDoctors();
    }
  }, [currentStep, loadDoctors]);

  useEffect(() => {
    if (selectedClinic && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedClinic, selectedDate, loadAvailableSlots]);

  useEffect(() => {
    if (selectedDoctor && selectedClinic && currentStep === 'datetime') {
      loadAvailableDates();
    }
  }, [selectedDoctor, selectedClinic, currentMonth, currentStep, loadAvailableDates]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      switch (currentStep) {
        case 'doctor':
          await loadDoctors();
          break;
        case 'datetime':
          await Promise.all([
            loadAvailableDates(),
            selectedDate ? loadAvailableSlots() : Promise.resolve(),
          ]);
          break;
        default:
          break;
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setCurrentStep('clinic');
  };

  const handleClinicSelect = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableSlots([]);
    setCurrentStep('datetime');
  };

  const handleDateTimeSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setCurrentStep('confirm');
  };

  const handleBack = () => {
    const stepOrder: Step[] = ['doctor', 'clinic', 'datetime', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      // No navigation history (deep link / fresh load): route home, which
      // re-dispatches to the correct portal for the logged-in role.
      router.replace('/' as any);
    }
  };

  const handleConfirmAppointment = async () => {
    if (!selectedDoctor || !selectedClinic || !selectedDate || !selectedTime) {
      Alert.alert(t('common.error'), t('bookAppointment.completeAllSteps'));
      return;
    }

    const now = new Date();
    const maxBookingDate = new Date(now);
    maxBookingDate.setMonth(maxBookingDate.getMonth() + 6);

    if (selectedDate > maxBookingDate) {
      Alert.alert(t('common.error'), t('bookAppointment.maxAdvanceWarning'));
      return;
    }

    const isToday = selectedDate.toDateString() === now.toDateString();

    if (isToday) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentTime = new Date();
      appointmentTime.setHours(hours, minutes, 0, 0);

      if (appointmentTime.getTime() <= now.getTime()) {
        Alert.alert(t('common.error'), t('bookAppointment.cannotBookPast'));
        return;
      }
    }

    try {
      setLoading(true);

      const session = await getSession();
      if (!session?.patient?.medical_id) {
        Alert.alert(t('common.error'), t('bookAppointment.pleaseLogInAgain'));
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-book-appointment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            medicalId: session.patient.medical_id,
            doctorId: selectedDoctor.id,
            clinicId: selectedClinic.id,
            appointmentDate: selectedDate.toISOString().split('T')[0],
            appointmentTime: selectedTime,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.error || t('bookAppointment.failedToBook');
        const errorDetails = result.details ? `\n\n${result.details}` : '';
        throw new Error(errorMessage + errorDetails);
      }

      setShowSuccess(true);
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/' as any);
        }
      }, 2000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      const errorMessage = error instanceof Error ? error.message : t('bookAppointment.failedToBookRetry');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const mins = minutes || '00';
    return `${displayHour}:${mins} ${ampm}`;
  };

  const renderStepIndicator = () => (
    <View style={[styles.stepIndicator, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted =
          (step.id === 'doctor' && selectedDoctor) ||
          (step.id === 'clinic' && selectedClinic) ||
          (step.id === 'datetime' && selectedDate && selectedTime) ||
          (step.id === 'confirm' && currentStep === 'confirm');

        const Icon = step.icon;

        return (
          <View key={step.id} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                { backgroundColor: colors.backgroundSecondary },
                isActive && { backgroundColor: colors.primary },
                isCompleted && { backgroundColor: colors.primary },
              ]}
            >
              <Icon
                size={18}
                color={isActive || isCompleted ? '#ffffff' : colors.textTertiary}
                strokeWidth={2.5}
              />
            </View>
            <Text
              style={[
                styles.stepLabel,
                { color: colors.textTertiary },
                isActive && { color: colors.primary },
                isCompleted && { color: colors.primary },
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderDoctorStep = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={[styles.stepTitle, { color: colors.text }]}>{t('bookAppointment.selectDoctorTitle')}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>{t('bookAppointment.selectDoctorSubtitle')}</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : doctors.length === 0 ? (
        <View style={styles.emptyState}>
          <Stethoscope size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{t('bookAppointment.noDoctorsAvailable')}</Text>
        </View>
      ) : (
        <View style={styles.cardsList}>
          {doctors.map((doctor) => (
            <TouchableOpacity
              key={doctor.id}
              style={[styles.doctorCard, { backgroundColor: colors.card }]}
              onPress={() => handleDoctorSelect(doctor)}
              activeOpacity={0.7}
            >
              <View style={styles.doctorCardContent}>
                <View style={styles.doctorLeft}>
                  {doctor.image_url ? (
                    <Image
                      source={{ uri: doctor.image_url }}
                      style={styles.doctorImage}
                    />
                  ) : (
                    <View style={[styles.doctorImagePlaceholder, { backgroundColor: colors.primary }]}>
                      <Text style={styles.doctorInitials}>
                        {doctor.first_name.charAt(0)}
                        {doctor.last_name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.doctorInfo}>
                    <Text style={[styles.doctorName, { color: colors.text }]}>
                      {t('bookAppointment.doctorName', { name: `${doctor.first_name} ${doctor.last_name}` })}
                    </Text>
                    {doctor.specialization && (
                      <Text style={[styles.doctorSpecialty, { color: colors.textSecondary }]}>{doctor.specialization}</Text>
                    )}
                    <View style={styles.clinicBadge}>
                      <Building2 size={12} color={colors.textSecondary} />
                      <Text style={[styles.clinicBadgeText, { color: colors.textSecondary }]}>
                        {doctor.clinics.length === 1
                          ? t('bookAppointment.clinicCount', { count: doctor.clinics.length })
                          : t('bookAppointment.clinicCount_plural', { count: doctor.clinics.length })}
                      </Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={24} color={colors.primary} strokeWidth={2} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderClinicStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>{t('bookAppointment.selectClinicTitle')}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>{t('bookAppointment.selectClinicSubtitle')}</Text>

      {!selectedDoctor || selectedDoctor.clinics.length === 0 ? (
        <View style={styles.emptyState}>
          <Building2 size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{t('bookAppointment.noClinicsAvailable')}</Text>
        </View>
      ) : (
        <View style={styles.cardsList}>
          {selectedDoctor.clinics.map((clinic) => (
            <TouchableOpacity
              key={clinic.id}
              style={[styles.clinicCard, { backgroundColor: colors.card }]}
              onPress={() => handleClinicSelect(clinic)}
              activeOpacity={0.7}
            >
              <View style={styles.clinicCardContent}>
                <View style={[styles.clinicIconContainer, { backgroundColor: colors.primaryLight }]}>
                  <Building2 size={28} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.clinicInfo}>
                  <Text style={[styles.clinicName, { color: colors.text }]}>{clinic.name}</Text>
                  {clinic.address && (
                    <View style={styles.addressRow}>
                      <MapPin size={14} color={colors.textSecondary} />
                      <Text style={[styles.clinicAddress, { color: colors.textSecondary }]}>{clinic.address}</Text>
                    </View>
                  )}
                </View>
                <ChevronRight size={24} color={colors.primary} strokeWidth={2} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderDateTimeStep = () => {
    const today = new Date();
    const maxBookingDate = new Date(today);
    maxBookingDate.setMonth(maxBookingDate.getMonth() + 6);

    const handleDateSelection = (date: Date) => {
      setSelectedDate(date);
      setSelectedTime(null);
    };

    const isTimeSlotPast = (slot: string): boolean => {
      if (!selectedDate) return false;

      const isToday = selectedDate.toDateString() === today.toDateString();
      if (!isToday) return false;

      const [hours, minutes] = slot.split(':').map(Number);
      const slotTime = new Date();
      slotTime.setHours(hours, minutes, 0, 0);

      return slotTime.getTime() <= today.getTime();
    };

    const filteredSlots = availableSlots.filter(slot => !isTimeSlotPast(slot));

    const handlePreviousMonth = () => {
      const newMonth = new Date(currentMonth);
      newMonth.setMonth(currentMonth.getMonth() - 1);

      const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      if (newMonth >= todayMonth) {
        setCurrentMonth(newMonth);
      }
    };

    const handleNextMonth = () => {
      const newMonth = new Date(currentMonth);
      newMonth.setMonth(currentMonth.getMonth() + 1);

      const maxMonth = new Date(maxBookingDate.getFullYear(), maxBookingDate.getMonth(), 1);
      if (newMonth <= maxMonth) {
        setCurrentMonth(newMonth);
      }
    };

    const canGoPrevious = () => {
      const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const prevMonth = new Date(currentMonth);
      prevMonth.setMonth(currentMonth.getMonth() - 1);
      return prevMonth >= todayMonth;
    };

    const canGoNext = () => {
      const maxMonth = new Date(maxBookingDate.getFullYear(), maxBookingDate.getMonth(), 1);
      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(currentMonth.getMonth() + 1);
      return nextMonth <= maxMonth;
    };

    const getAvailableDaysForMonth = () => {
      return availableDates
        .map(dateStr => new Date(dateStr))
        .filter(date => date <= maxBookingDate)
        .sort((a, b) => a.getTime() - b.getTime());
    };

    const availableDays = getAvailableDaysForMonth();

    const getDayName = (date: Date): string => {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    return (
      <ScrollView
        style={styles.stepContent}
        contentContainerStyle={styles.dateTimeScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.stepTitle, { color: colors.text }]}>{t('bookAppointment.selectDateTimeTitle')}</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>{t('bookAppointment.selectDateTimeSubtitle')}</Text>

        <View style={styles.dateTimeContainer}>
          <View style={[styles.dateSection, { backgroundColor: colors.card }]}>
            <View style={[styles.monthHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                onPress={handlePreviousMonth}
                style={[
                  styles.navButton,
                  { backgroundColor: colors.backgroundSecondary },
                  !canGoPrevious() && styles.navButtonDisabled
                ]}
                activeOpacity={0.7}
                disabled={!canGoPrevious()}
              >
                <ChevronLeft
                  size={24}
                  color={canGoPrevious() ? colors.primary : colors.textTertiary}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: colors.text }]}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={[
                  styles.navButton,
                  { backgroundColor: colors.backgroundSecondary },
                  !canGoNext() && styles.navButtonDisabled
                ]}
                activeOpacity={0.7}
                disabled={!canGoNext()}
              >
                <ChevronRight
                  size={24}
                  color={canGoNext() ? colors.primary : colors.textTertiary}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.bookingLimitInfo, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
              <Text style={[styles.bookingLimitText, { color: colors.info }]}>
                {t('bookAppointment.maxAdvanceWarning')}
              </Text>
            </View>

            {loadingDates ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingDatesText, { color: colors.textSecondary }]}>{t('bookAppointment.loadingDates')}</Text>
              </View>
            ) : availableDays.length === 0 ? (
              <View style={styles.emptyDatesContainer}>
                <CalendarIcon size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyDatesText, { color: colors.textTertiary }]}>
                  {t('bookAppointment.noDatesThisMonth')}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.daysScrollView}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.daysGrid}>
                  {availableDays.map((date) => {
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    const dateStr = date.toISOString().split('T')[0];

                    return (
                      <TouchableOpacity
                        key={dateStr}
                        style={[
                          styles.dayCard,
                          { backgroundColor: 'rgba(21,194,176,0.12)', borderColor: 'rgba(21,194,176,0.22)' },
                          isSelected && { backgroundColor: '#2D7DD2', borderColor: '#2D7DD2' },
                        ]}
                        onPress={() => handleDateSelection(date)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayName,
                            { color: colors.textSecondary },
                            isSelected && { color: '#ffffff' },
                          ]}
                        >
                          {getDayName(date)}
                        </Text>
                        <Text
                          style={[
                            styles.dayNumber,
                            { color: colors.text },
                            isSelected && { color: '#ffffff' },
                          ]}
                        >
                          {date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          <View style={[styles.timeSlotsSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.timeSlotsTitle, { color: colors.text }]}>{t('bookAppointment.availableTimeSlots')}</Text>

            {!selectedDate ? (
              <View style={styles.timeSlotsPlaceholder}>
                <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>{t('bookAppointment.selectDateFirst')}</Text>
              </View>
            ) : loadingSlots ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : filteredSlots.length === 0 ? (
              <View style={styles.timeSlotsPlaceholder}>
                <Clock size={48} color={colors.textTertiary} />
                <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>
                  {availableSlots.length > 0
                    ? t('bookAppointment.noSlotsRemainingToday')
                    : t('bookAppointment.noSlotsThisDate')}
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.timeSlotsGrid}>
                  {filteredSlots.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.timeSlot,
                          { backgroundColor: 'rgba(21,194,176,0.12)', borderColor: 'rgba(21,194,176,0.22)' },
                          isSelected && { backgroundColor: '#2D7DD2', borderColor: '#2D7DD2' },
                        ]}
                        onPress={() => setSelectedTime(slot)}
                        activeOpacity={0.7}
                      >
                        <Clock
                          size={16}
                          color={isSelected ? '#ffffff' : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.timeSlotText,
                            { color: colors.text },
                            isSelected && { color: '#ffffff' },
                          ]}
                        >
                          {formatTime(slot)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        </View>

        {selectedDate && selectedTime && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => handleDateTimeSelect(selectedDate, selectedTime)}
            activeOpacity={0.9}
          >
            <LinearGradient colors={['#2D7DD2', '#15C2B0', '#FF6F61']} style={styles.nextButtonGradient}>
              <Text style={styles.nextButtonText}>{t('bookAppointment.continueToConfirmation')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  const renderConfirmStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>{t('bookAppointment.confirmTitle')}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>{t('bookAppointment.confirmSubtitle')}</Text>

      {showSuccess && (
        <View style={[styles.successMessage, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
          <CheckCircle2 size={24} color={colors.success} strokeWidth={2.5} />
          <View style={styles.successMessageContent}>
            <Text style={[styles.successTitle, { color: colors.success }]}>{t('common.success')}</Text>
            <Text style={[styles.successText, { color: colors.text }]}>
              {t('bookAppointment.bookedSuccess')}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <View style={styles.summarySection}>
          <View style={[styles.summaryIconContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Stethoscope size={24} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('bookAppointment.stepDoctor')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {selectedDoctor ? t('bookAppointment.doctorName', { name: `${selectedDoctor.first_name} ${selectedDoctor.last_name}` }) : t('common.notAvailable')}
            </Text>
            {selectedDoctor?.specialization && (
              <Text style={[styles.summarySubValue, { color: colors.textTertiary }]}>
                {selectedDoctor.specialization}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

        <View style={styles.summarySection}>
          <View style={[styles.summaryIconContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Building2 size={24} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('bookAppointment.stepClinic')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {selectedClinic?.name || t('common.notAvailable')}
            </Text>
            {selectedClinic?.address && (
              <Text style={[styles.summarySubValue, { color: colors.textTertiary }]}>
                {selectedClinic.address}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

        <View style={styles.summarySection}>
          <View style={[styles.summaryIconContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <CalendarIcon size={24} color={colors.warning} strokeWidth={2} />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('bookAppointment.stepDateTime')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {selectedDate ? formatDate(selectedDate) : t('common.notAvailable')}
            </Text>
            <Text style={[styles.summarySubValue, { color: colors.textTertiary }]}>
              {selectedTime ? formatTime(selectedTime) : t('common.notAvailable')}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirmAppointment}
        disabled={loading}
        activeOpacity={0.9}
      >
        <LinearGradient colors={['#2D7DD2', '#15C2B0', '#FF6F61']} style={styles.confirmButtonGradient}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CheckCircle2 size={24} color="#ffffff" strokeWidth={2.5} />
              <Text style={[styles.confirmButtonText, { marginLeft: 10 }]}>{t('bookAppointment.confirmButton')}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'doctor':
        return renderDoctorStep();
      case 'clinic':
        return renderClinicStep();
      case 'datetime':
        return renderDateTimeStep();
      case 'confirm':
        return renderConfirmStep();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('bookAppointment.headerTitle')}</Text>
        <View style={styles.backButton} />
      </View>

      {renderStepIndicator()}

      {renderCurrentStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepItem: {
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#2D7DD2',
  },
  stepCircleCompleted: {
    backgroundColor: '#2D7DD2',
  },
  stepLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#2D7DD2',
  },
  stepLabelCompleted: {
    color: '#2D7DD2',
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  dateTimeScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  dateTimeContainer: {
    gap: 20,
    minHeight: 600,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 16,
  },
  cardsList: {
    gap: 12,
    paddingBottom: 20,
  },
  doctorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 3,
  },
  doctorCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doctorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
  },
  doctorImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2D7DD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  doctorInfo: {
    flex: 1,
    gap: 4,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#64748B',
  },
  clinicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  clinicBadgeText: {
    fontSize: 12,
    color: '#64748B',
  },
  clinicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 3,
  },
  clinicCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clinicIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicInfo: {
    flex: 1,
    gap: 6,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  clinicAddress: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  dateSection: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 4,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  bookingLimitInfo: {
    backgroundColor: '#EAF3FC',
    borderWidth: 1,
    borderColor: '#2D7DD2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  bookingLimitText: {
    fontSize: 13,
    color: '#2D7DD2',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDatesText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyDatesContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDatesText: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 16,
    textAlign: 'center',
  },
  daysScrollView: {
    maxHeight: 300,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dayCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: 'rgba(21,194,176,0.12)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(21,194,176,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  dayCardSelected: {
    backgroundColor: '#2D7DD2',
    borderColor: '#2D7DD2',
    shadowColor: '#2D7DD2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 6,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  dayNameSelected: {
    color: '#ffffff',
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  dayNumberSelected: {
    color: '#ffffff',
  },
  timeSlotsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    minHeight: 250,
  },
  timeSlotsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  timeSlotsPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    minHeight: 200,
  },
  placeholderText: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 12,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(21,194,176,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(21,194,176,0.22)',
  },
  timeSlotSelected: {
    backgroundColor: '#2D7DD2',
    borderColor: '#2D7DD2',
  },
  timeSlotDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  timeSlotTextSelected: {
    color: '#ffffff',
  },
  timeSlotTextDisabled: {
    color: '#94A3B8',
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 20,
    shadowColor: '#15C2B0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 6,
  },
  nextButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  successMessageContent: {
    flex: 1,
    marginLeft: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  successText: {
    fontSize: 15,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 4,
  },
  summarySection: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  summarySubValue: {
    fontSize: 14,
    color: '#94A3B8',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#15C2B0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 6,
  },
  confirmButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

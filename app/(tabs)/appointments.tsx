import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Calendar, Clock, FileText, Stethoscope, Building2, Plus, Filter, ChevronDown, Search, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getSession } from '@/utils/auth';
import { config } from '@/utils/config';
import { useTheme } from '@/contexts/ThemeContext';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  end_date: string | null;
  end_time: string | null;
  status: string;
  notes: string | null;
  duration: string | null;
  doctor_id: string | null;
  service_id: string | null;
  clinic_id: string | null;
  room_id: string | null;
  doctors: Doctor | null;
  clinics: Clinic | null;
}

type DateFilter = 'all' | 'today' | 'last_week' | 'last_7_days' | 'this_month' | 'last_month';
type StatusFilter = 'all' | 'scheduled' | 'pending' | 'cancelled' | 'completed';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('today');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<StatusFilter>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'doctor' | 'date' | 'status' | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');

  const loadAppointments = useCallback(async () => {
    try {
      const session = await getSession();
      if (!session || !session.patient) {
        Alert.alert(t('common.error'), t('appointments.pleaseLogInAgain'));
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-patient-appointments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: session.patient.id,
          }),
        }
      );

      const result = await response.json();

      if (result.success && result.appointments) {
        setAllAppointments(result.appointments);
      } else {
        throw new Error(result.error || 'Failed to load appointments');
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert(t('common.error'), t('appointments.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const loadDoctors = useCallback(async () => {
    try {
      const session = await getSession();
      if (!session || !session.patient) {
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctors-for-booking`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            medicalId: session.patient.medical_id,
          }),
        }
      );

      const result = await response.json();

      if (result.success && result.doctors) {
        setDoctors(result.doctors);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadAppointments(), loadDoctors()]);
    setIsRefreshing(false);
  };

  const applyFilters = useCallback(() => {
    setFilterLoading(true);

    setTimeout(() => {
      let filtered = [...allAppointments];

      if (selectedDoctorFilter !== 'all') {
        filtered = filtered.filter(apt => apt.doctor_id === selectedDoctorFilter);
      }

      if (selectedStatusFilter !== 'all') {
        filtered = filtered.filter(apt => apt.status?.toLowerCase() === selectedStatusFilter);
      }

      if (selectedDateFilter !== 'all') {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        filtered = filtered.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          const aptTime = aptDate.getTime();

          switch (selectedDateFilter) {
            case 'today':
              return aptTime >= todayStart.getTime() && aptTime < todayEnd.getTime();
            case 'last_week':
              const lastWeek = new Date(todayStart);
              lastWeek.setDate(lastWeek.getDate() - 7);
              return aptTime >= lastWeek.getTime() && aptTime < todayEnd.getTime();
            case 'last_7_days':
              const last7Days = new Date(todayStart);
              last7Days.setDate(last7Days.getDate() - 7);
              return aptTime >= last7Days.getTime() && aptTime < todayEnd.getTime();
            case 'this_month':
              const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              return aptTime >= firstDayOfMonth.getTime() && aptTime < todayEnd.getTime();
            case 'last_month':
              const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
              return aptTime >= firstDayOfLastMonth.getTime() && aptTime <= lastDayOfLastMonth.getTime();
            default:
              return true;
          }
        });
      }

      setAppointments(filtered);
      setFilterLoading(false);
    }, 300);
  }, [allAppointments, selectedDoctorFilter, selectedDateFilter, selectedStatusFilter]);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
      loadDoctors();
    }, [loadAppointments, loadDoctors])
  );

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return '#2D7DD2';
      case 'confirmed':
        return '#15C2B0';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#FF6F61';
      case 'completed':
        return '#15C2B0';
      default:
        return '#6b7280';
    }
  };

  const getStatusBackgroundColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return '#EAF3FC';
      case 'confirmed':
        return '#E4F8F4';
      case 'pending':
        return '#fef3c7';
      case 'cancelled':
        return '#FFEDEB';
      case 'completed':
        return '#E4F8F4';
      default:
        return '#e5e7eb';
    }
  };

  const getDoctorFilterLabel = () => {
    if (selectedDoctorFilter === 'all') return t('appointments.allDoctors');
    const doctor = doctors.find(d => d.id === selectedDoctorFilter);
    return doctor ? t('appointments.doctorName', { name: `${doctor.first_name} ${doctor.last_name}` }) : t('appointments.allDoctors');
  };

  const getDateFilterLabel = () => {
    switch (selectedDateFilter) {
      case 'today': return t('appointments.dateToday');
      case 'last_week': return t('appointments.dateLastWeek');
      case 'last_7_days': return t('appointments.dateLast7Days');
      case 'this_month': return t('appointments.dateThisMonth');
      case 'last_month': return t('appointments.dateLastMonth');
      default: return t('appointments.dateAllTime');
    }
  };

  const getStatusFilterLabel = () => {
    switch (selectedStatusFilter) {
      case 'scheduled': return t('appointments.statusScheduled');
      case 'pending': return t('appointments.statusPending');
      case 'cancelled': return t('appointments.statusCancelled');
      case 'completed': return t('appointments.statusCompleted');
      default: return t('appointments.statusAll');
    }
  };

  const getStatusLabel = (status: string | null | undefined): string => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return t('appointments.statusScheduled');
      case 'confirmed': return t('appointments.statusConfirmed');
      case 'pending': return t('appointments.statusPending');
      case 'cancelled': return t('appointments.statusCancelled');
      case 'completed': return t('appointments.statusCompleted');
      default: return t('appointments.statusPending');
    }
  };

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('appointments.loadingAppointments')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>{t('appointments.title')}</Text>
            <Text style={styles.subtitle}>{t('appointments.subtitle')}</Text>
          </View>
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <Filter size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {filterLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={64} color={colors.border} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>{t('appointments.emptyTitle')}</Text>
            <Text style={styles.emptyText}>
              {t('appointments.emptyText')}
            </Text>
          </View>
        ) : (
          <View style={styles.appointmentsList}>
            {appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.dateContainer}>
                    <Calendar size={20} color={colors.primary} strokeWidth={2} />
                    <Text style={styles.dateText}>
                      {formatDate(appointment.appointment_date)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBackgroundColor(appointment.status) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(appointment.status) },
                      ]}
                    >
                      {getStatusLabel(appointment.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.appointmentDetails}>
                  <View style={styles.detailRow}>
                    <Clock size={18} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.detailText}>
                      {formatTime(appointment.appointment_time)}
                      {appointment.duration && appointment.duration.toLowerCase() !== 'custom' && ` (${appointment.duration})`}
                    </Text>
                  </View>

                  {appointment.doctors && (
                    <View style={styles.detailRow}>
                      <Stethoscope size={18} color={colors.primary} strokeWidth={2} />
                      <Text style={styles.detailText}>
                        {t('appointments.doctorName', { name: `${appointment.doctors.first_name} ${appointment.doctors.last_name}` })}
                      </Text>
                    </View>
                  )}

                  {appointment.clinics && (
                    <View style={styles.detailRow}>
                      <Building2 size={18} color={colors.primary} strokeWidth={2} />
                      <View style={styles.clinicInfo}>
                        <Text style={styles.detailText}>{appointment.clinics.name}</Text>
                        {appointment.clinics.address && (
                          <Text style={styles.clinicAddress}>{appointment.clinics.address}</Text>
                        )}
                      </View>
                    </View>
                  )}

                  {appointment.notes && (
                    <View style={styles.detailRow}>
                      <FileText size={18} color={colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.detailText} numberOfLines={2}>
                        {appointment.notes}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => router.push('/book-appointment')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#2D7DD2', '#15C2B0', '#FF6F61']}
            style={styles.bookButtonGradient}
          >
            <Plus size={24} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.bookButtonText}>{t('appointments.bookAppointment')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { setActiveDropdown(null); setShowFilterModal(false); setDoctorSearch(''); }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => { setActiveDropdown(null); setShowFilterModal(false); setDoctorSearch(''); }}
          >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('appointments.filters')}</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDoctorFilter('all');
                    setSelectedDateFilter('today');
                    setSelectedStatusFilter('all');
                    setActiveDropdown(null);
                    setDoctorSearch('');
                  }}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>{t('appointments.clearAll')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setActiveDropdown(null); setShowFilterModal(false); setDoctorSearch(''); }}
                  style={styles.modalCloseButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('appointments.doctor')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, activeDropdown === 'doctor' && styles.dropdownTriggerOpen]}
                onPress={() => {
                  if (activeDropdown === 'doctor') {
                    setActiveDropdown(null);
                    setDoctorSearch('');
                  } else {
                    setActiveDropdown('doctor');
                    setDoctorSearch('');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{getDoctorFilterLabel()}</Text>
                <ChevronDown
                  size={18}
                  color={colors.textSecondary}
                  style={{ transform: [{ rotate: activeDropdown === 'doctor' ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
              {activeDropdown === 'doctor' && (() => {
                const doctorItems = [
                  { id: 'all', first_name: 'All', last_name: 'Doctors', specialization: '' },
                  ...doctors.map(d => ({ id: d.id, first_name: d.first_name, last_name: d.last_name, specialization: '' }))
                ].filter(item =>
                  item.id === 'all' ||
                  `${item.first_name} ${item.last_name}`.toLowerCase().includes(doctorSearch.toLowerCase())
                );
                return (
                  <View style={styles.dropdownList}>
                    <View style={styles.dropdownSearchRow}>
                      <Search size={15} color={colors.textSecondary} />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder={t('appointments.searchDoctors')}
                        placeholderTextColor={colors.textSecondary}
                        value={doctorSearch}
                        onChangeText={setDoctorSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {doctorSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <X size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView
                      style={styles.dropdownFlatList}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                    >
                      {doctorItems.map((item, index) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.dropdownItem,
                            selectedDoctorFilter === item.id && styles.dropdownItemSelected,
                            index === doctorItems.length - 1 && styles.dropdownItemLast,
                          ]}
                          onPress={() => {
                            setSelectedDoctorFilter(item.id);
                            setActiveDropdown(null);
                            setDoctorSearch('');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dropdownItemText, selectedDoctorFilter === item.id && styles.dropdownItemTextSelected]}>
                            {item.id === 'all' ? t('appointments.allDoctors') : t('appointments.doctorName', { name: `${item.first_name} ${item.last_name}` })}
                          </Text>
                          {selectedDoctorFilter === item.id && (
                            <View style={styles.dropdownItemCheck} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              })()}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('appointments.dateRange')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, activeDropdown === 'date' && styles.dropdownTriggerOpen]}
                onPress={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{getDateFilterLabel()}</Text>
                <ChevronDown
                  size={18}
                  color={colors.textSecondary}
                  style={{ transform: [{ rotate: activeDropdown === 'date' ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
              {activeDropdown === 'date' && (
                <View style={styles.dropdownList}>
                  {[
                    { value: 'all', label: t('appointments.dateAllTime') },
                    { value: 'today', label: t('appointments.dateToday') },
                    { value: 'last_week', label: t('appointments.dateLastWeek') },
                    { value: 'last_7_days', label: t('appointments.dateLast7Days') },
                    { value: 'this_month', label: t('appointments.dateThisMonth') },
                    { value: 'last_month', label: t('appointments.dateLastMonth') },
                  ].map((option, idx, arr) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownItem,
                        selectedDateFilter === option.value && styles.dropdownItemSelected,
                        idx === arr.length - 1 && styles.dropdownItemLast,
                      ]}
                      onPress={() => {
                        setSelectedDateFilter(option.value as DateFilter);
                        setActiveDropdown(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dropdownItemText, selectedDateFilter === option.value && styles.dropdownItemTextSelected]}>
                        {option.label}
                      </Text>
                      {selectedDateFilter === option.value && (
                        <View style={styles.dropdownItemCheck} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('appointments.status')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, activeDropdown === 'status' && styles.dropdownTriggerOpen]}
                onPress={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{getStatusFilterLabel()}</Text>
                <ChevronDown
                  size={18}
                  color={colors.textSecondary}
                  style={{ transform: [{ rotate: activeDropdown === 'status' ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
              {activeDropdown === 'status' && (
                <View style={styles.dropdownList}>
                  {[
                    { value: 'all', label: t('appointments.statusAll') },
                    { value: 'scheduled', label: t('appointments.statusScheduled') },
                    { value: 'pending', label: t('appointments.statusPending') },
                    { value: 'cancelled', label: t('appointments.statusCancelled') },
                    { value: 'completed', label: t('appointments.statusCompleted') },
                  ].map((option, idx, arr) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownItem,
                        selectedStatusFilter === option.value && styles.dropdownItemSelected,
                        idx === arr.length - 1 && styles.dropdownItemLast,
                      ]}
                      onPress={() => {
                        setSelectedStatusFilter(option.value as StatusFilter);
                        setActiveDropdown(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dropdownItemText, selectedStatusFilter === option.value && styles.dropdownItemTextSelected]}>
                        {option.label}
                      </Text>
                      {selectedStatusFilter === option.value && (
                        <View style={styles.dropdownItemCheck} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setActiveDropdown(null);
                  setShowFilterModal(false);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#56C6C8', '#69C7F0']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={styles.applyButtonText}>{t('appointments.applyFilters')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: 24,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterIconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  appointmentsList: {
    padding: 16,
    gap: 16,
  },
  appointmentCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  appointmentDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  clinicInfo: {
    flex: 1,
    gap: 4,
  },
  clinicAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#15C2B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingTop: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  dropdownTriggerOpen: {
    borderColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dropdownTriggerText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  dropdownList: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: colors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  dropdownFlatList: {
    maxHeight: 200,
  },
  dropdownSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dropdownItemLast: {},
  dropdownItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  dropdownItemText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '400',
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  dropdownItemCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 10,
  },
  applyButton: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

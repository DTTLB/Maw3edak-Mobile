import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Pressable,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin, FileText, Stethoscope, Filter, Check, X, ChevronDown, Phone, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { config } from '@/utils/config';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';

interface Doctor {
  id: string;
  name: string;
}

interface Clinic {
  id: string;
  name: string;
}

interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  medicalId: string;
  doctorName: string;
  doctorId: string;
  clinicName: string;
  clinicId: string;
  companyName: string;
  companyId: string;
  status: string;
  date: string;
  time: string;
  notes: string;
}

type StatusFilter = 'all' | 'scheduled' | 'pending' | 'cancelled' | 'completed';
type DateFilter = 'today' | 'last7' | 'last30' | 'all';

export default function DoctorAppointmentsScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [selectedClinicFilter, setSelectedClinicFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<StatusFilter>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('today');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

  const filteredDoctors = useMemo(() => {
    if (!doctorSearchQuery.trim()) {
      return allDoctors;
    }
    const query = doctorSearchQuery.toLowerCase().trim();
    return allDoctors.filter(doctor =>
      (doctor.name?.toLowerCase() || '').includes(query)
    );
  }, [allDoctors, doctorSearchQuery]);

  const loadAppointments = useCallback(async () => {
    try {
      const globalId = session?.user?.global_id;
      if (!globalId) {
        Alert.alert(t('common.error'), t('doctorAppointments.pleaseLogInAgain'));
        return;
      }

      const companyId = session?.user?.company_id;
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-all-appointments?global_id=${globalId}${companyId ? `&company_id=${companyId}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.appointments) {
        setAllAppointments(result.appointments);

        if (result.filters) {
          setAllDoctors(result.filters.doctors || []);
          setAllClinics(result.filters.clinics || []);
          setFilteredClinics(result.filters.clinics || []);
          setStatuses(result.filters.statuses || []);
        }
      } else {
        throw new Error(result.error || 'Failed to load appointments');
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert(t('common.error'), t('doctorAppointments.failedToLoadAppointments'));
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.global_id, session?.user?.company_id, t]);

  const applyFilters = useCallback(() => {
    let filtered = [...allAppointments];

    // Apply date filter
    if (selectedDateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filterDate = new Date(today);

      if (selectedDateFilter === 'today') {
        filtered = filtered.filter(apt => {
          const aptDate = new Date(apt.date);
          aptDate.setHours(0, 0, 0, 0);
          return aptDate.getTime() === today.getTime();
        });
      } else if (selectedDateFilter === 'last7') {
        filterDate.setDate(today.getDate() - 7);
        filtered = filtered.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= filterDate && aptDate <= today;
        });
      } else if (selectedDateFilter === 'last30') {
        filterDate.setDate(today.getDate() - 30);
        filtered = filtered.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= filterDate && aptDate <= today;
        });
      }
    }

    if (selectedDoctorFilter !== 'all') {
      filtered = filtered.filter(apt => apt.doctorId === selectedDoctorFilter);
    }

    if (selectedClinicFilter !== 'all') {
      filtered = filtered.filter(apt => apt.clinicId === selectedClinicFilter);
    }

    if (selectedStatusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status?.toLowerCase() === selectedStatusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.patientName.toLowerCase().includes(query) ||
        apt.medicalId.toLowerCase().includes(query) ||
        apt.patientPhone.includes(query)
      );
    }

    setAppointments(filtered);
  }, [allAppointments, selectedDoctorFilter, selectedClinicFilter, selectedStatusFilter, selectedDateFilter, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    if (session?.user?.company_id) {
      setSelectedDoctorFilter('all');
      setSelectedClinicFilter('all');
      setSelectedStatusFilter('all');
      setSelectedDateFilter('today');
      setSearchQuery('');
      setDoctorSearchQuery('');
      setActiveDropdown(null);
      loadAppointments();
    }
  }, [session?.user?.company_id, loadAppointments]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    if (selectedDoctorFilter === 'all') {
      setFilteredClinics(allClinics);
    } else {
      const doctorClinics = allClinics.filter(clinic => {
        return allAppointments.some(apt =>
          apt.doctorId === selectedDoctorFilter && apt.clinicId === clinic.id
        );
      });
      setFilteredClinics(doctorClinics);
      if (selectedClinicFilter !== 'all' && !doctorClinics.some(c => c.id === selectedClinicFilter)) {
        setSelectedClinicFilter('all');
      }
    }
  }, [selectedDoctorFilter, selectedClinicFilter, allClinics, allAppointments]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return '#2D7DD2';
      case 'confirmed':
        return '#15C2B0';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#FF6F61';
      case 'completed':
        return '#15C2B0';
      default:
        return P.textSecondary;
    }
  };
  // soft background fallback uses palette row background for dark-mode safety

  const getStatusBackgroundColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return '#EAF3FC';
      case 'confirmed':
        return '#E4F8F4';
      case 'pending':
        return '#FEF3C7';
      case 'cancelled':
        return '#FFEDEB';
      case 'completed':
        return '#E4F8F4';
      default:
        return P.rowBg;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return t('doctorAppointments.statusScheduled');
      case 'confirmed':
        return t('doctorAppointments.statusConfirmed');
      case 'pending':
        return t('doctorAppointments.statusPending');
      case 'cancelled':
        return t('doctorAppointments.statusCancelled');
      case 'completed':
        return t('doctorAppointments.statusCompleted');
      default:
        return t('doctorAppointments.statusPending');
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const userId = session?.user?.id;
      if (!userId) {
        Alert.alert(t('common.error'), t('doctorAppointments.pleaseLogInAgain'));
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-update-appointment-status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointmentId,
            status: newStatus,
            userId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update appointment');
      }

      await loadAppointments();
      Alert.alert(
        t('common.success'),
        t('doctorAppointments.appointmentMarkedAs', { status: getStatusLabel(newStatus) })
      );
    } catch (error) {
      console.error('Error updating appointment status:', error);
      Alert.alert(t('common.error'), t('doctorAppointments.failedToUpdateStatus'));
    }
  };

  const handleCallPatient = async (phoneNumber: string, patientName: string) => {
    if (!phoneNumber) {
      Alert.alert(
        t('doctorAppointments.noPhoneNumberTitle'),
        t('doctorAppointments.noPhoneNumberMessage', { name: patientName })
      );
      return;
    }

    const phoneUrl = `tel:${phoneNumber}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);

    if (canOpen) {
      await Linking.openURL(phoneUrl);
    } else {
      Alert.alert(t('common.error'), t('doctorAppointments.cannotMakeCalls'));
    }
  };

  const handleCompleteAppointment = (appointmentId: string) => {
    Alert.alert(
      t('doctorAppointments.completeAppointmentTitle'),
      t('doctorAppointments.completeAppointmentMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('doctorAppointments.complete'),
          onPress: () => updateAppointmentStatus(appointmentId, 'completed'),
        },
      ]
    );
  };

  const handleCancelAppointment = (appointmentId: string) => {
    Alert.alert(
      t('doctorAppointments.cancelAppointmentTitle'),
      t('doctorAppointments.cancelAppointmentMessage'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('doctorAppointments.yesCancel'),
          style: 'destructive',
          onPress: () => updateAppointmentStatus(appointmentId, 'cancelled'),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={P.primary} />
          <Text style={styles.loadingText}>{t('doctorAppointments.loadingAppointments')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>{t('doctorAppointments.title')}</Text>
            <Text style={styles.subtitle}>{t('doctorAppointments.subtitle')}</Text>
          </View>
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <Filter size={24} color={P.primary} />
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
            tintColor={P.primary}
            colors={[P.primary]}
          />
        }
      >
        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={64} color={P.border} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>{t('doctorAppointments.noAppointmentsTitle')}</Text>
            <Text style={styles.emptyText}>
              {t('doctorAppointments.noAppointmentsText')}
            </Text>
          </View>
        ) : (
          <View style={styles.appointmentsList}>
            {appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.dateContainer}>
                    <Calendar size={20} color={P.primary} strokeWidth={2} />
                    <Text style={styles.dateText}>
                      {formatDate(appointment.date)}
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
                    <Clock size={18} color={P.textSecondary} strokeWidth={2} />
                    <Text style={styles.detailText}>
                      {appointment.time}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Stethoscope size={18} color={P.primary} strokeWidth={2} />
                    <View style={styles.patientInfo}>
                      <Text style={styles.detailText}>
                        {appointment.patientName}
                      </Text>
                      {appointment.medicalId && (
                        <Text style={styles.medicalId}>
                          {t('doctorAppointments.idLabel', { id: appointment.medicalId })}
                        </Text>
                      )}
                    </View>
                  </View>

                  {appointment.clinicName && (
                    <View style={styles.detailRow}>
                      <MapPin size={18} color={P.primary} strokeWidth={2} />
                      <Text style={styles.detailText}>{appointment.clinicName}</Text>
                    </View>
                  )}

                  {appointment.notes && (
                    <View style={styles.detailRow}>
                      <FileText size={18} color={P.textSecondary} strokeWidth={2} />
                      <Text style={styles.detailText} numberOfLines={2}>
                        {appointment.notes}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => handleCallPatient(appointment.patientPhone, appointment.patientName)}
                    activeOpacity={0.8}
                  >
                    <Phone size={18} color="#ffffff" strokeWidth={2.5} />
                    <Text style={styles.callButtonText}>{t('doctorAppointments.call')}</Text>
                  </TouchableOpacity>

                  {appointment.status?.toLowerCase() !== 'cancelled' && appointment.status?.toLowerCase() !== 'completed' && (
                    <>
                      <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => handleCompleteAppointment(appointment.id)}
                        activeOpacity={0.8}
                      >
                        <Check size={18} color="#ffffff" strokeWidth={2.5} />
                        <Text style={styles.completeButtonText}>{t('doctorAppointments.complete')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelAppointment(appointment.id)}
                        activeOpacity={0.8}
                      >
                        <X size={18} color="#ffffff" strokeWidth={2.5} />
                        <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setActiveDropdown(null);
          setDoctorSearchQuery('');
          setShowFilterModal(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setActiveDropdown(null);
            setDoctorSearchQuery('');
            setShowFilterModal(false);
          }}
        >
          <View
            style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16) }]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('doctorAppointments.filters')}</Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedDoctorFilter('all');
                  setSelectedClinicFilter('all');
                  setSelectedStatusFilter('all');
                  setSelectedDateFilter('today');
                  setDoctorSearchQuery('');
                  setActiveDropdown(null);
                }}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>{t('doctorAppointments.clearAll')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{t('doctorAppointments.dateLabel')}</Text>
                <Pressable
                  style={[styles.dropdownButton, { backgroundColor: P.inputBg, borderColor: P.inputBorder }]}
                  onPress={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
                >
                  <Text style={[styles.dropdownButtonText, { color: P.text }]}>
                    {selectedDateFilter === 'today' ? t('doctorAppointments.dateToday') :
                     selectedDateFilter === 'last7' ? t('doctorAppointments.dateLast7') :
                     selectedDateFilter === 'last30' ? t('doctorAppointments.dateLast30') : t('doctorAppointments.dateAllTime')}
                  </Text>
                  <ChevronDown size={20} color={P.chevron} />
                </Pressable>
                {activeDropdown === 'date' && (
                  <ScrollView style={[styles.dropdownList, { backgroundColor: P.cardBg, borderColor: P.border }]} nestedScrollEnabled>
                    {[
                      { value: 'today', label: t('doctorAppointments.dateToday') },
                      { value: 'last7', label: t('doctorAppointments.dateLast7') },
                      { value: 'last30', label: t('doctorAppointments.dateLast30') },
                      { value: 'all', label: t('doctorAppointments.dateAllTime') },
                    ].map(option => (
                      <Pressable
                        key={option.value}
                        style={[styles.dropdownItem, selectedDateFilter === option.value && { backgroundColor: P.rowBg }]}
                        onPress={() => {
                          setSelectedDateFilter(option.value as DateFilter);
                          setActiveDropdown(null);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: selectedDateFilter === option.value ? P.primary : P.text }]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>

              {allDoctors.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>{t('doctorAppointments.doctorLabel')}</Text>
                  <Pressable
                    style={[styles.dropdownButton, { backgroundColor: P.inputBg, borderColor: P.inputBorder }]}
                    onPress={() => {
                      setDoctorSearchQuery('');
                      setActiveDropdown(activeDropdown === 'doctor' ? null : 'doctor');
                    }}
                  >
                    <Text style={[styles.dropdownButtonText, { color: P.text }]}>
                      {selectedDoctorFilter === 'all'
                        ? t('doctorAppointments.allDoctors')
                        : allDoctors.find(d => d.id === selectedDoctorFilter)?.name || t('doctorAppointments.selectDoctor')}
                    </Text>
                    <ChevronDown size={20} color={P.chevron} />
                  </Pressable>
                  {activeDropdown === 'doctor' && (
                    <View style={[styles.dropdownList, { backgroundColor: P.cardBg, borderColor: P.border }]}>
                      <View style={[styles.modalSearchContainer, { backgroundColor: P.inputBg }]}>
                        <Search size={18} color={P.textSecondary} />
                        <TextInput
                          style={[styles.modalSearchInput, { color: P.text }]}
                          placeholder={t('doctorAppointments.searchDoctors')}
                          placeholderTextColor={P.textSecondary}
                          value={doctorSearchQuery}
                          onChangeText={setDoctorSearchQuery}
                        />
                        {doctorSearchQuery.length > 0 && (
                          <TouchableOpacity onPress={() => setDoctorSearchQuery('')} style={styles.clearButton}>
                            <X size={16} color={P.textSecondary} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        <Pressable
                          style={[styles.dropdownItem, selectedDoctorFilter === 'all' && { backgroundColor: P.rowBg }]}
                          onPress={() => {
                            setSelectedDoctorFilter('all');
                            setDoctorSearchQuery('');
                            setActiveDropdown(null);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: selectedDoctorFilter === 'all' ? P.primary : P.text }]}>
                            {t('doctorAppointments.allDoctors')}
                          </Text>
                        </Pressable>
                        {filteredDoctors.length === 0 ? (
                          <View style={styles.dropdownEmpty}>
                            <Text style={[styles.dropdownItemText, { color: P.textSecondary }]}>
                              {t('doctorAppointments.noMatchingDoctors')}
                            </Text>
                          </View>
                        ) : (
                          filteredDoctors.map(doctor => (
                            <Pressable
                              key={doctor.id}
                              style={[styles.dropdownItem, selectedDoctorFilter === doctor.id && { backgroundColor: P.rowBg }]}
                              onPress={() => {
                                setSelectedDoctorFilter(doctor.id);
                                setDoctorSearchQuery('');
                                setActiveDropdown(null);
                              }}
                            >
                              <Text style={[styles.dropdownItemText, { color: selectedDoctorFilter === doctor.id ? P.primary : P.text }]}>
                                {doctor.name}
                              </Text>
                            </Pressable>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {filteredClinics.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>{t('doctorAppointments.clinicLabel')}</Text>
                  <Pressable
                    style={[styles.dropdownButton, { backgroundColor: P.inputBg, borderColor: P.inputBorder }]}
                    onPress={() => setActiveDropdown(activeDropdown === 'clinic' ? null : 'clinic')}
                  >
                    <Text style={[styles.dropdownButtonText, { color: P.text }]}>
                      {selectedClinicFilter === 'all'
                        ? t('doctorAppointments.allClinics')
                        : filteredClinics.find(c => c.id === selectedClinicFilter)?.name || t('doctorAppointments.selectClinic')}
                    </Text>
                    <ChevronDown size={20} color={P.chevron} />
                  </Pressable>
                  {activeDropdown === 'clinic' && (
                    <ScrollView style={[styles.dropdownList, { backgroundColor: P.cardBg, borderColor: P.border }]} nestedScrollEnabled>
                      <Pressable
                        style={[styles.dropdownItem, selectedClinicFilter === 'all' && { backgroundColor: P.rowBg }]}
                        onPress={() => {
                          setSelectedClinicFilter('all');
                          setActiveDropdown(null);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: selectedClinicFilter === 'all' ? P.primary : P.text }]}>
                          {t('doctorAppointments.allClinics')}
                        </Text>
                      </Pressable>
                      {filteredClinics.map(clinic => (
                        <Pressable
                          key={clinic.id}
                          style={[styles.dropdownItem, selectedClinicFilter === clinic.id && { backgroundColor: P.rowBg }]}
                          onPress={() => {
                            setSelectedClinicFilter(clinic.id);
                            setActiveDropdown(null);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: selectedClinicFilter === clinic.id ? P.primary : P.text }]}>
                            {clinic.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              <View style={[styles.filterSection, { marginBottom: 40 }]}>
                <Text style={styles.filterSectionTitle}>{t('doctorAppointments.statusLabel')}</Text>
                <Pressable
                  style={[styles.dropdownButton, { backgroundColor: P.inputBg, borderColor: P.inputBorder }]}
                  onPress={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                >
                  <Text style={[styles.dropdownButtonText, { color: P.text }]}>
                    {selectedStatusFilter === 'all' ? t('doctorAppointments.allStatus') :
                     getStatusLabel(selectedStatusFilter)}
                  </Text>
                  <ChevronDown size={20} color={P.chevron} />
                </Pressable>
                {activeDropdown === 'status' && (
                  <ScrollView style={[styles.dropdownList, { backgroundColor: P.cardBg, borderColor: P.border }]} nestedScrollEnabled>
                    <Pressable
                      style={[styles.dropdownItem, selectedStatusFilter === 'all' && { backgroundColor: P.rowBg }]}
                      onPress={() => {
                        setSelectedStatusFilter('all');
                        setActiveDropdown(null);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: selectedStatusFilter === 'all' ? P.primary : P.text }]}>
                        {t('doctorAppointments.allStatus')}
                      </Text>
                    </Pressable>
                    {statuses.filter(status => status.toLowerCase() !== 'confirmed').map(status => (
                      <Pressable
                        key={status}
                        style={[styles.dropdownItem, selectedStatusFilter === status.toLowerCase() && { backgroundColor: P.rowBg }]}
                        onPress={() => {
                          setSelectedStatusFilter(status.toLowerCase() as StatusFilter);
                          setActiveDropdown(null);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: selectedStatusFilter === status.toLowerCase() ? P.primary : P.text }]}>
                          {getStatusLabel(status)}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setActiveDropdown(null);
                  setDoctorSearchQuery('');
                  setShowFilterModal(false);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#56C6C8', '#69C7F0']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={styles.applyButtonText}>{t('doctorAppointments.applyFilters')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (P: DoctorPalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: P.textSecondary,
  },
  header: {
    padding: 24,
    backgroundColor: P.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
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
    backgroundColor: P.lightBlue,
    borderRadius: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: P.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: P.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
    color: P.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: P.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  appointmentsList: {
    padding: 16,
    gap: 16,
  },
  appointmentCard: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 16,
    padding: 20,
    shadowColor: P.shadow,
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
    borderBottomColor: P.border,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: P.text,
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
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 15,
    color: P.text,
    lineHeight: 22,
  },
  patientInfo: {
    flex: 1,
    gap: 2,
  },
  medicalId: {
    fontSize: 13,
    color: P.textSecondary,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: P.border,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D7DD2',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15C2B0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6F61',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: P.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: P.cardBg,
    borderRadius: 24,
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: P.softBorder,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: P.border,
    backgroundColor: P.cardBg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: P.text,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: P.primary,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 24,
    marginTop: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: P.text,
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 240,
    overflow: 'hidden',
    shadowColor: P.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownEmpty: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 8,
    borderRadius: 10,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
  },
  applyButton: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

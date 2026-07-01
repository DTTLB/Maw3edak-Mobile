import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Pill, Search, Calendar, User, Users, FileText, X, ChevronRight, ChevronDown, Check, Filter, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/utils/config';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';

interface PrescriptionItem {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string | null;
}

interface Prescription {
  id: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialization: string;
  patient_name: string;
  patient_medical_id: string;
  prescription_date: string;
  notes: string | null;
  items: PrescriptionItem[];
  created_at: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface Patient {
  medical_id: string;
  full_name: string;
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export default function DoctorMedicationsScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPrescription, setExpandedPrescription] = useState<string | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [loadingDoctors] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

  const filteredDoctors = useMemo(() => {
    if (!doctorSearchQuery.trim()) {
      return doctors;
    }
    const query = doctorSearchQuery.toLowerCase().trim();
    return doctors.filter(doctor =>
      (doctor.name?.toLowerCase() || '').includes(query) ||
      (doctor.specialization?.toLowerCase() || '').includes(query)
    );
  }, [doctors, doctorSearchQuery]);

  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) {
      return patients;
    }
    const query = patientSearchQuery.toLowerCase().trim();
    return patients.filter(patient =>
      (patient.full_name?.toLowerCase() || '').includes(query) ||
      (patient.medical_id?.toLowerCase() || '').includes(query)
    );
  }, [patients, patientSearchQuery]);

  useEffect(() => {
    console.log('Prescriptions state updated:', prescriptions.length);
  }, [prescriptions]);

  const loadPatients = useCallback(async (doctorId?: string) => {
    try {
      setLoadingPatients(true);
      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;
      if (!globalId) {
        console.error('No global_id found in session');
        return;
      }

      let url = `${config.supabaseUrl}/functions/v1/mobile-get-doctor-patients?global_id=${globalId}`;
      if (companyId) {
        url += `&company_id=${companyId}`;
      }
      if (doctorId) {
        url += `&doctor_id=${doctorId}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  }, [session?.user?.global_id, session?.user?.company_id]);

  const loadDoctorsList = useCallback(async () => {
    try {
      setLoading(true);

      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;
      if (!globalId) {
        console.error('No global_id found in session');
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-accessible-doctors?global_id=${globalId}${companyId ? `&company_id=${companyId}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      const doctorsList = data.doctors || [];
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error loading doctors:', error);
      Alert.alert(t('common.error'), t('medications.failedToLoadDoctors'));
    } finally {
      setLoading(false);
    }
  }, [session?.user?.global_id, session?.user?.company_id, t]);

  const loadInitialData = useCallback(async () => {
    // Load doctors list only, not prescriptions
    await loadDoctorsList();
  }, [loadDoctorsList]);

  const loadPrescriptions = useCallback(async (doctorId: string, patientMedicalId: string) => {
    try {
      setLoading(true);

      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;
      if (!globalId) {
        console.error('No global_id found in session');
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-prescriptions?global_id=${globalId}${companyId ? `&company_id=${companyId}` : ''}&doctor_id=${doctorId}&patient_medical_id=${patientMedicalId}`,
        {
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }

      const data = await response.json();
      const loadedPrescriptions = data.prescriptions || [];
      setPrescriptions(loadedPrescriptions);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      Alert.alert(t('common.error'), t('medications.failedToLoadPrescriptions'));
    } finally {
      setLoading(false);
    }
  }, [session?.user?.global_id, session?.user?.company_id, t]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const togglePrescriptionExpansion = (prescriptionId: string) => {
    setExpandedPrescription(
      expandedPrescription === prescriptionId ? null : prescriptionId
    );
  };

  const applyDateFilter = useCallback(() => {
    let filtered = [...prescriptions];

    if (selectedDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(prescription => {
        const prescriptionDate = new Date(prescription.prescription_date || prescription.created_at);

        switch (selectedDateFilter) {
          case 'today':
            return prescriptionDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return prescriptionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return prescriptionDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return prescriptionDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    setFilteredPrescriptions(filtered);
  }, [prescriptions, selectedDateFilter]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (session?.user?.company_id) {
      setSelectedDoctor(null);
      setSelectedPatient(null);
      setPrescriptions([]);
      setPatients([]);
      setPatientSearchQuery('');
      loadInitialData();
    }
  }, [session?.user?.company_id, loadInitialData]);

  useEffect(() => {
    console.log('=== Doctor/Patient Selection Changed ===');
    console.log('Selected Doctor:', selectedDoctor?.name || 'None');
    console.log('Selected Patient:', selectedPatient?.full_name || 'None');

    // Load prescriptions when both doctor and patient are selected
    if (selectedDoctor && selectedPatient) {
      loadPrescriptions(selectedDoctor.id, selectedPatient.medical_id);
    } else {
      // Clear prescriptions if filters are incomplete
      console.log('Clearing prescriptions due to incomplete selection');
      setPrescriptions([]);
      setFilteredPrescriptions([]);
    }
  }, [selectedDoctor, selectedPatient, loadPrescriptions]);

  useEffect(() => {
    applyDateFilter();
  }, [applyDateFilter]);

  useEffect(() => {
    setSelectedPatient(null);
    setPatientSearchQuery('');
    if (selectedDoctor) {
      loadPatients(selectedDoctor.id);
    } else {
      setPatients([]);
    }
  }, [selectedDoctor, loadPatients]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: P.pageBg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('medications.loadingPrescriptions')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.pageBg }]}>
      {/* Clean white professional header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(doctor-tabs)')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={P.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={styles.headerIconCard}>
            <Pill size={26} color={P.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>{t('medications.title')}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{t('medications.subtitle')}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowDateModal(true)}
          activeOpacity={0.7}
        >
          <Filter size={20} color={P.primary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={P.primary}
          />
        }
      >
        {/* Select prescription context card */}
        <View style={styles.contextCard}>
          <View style={styles.contextHeader}>
            <View style={styles.contextIconBubble}>
              <Users size={22} color={P.primary} strokeWidth={2} />
            </View>
            <View style={styles.contextHeaderText}>
              <Text style={styles.contextTitle}>{t('medications.contextTitle')}</Text>
              <Text style={styles.contextSubtitle}>{t('medications.contextSubtitle')}</Text>
            </View>
          </View>

          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('medications.selectDoctor')}</Text>
              <TouchableOpacity
                style={styles.select}
                onPress={() => setShowDoctorModal(true)}
                activeOpacity={0.7}
              >
                <User size={18} color={P.textSecondary} />
                <Text
                  style={[styles.selectText, { color: selectedDoctor ? P.text : P.placeholder }]}
                  numberOfLines={1}
                >
                  {selectedDoctor ? selectedDoctor.name : t('medications.chooseDoctor')}
                </Text>
                <ChevronDown size={18} color={P.chevron} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('medications.selectPatient')}</Text>
              <TouchableOpacity
                style={[styles.select, { opacity: !selectedDoctor ? 0.5 : 1 }]}
                onPress={() => selectedDoctor && setShowPatientModal(true)}
                disabled={!selectedDoctor}
                activeOpacity={0.7}
              >
                <User size={18} color={P.textSecondary} />
                <Text
                  style={[styles.selectText, { color: selectedPatient ? P.text : P.placeholder }]}
                  numberOfLines={1}
                >
                  {selectedPatient ? selectedPatient.full_name : t('medications.choosePatient')}
                </Text>
                <ChevronDown size={18} color={P.chevron} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {filteredPrescriptions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyDashed}>
              <View style={styles.emptyIconCircle}>
                <Pill size={48} color={P.primary} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle}>
                {!selectedDoctor || !selectedPatient
                  ? t('medications.emptyTitle')
                  : selectedDateFilter !== 'all'
                  ? t('medications.emptyNoForDateRange')
                  : t('medications.emptyNoPrescriptions')}
              </Text>
              {(!selectedDoctor || !selectedPatient) && (
                <Text style={styles.emptyDesc}>{t('medications.emptyDescription')}</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.prescriptionsContainer}>
            {filteredPrescriptions.map((prescription) => {
              const isExpanded = expandedPrescription === prescription.id;
              return (
                <TouchableOpacity
                  key={prescription.id}
                  style={styles.prescriptionCard}
                  onPress={() => togglePrescriptionExpansion(prescription.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.prescriptionHeader}>
                    <View style={styles.prescriptionHeaderLeft}>
                      <View style={styles.iconContainer}>
                        <User size={20} color={P.primary} />
                      </View>
                      <View style={styles.prescriptionHeaderText}>
                        <Text style={styles.patientName}>
                          {prescription.patient_name}
                        </Text>
                        <Text style={styles.medicalId}>
                          {t('medications.idLabel', { id: prescription.patient_medical_id })}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight
                      size={20}
                      color={P.placeholder}
                      style={{
                        transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                      }}
                    />
                  </View>

                  <View style={styles.doctorInfo}>
                    <User size={14} color={P.textSecondary} />
                    <Text style={styles.doctorText}>
                      {t('medications.doctorPrefix', { name: prescription.doctor_name })}
                    </Text>
                  </View>

                  <View style={styles.prescriptionMeta}>
                    <View style={styles.metaItem}>
                      <Calendar size={14} color={P.textSecondary} />
                      <Text style={styles.metaText}>
                        {formatDate(prescription.prescription_date)}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Pill size={14} color={P.textSecondary} />
                      <Text style={styles.metaText}>
                        {t('medications.medicationCount', { count: prescription.items.length })}
                      </Text>
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={styles.prescriptionDetails}>
                      <View style={styles.divider} />

                      {prescription.notes && (
                        <View style={styles.notesContainer}>
                          <View style={styles.notesHeader}>
                            <FileText size={16} color={P.textSecondary} />
                            <Text style={styles.notesLabel}>
                              {t('medications.notesLabel')}
                            </Text>
                          </View>
                          <Text style={styles.notesText}>
                            {prescription.notes}
                          </Text>
                        </View>
                      )}

                      <View style={styles.medicationsSection}>
                        <Text style={styles.sectionTitle}>
                          {t('medications.medicationsSectionTitle')}
                        </Text>
                        {prescription.items.map((item, index) => (
                          <View key={item.id} style={styles.medicationItem}>
                            <View style={styles.medicationHeader}>
                              <View style={styles.medicationNumber}>
                                <Text style={styles.medicationNumberText}>{index + 1}</Text>
                              </View>
                              <Text style={styles.medicineName}>
                                {item.medicine_name}
                              </Text>
                            </View>
                            <View style={styles.tagsRow}>
                              {!!item.dosage && (
                                <View style={styles.tag}>
                                  <Text style={styles.tagText}>{`${t('medications.dosageLabel')} ${item.dosage}`}</Text>
                                </View>
                              )}
                              {!!item.frequency && (
                                <View style={styles.tag}>
                                  <Text style={styles.tagText}>{`${t('medications.frequencyLabel')} ${item.frequency}`}</Text>
                                </View>
                              )}
                              {!!item.duration && (
                                <View style={styles.tag}>
                                  <Text style={styles.tagText}>{`${t('medications.durationLabel')} ${item.duration}`}</Text>
                                </View>
                              )}
                            </View>
                            {item.notes && (
                              <View style={styles.itemNotesRow}>
                                <Text style={styles.detailLabel}>
                                  {t('medications.itemNotesLabel')}
                                </Text>
                                <Text style={styles.detailValue}>
                                  {item.notes}
                                </Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showDoctorModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDoctorModal(false);
          setDoctorSearchQuery('');
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowDoctorModal(false);
              setDoctorSearchQuery('');
            }}
          >
            <View
              style={[styles.modalContent, { backgroundColor: colors.card }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('medications.selectDoctor')}
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowDoctorModal(false);
                  setDoctorSearchQuery('');
                }}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.modalSearchContainer, { backgroundColor: colors.background }]}>
                <Search size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.modalSearchInput, { color: colors.text }]}
                  placeholder={t('medications.searchDoctors')}
                  placeholderTextColor={colors.textTertiary}
                  value={doctorSearchQuery}
                  onChangeText={setDoctorSearchQuery}
                />
                {doctorSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setDoctorSearchQuery('')} style={styles.clearButton}>
                    <X size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                style={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                {loadingDoctors ? (
                  <View style={styles.modalLoading}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : filteredDoctors.length === 0 ? (
                  <View style={styles.modalLoading}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      {doctorSearchQuery ? t('medications.noMatchingDoctors') : t('medications.noDoctorsFound')}
                    </Text>
                  </View>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <TouchableOpacity
                      key={doctor.id}
                      style={[styles.modalOption, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setSelectedDoctor(doctor);
                        setShowDoctorModal(false);
                        setDoctorSearchQuery('');
                      }}
                    >
                      <View style={styles.modalOptionContent}>
                        <Text style={[styles.modalOptionText, { color: colors.text }]}>
                          {doctor.name}
                        </Text>
                        <Text style={[styles.modalOptionSubtext, { color: colors.textSecondary }]}>
                          {doctor.specialization}
                        </Text>
                      </View>
                      {selectedDoctor?.id === doctor.id && (
                        <Check size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showPatientModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPatientModal(false);
          setPatientSearchQuery('');
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowPatientModal(false);
              setPatientSearchQuery('');
            }}
          >
            <View
              style={[styles.modalContent, { backgroundColor: colors.card }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('medications.selectPatient')}
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowPatientModal(false);
                  setPatientSearchQuery('');
                }}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.modalSearchContainer, { backgroundColor: colors.background }]}>
                <Search size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.modalSearchInput, { color: colors.text }]}
                  placeholder={t('medications.searchPatients')}
                  placeholderTextColor={colors.textTertiary}
                  value={patientSearchQuery}
                  onChangeText={setPatientSearchQuery}
                />
                {patientSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
                    <X size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                style={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
              {loadingPatients ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : filteredPatients.length === 0 ? (
                <View style={styles.modalLoading}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {patientSearchQuery ? t('medications.noMatchingPatients') : t('medications.noPatientsForDoctor')}
                  </Text>
                </View>
              ) : (
                filteredPatients.map((patient) => (
                  <TouchableOpacity
                    key={patient.medical_id}
                    style={[styles.modalOption, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setSelectedPatient(patient);
                      setShowPatientModal(false);
                      setPatientSearchQuery('');
                    }}
                  >
                    <View style={styles.modalOptionContent}>
                      <Text style={[styles.modalOptionText, { color: colors.text }]}>
                        {patient.full_name}
                      </Text>
                      <Text style={[styles.modalOptionSubtext, { color: colors.textSecondary }]}>
                        {t('medications.idLabel', { id: patient.medical_id })}
                      </Text>
                    </View>
                    {selectedPatient?.medical_id === patient.medical_id && (
                      <Check size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDateModal(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('medications.dateRange')}
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {[
                { value: 'all', label: t('medications.dateAllTime') },
                { value: 'today', label: t('medications.dateToday') },
                { value: 'week', label: t('medications.dateLast7') },
                { value: 'month', label: t('medications.dateLastMonth') },
                { value: 'year', label: t('medications.dateLastYear') }
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.modalOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedDateFilter(option.value as DateFilter);
                    setShowDateModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>
                    {option.label}
                  </Text>
                  {selectedDateFilter === option.value && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (P: DoctorPalette) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: P.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 14,
  },
  headerIconCard: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.lightBlue,
    borderWidth: 1,
    borderColor: P.iconCardBorder,
    borderRadius: 16,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: P.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: P.textSecondary,
    marginTop: 2,
  },
  filterButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 28,
  },

  // Select prescription context card
  contextCard: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.softBorder,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 3,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  contextIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: P.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  contextTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.text,
  },
  contextSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: P.textSecondary,
    marginTop: 2,
  },
  fields: {
    gap: 18,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: P.text,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.inputBorder,
    borderRadius: 12,
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  // Empty state card
  emptyCard: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.softBorder,
    borderRadius: 24,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 3,
  },
  emptyDashed: {
    backgroundColor: P.cardBg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: P.dashed,
    borderRadius: 18,
    minHeight: 360,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: P.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: P.text,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 15,
    fontWeight: '500',
    color: P.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  prescriptionsContainer: {
    gap: 12,
  },
  prescriptionCard: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 2,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prescriptionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: P.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prescriptionHeaderText: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: P.text,
  },
  medicalId: {
    fontSize: 13,
    marginTop: 2,
    color: P.textSecondary,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctorText: {
    fontSize: 13,
    fontWeight: '500',
    color: P.textSecondary,
  },
  prescriptionMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: P.textSecondary,
  },
  prescriptionDetails: {
    gap: 16,
  },
  divider: {
    height: 1,
    marginTop: 4,
    backgroundColor: P.softBorder,
  },
  notesContainer: {
    gap: 8,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: P.textSecondary,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    color: P.text,
  },
  medicationsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: P.text,
  },
  medicationItem: {
    borderRadius: 14,
    padding: 14,
    gap: 12,
    backgroundColor: P.pageBg,
    borderWidth: 1,
    borderColor: P.softBorder,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  medicationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: P.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  medicineName: {
    fontSize: 15,
    fontWeight: '800',
    color: P.text,
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: P.lightBlue,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.primary,
  },
  itemNotesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    width: 56,
    color: P.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
    color: P.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: P.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: P.softBorder,
    overflow: 'hidden',
    paddingBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 10,
    gap: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
  },
  modalScroll: {
    flexGrow: 1,
  },
  modalLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalOptionContent: {
    flex: 1,
    gap: 4,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOptionSubtext: {
    fontSize: 13,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

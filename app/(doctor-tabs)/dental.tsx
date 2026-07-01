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
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, Search, Calendar, User, X, ChevronRight, ChevronDown, Check, Filter, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';
import { config } from '@/utils/config';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

// Disabled-state icon tint (accent, same in both themes)
const disabledIcon = '#A7AFBE';
// Dental accent
const A = {
  accent: '#15C2B0',
  lightBg: '#E4F8F4',
  dashed: '#A6E9E1',
};

interface DentalEncounter {
  id: string;
  encounter_date: string;
  chief_complaint: string;
  diagnosis: string;
  treatment_provided: string;
  notes: string | null;
  doctor_id: string;
  doctor_name: string;
  doctor_specialization: string;
  patient_name: string;
  patient_medical_id: string;
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

interface Treatment {
  id: string;
  tooth_number: number;
  tooth_name: string;
  tooth_image?: string;
  tooth_arch: string;
  tooth_position: string;
  service_name: string;
  service_description?: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  status: string;
  date: string;
  updated_at: string;
}

interface EncounterDetail {
  encounter: {
    id: string;
    date: string;
    notes: string;
    doctor: {
      id: string;
      name: string;
      image?: string;
    };
  };
  treatments: Treatment[];
  total_treatments: number;
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export default function DoctorDentalScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { isDark } = useTheme();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const [dentalEncounters, setDentalEncounters] = useState<DentalEncounter[]>([]);
  const [filteredDentalEncounters, setFilteredDentalEncounters] = useState<DentalEncounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Detail modal
  const [selectedEncounter, setSelectedEncounter] = useState<EncounterDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  }, [session?.user?.global_id, session?.user?.company_id]);

  const loadInitialData = useCallback(async () => {
    await loadDoctorsList();
  }, [loadDoctorsList]);

  const applyDateFilter = useCallback(() => {
    if (selectedDateFilter === 'all') {
      setFilteredDentalEncounters(dentalEncounters);
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filtered = dentalEncounters.filter(encounter => {
      const encounterDate = new Date(encounter.encounter_date);

      switch (selectedDateFilter) {
        case 'today':
          return encounterDate >= today;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return encounterDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return encounterDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(today);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return encounterDate >= yearAgo;
        default:
          return true;
      }
    });

    setFilteredDentalEncounters(filtered);
  }, [dentalEncounters, selectedDateFilter]);

  const loadDentalEncounters = useCallback(async (doctorId: string, patientMedicalId: string) => {
    try {
      setLoading(true);

      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;
      if (!globalId) {
        console.error('No global_id found in session');
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-dental-encounters?global_id=${globalId}${companyId ? `&company_id=${companyId}` : ''}&doctor_id=${doctorId}&patient_medical_id=${patientMedicalId}`,
        {
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dental encounters');
      }

      const data = await response.json();
      const loadedEncounters = data.encounters || [];
      setDentalEncounters(loadedEncounters);
    } catch (error) {
      console.error('Error loading dental encounters:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.global_id, session?.user?.company_id]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (session?.user?.company_id) {
      setSelectedDoctor(null);
      setSelectedPatient(null);
      setDentalEncounters([]);
      setPatients([]);
      setPatientSearchQuery('');
      setDoctorSearchQuery('');
      loadInitialData();
    }
  }, [session?.user?.company_id, loadInitialData]);

  useEffect(() => {
    if (selectedDoctor && selectedPatient) {
      loadDentalEncounters(selectedDoctor.id, selectedPatient.medical_id);
    } else {
      setDentalEncounters([]);
      setFilteredDentalEncounters([]);
    }
  }, [selectedDoctor, selectedPatient, loadDentalEncounters]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const loadEncounterDetail = async (encounterId: string) => {
    if (!selectedDoctor || !selectedPatient) return;

    try {
      setDetailLoading(true);

      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;
      if (!globalId) {
        console.error('No global_id found in session');
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-dental-encounters?global_id=${globalId}${companyId ? `&company_id=${companyId}` : ''}&doctor_id=${selectedDoctor.id}&patient_medical_id=${selectedPatient.medical_id}&encounter_id=${encounterId}`,
        {
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch encounter details');
      }

      const data = await response.json();
      if (data.success) {
        setSelectedEncounter(data);
        setShowDetail(true);
      }
    } catch (error) {
      console.error('Error loading encounter detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#15C2B0';
      case 'in_progress': return '#F59E0B';
      case 'planned': return '#2D7DD2';
      case 'cancelled': return '#FF6F61';
      default: return '#94A3B8';
    }
  };

  if (loading && doctors.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={A.accent} />
          <Text style={styles.loadingText}>
            {t('doctorDental.loadingDentalRecords')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(doctor-tabs)')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={P.text} />
          </TouchableOpacity>
          <View style={[styles.headerIconCard, { backgroundColor: A.lightBg }]}>
            <Activity size={26} color={A.accent} strokeWidth={2.4} />
          </View>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>{t('doctorDental.headerTitle')}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{t('doctorDental.headerSubtitle')}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.headerFilterIcon}
          onPress={() => setShowDateModal(true)}
          activeOpacity={0.7}
        >
          <Filter size={20} color={A.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={A.accent}
            />
          }
        >
          {/* Select data context card */}
          <View style={styles.selectCard}>
            <View style={styles.selectHeader}>
              <View style={[styles.selectIconBubble, { backgroundColor: A.lightBg }]}>
                <User size={28} color={A.accent} strokeWidth={2.2} />
              </View>
              <View style={styles.selectHeaderText}>
                <Text style={styles.selectTitle}>{t('doctorDental.selectDataContext')}</Text>
                <Text style={styles.selectSubtitle}>{t('doctorDental.selectContextSubtitle')}</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>{t('doctorDental.selectDoctor')}</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowDoctorModal(true)}
              activeOpacity={0.7}
            >
              <User size={18} color={P.textSecondary} />
              <Text
                style={[styles.dropdownText, { color: selectedDoctor ? P.text : P.placeholder }]}
                numberOfLines={1}
              >
                {selectedDoctor ? selectedDoctor.name : t('doctorDental.chooseDoctor')}
              </Text>
              <ChevronDown size={18} color={P.chevron} />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>{t('doctorDental.selectPatient')}</Text>
            <TouchableOpacity
              style={[styles.dropdown, !selectedDoctor && styles.dropdownDisabled]}
              onPress={() => selectedDoctor && setShowPatientModal(true)}
              disabled={!selectedDoctor}
              activeOpacity={0.7}
            >
              <User size={18} color={!selectedDoctor ? disabledIcon : P.textSecondary} />
              <Text
                style={[
                  styles.dropdownText,
                  { color: selectedPatient ? P.text : (!selectedDoctor ? disabledIcon : P.placeholder) },
                ]}
                numberOfLines={1}
              >
                {selectedPatient ? selectedPatient.full_name : t('doctorDental.choosePatient')}
              </Text>
              <ChevronDown size={18} color={!selectedDoctor ? disabledIcon : P.chevron} />
            </TouchableOpacity>
          </View>

          {filteredDentalEncounters.length === 0 ? (
            <View style={styles.emptyOuterCard}>
              <View style={[styles.emptyInnerBox, { borderColor: A.dashed }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: A.lightBg }]}>
                  <Activity size={52} color={A.accent} strokeWidth={1.8} />
                </View>
                <Text style={styles.emptyTitle}>{t('doctorDental.emptyTitle')}</Text>
                <Text style={styles.emptyDescription}>
                  {!selectedDoctor || !selectedPatient
                    ? t('doctorDental.selectDoctorAndPatient')
                    : t('doctorDental.noDentalRecords')}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.encountersContainer}>
              {filteredDentalEncounters.map((encounter) => {
                return (
                  <TouchableOpacity
                    key={encounter.id}
                    style={styles.encounterCard}
                    onPress={() => loadEncounterDetail(encounter.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.encounterHeader}>
                      <View style={styles.encounterHeaderLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: A.lightBg }]}>
                          <Activity size={20} color={A.accent} />
                        </View>
                        <View style={styles.encounterHeaderText}>
                          <Text style={styles.chiefComplaint}>
                            {encounter.chief_complaint}
                          </Text>
                          <Text style={styles.patientName}>
                            {encounter.patient_name}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color={P.placeholder} />
                    </View>

                    <View style={styles.doctorInfo}>
                      <User size={14} color={P.textSecondary} />
                      <Text style={styles.doctorText}>
                        {t('doctorDental.doctorPrefix', { name: encounter.doctor_name })}
                      </Text>
                    </View>

                    <View style={styles.encounterMeta}>
                      <View style={styles.metaItem}>
                        <Calendar size={14} color={P.textSecondary} />
                        <Text style={styles.metaText}>
                          {formatDate(encounter.encounter_date)}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <User size={14} color={P.textSecondary} />
                        <Text style={styles.metaText}>
                          {t('doctorDental.idLabel', { id: encounter.patient_medical_id })}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

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
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t('doctorDental.selectDoctor')}
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowDoctorModal(false);
                  setDoctorSearchQuery('');
                }}>
                  <X size={24} color={P.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalSearchContainer}>
                <Search size={18} color={P.placeholder} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder={t('doctorDental.searchDoctors')}
                  placeholderTextColor={P.placeholder}
                  value={doctorSearchQuery}
                  onChangeText={setDoctorSearchQuery}
                />
                {doctorSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setDoctorSearchQuery('')} style={styles.clearButton}>
                    <X size={16} color={P.placeholder} />
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
                    <ActivityIndicator size="large" color={A.accent} />
                  </View>
                ) : filteredDoctors.length === 0 ? (
                  <View style={styles.modalLoading}>
                    <Text style={styles.modalEmptyText}>
                      {doctorSearchQuery ? t('doctorDental.noMatchingDoctors') : t('doctorDental.noDoctorsFound')}
                    </Text>
                  </View>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <TouchableOpacity
                      key={doctor.id}
                      style={styles.modalOption}
                      onPress={() => {
                        setSelectedDoctor(doctor);
                        setShowDoctorModal(false);
                        setDoctorSearchQuery('');
                      }}
                    >
                      <View style={styles.modalOptionContent}>
                        <Text style={styles.modalOptionText}>
                          {doctor.name}
                        </Text>
                        <Text style={styles.modalOptionSubtext}>
                          {doctor.specialization}
                        </Text>
                      </View>
                      {selectedDoctor?.id === doctor.id && (
                        <Check size={20} color={A.accent} />
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
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t('doctorDental.selectPatient')}
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowPatientModal(false);
                  setPatientSearchQuery('');
                }}>
                  <X size={24} color={P.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalSearchContainer}>
                <Search size={18} color={P.placeholder} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder={t('doctorDental.searchPatients')}
                  placeholderTextColor={P.placeholder}
                  value={patientSearchQuery}
                  onChangeText={setPatientSearchQuery}
                />
                {patientSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
                    <X size={16} color={P.placeholder} />
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
                  <ActivityIndicator size="large" color={A.accent} />
                </View>
              ) : filteredPatients.length === 0 ? (
                <View style={styles.modalLoading}>
                  <Text style={styles.modalEmptyText}>
                    {patientSearchQuery ? t('doctorDental.noMatchingPatients') : t('doctorDental.noPatientsForDoctor')}
                  </Text>
                </View>
              ) : (
                filteredPatients.map((patient) => (
                  <TouchableOpacity
                    key={patient.medical_id}
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedPatient(patient);
                      setShowPatientModal(false);
                      setPatientSearchQuery('');
                    }}
                  >
                    <View style={styles.modalOptionContent}>
                      <Text style={styles.modalOptionText}>
                        {patient.full_name}
                      </Text>
                      <Text style={styles.modalOptionSubtext}>
                        {t('doctorDental.idLabel', { id: patient.medical_id })}
                      </Text>
                    </View>
                    {selectedPatient?.medical_id === patient.medical_id && (
                      <Check size={20} color={A.accent} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={showDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetail(false)}
      >
        <SafeAreaView style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <Text style={styles.modalTitle}>{t('doctorDental.dentalEncounter')}</Text>
            <TouchableOpacity onPress={() => setShowDetail(false)}>
              <X size={24} color={P.text} />
            </TouchableOpacity>
          </View>

          {detailLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={A.accent} />
            </View>
          ) : selectedEncounter ? (
            <ScrollView style={styles.modalScroll}>
              {/* Encounter Info */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>{t('doctorDental.encounterInformation')}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('doctorDental.dateLabel')}</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedEncounter.encounter.date)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('doctorDental.doctorLabel')}</Text>
                  <Text style={styles.infoValue}>{selectedEncounter.encounter.doctor.name}</Text>
                </View>
                {selectedEncounter.encounter.notes && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('doctorDental.notesLabel')}</Text>
                    <Text style={styles.infoValue}>{selectedEncounter.encounter.notes}</Text>
                  </View>
                )}
              </View>

              {/* Treatments */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>{t('doctorDental.treatmentsCount', { count: selectedEncounter.total_treatments })}</Text>
                {selectedEncounter.treatments.map((treatment) => (
                  <View key={treatment.id} style={styles.treatmentCard}>
                    <View style={styles.treatmentHeader}>
                      {treatment.tooth_image && (
                        <Image source={{ uri: treatment.tooth_image }} style={styles.toothImage} />
                      )}
                      <View style={styles.treatmentHeaderInfo}>
                        <Text style={styles.toothName}>
                          {t('doctorDental.toothLabel', { number: treatment.tooth_number, name: treatment.tooth_name })}
                        </Text>
                        <Text style={styles.toothPosition}>
                          {t('doctorDental.toothPosition', { arch: treatment.tooth_arch, position: treatment.tooth_position })}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(treatment.status) }]}>
                        <Text style={styles.statusText}>{t(`doctorDental.status_${treatment.status.toLowerCase()}`, { defaultValue: treatment.status })}</Text>
                      </View>
                    </View>

                    <View style={styles.treatmentBody}>
                      <View style={styles.treatmentRow}>
                        <Text style={styles.treatmentLabel}>{t('doctorDental.serviceLabel')}</Text>
                        <Text style={styles.treatmentValue}>{treatment.service_name}</Text>
                      </View>
                      {treatment.service_description && (
                        <View style={styles.treatmentRow}>
                          <Text style={styles.treatmentLabel}>{t('doctorDental.descriptionLabel')}</Text>
                          <Text style={styles.treatmentValue}>{treatment.service_description}</Text>
                        </View>
                      )}
                      <View style={styles.treatmentRow}>
                        <Text style={styles.treatmentLabel}>{t('doctorDental.diagnosisLabel')}</Text>
                        <Text style={styles.treatmentValue}>{treatment.diagnosis}</Text>
                      </View>
                      <View style={styles.treatmentRow}>
                        <Text style={styles.treatmentLabel}>{t('doctorDental.treatmentLabel')}</Text>
                        <Text style={styles.treatmentValue}>{treatment.treatment}</Text>
                      </View>
                      {treatment.notes && (
                        <View style={styles.treatmentRow}>
                          <Text style={styles.treatmentLabel}>{t('doctorDental.notesLabel')}</Text>
                          <Text style={styles.treatmentValue}>{treatment.notes}</Text>
                        </View>
                      )}
                      <View style={styles.treatmentRow}>
                        <Text style={styles.treatmentLabel}>{t('doctorDental.dateLabel')}</Text>
                        <Text style={styles.treatmentValue}>{formatDate(treatment.date)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : null}
        </SafeAreaView>
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
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('doctorDental.dateRange')}
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <X size={24} color={P.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {[
                { value: 'all', label: t('doctorDental.dateAllTime') },
                { value: 'today', label: t('doctorDental.dateToday') },
                { value: 'week', label: t('doctorDental.dateLast7') },
                { value: 'month', label: t('doctorDental.dateLastMonth') },
                { value: 'year', label: t('doctorDental.dateLastYear') }
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedDateFilter(option.value as DateFilter);
                    setShowDateModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>
                    {option.label}
                  </Text>
                  {selectedDateFilter === option.value && (
                    <Check size={20} color={A.accent} />
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
    backgroundColor: P.cardBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: P.pageBg,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: P.textSecondary,
  },
  // Header
  header: {
    backgroundColor: P.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.border,
    backgroundColor: P.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconCard: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: P.text,
    lineHeight: 26,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: P.textSecondary,
    marginTop: 2,
  },
  headerFilterIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.border,
    backgroundColor: P.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Content
  content: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  // Select data context card
  selectCard: {
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
  selectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  selectIconBubble: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectHeaderText: {
    flex: 1,
  },
  selectTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: P.text,
  },
  selectSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: P.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: P.text,
    marginTop: 18,
    marginBottom: 10,
  },
  dropdown: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 18,
  },
  dropdownDisabled: {
    backgroundColor: P.disabledBg,
    borderColor: P.border,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  // Empty state
  emptyOuterCard: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.softBorder,
    borderRadius: 24,
    padding: 16,
    flexGrow: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 3,
  },
  emptyInnerBox: {
    flex: 1,
    minHeight: 420,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 22,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: P.text,
    marginTop: 24,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: P.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  // Record cards
  encountersContainer: {
    gap: 14,
    paddingBottom: 8,
  },
  encounterCard: {
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
  encounterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  encounterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  encounterHeaderText: {
    flex: 1,
  },
  chiefComplaint: {
    fontSize: 16,
    fontWeight: '800',
    color: P.text,
  },
  patientName: {
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
  encounterMeta: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.text,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    width: 110,
    color: P.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
    color: P.text,
  },
  // Modals
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
    backgroundColor: P.cardBg,
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
    fontWeight: '800',
    color: P.text,
  },
  modalEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: P.textSecondary,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 14,
    gap: 10,
    backgroundColor: P.inputBg,
    borderWidth: 1,
    borderColor: P.border,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: P.text,
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
    borderBottomColor: P.softBorder,
  },
  modalOptionContent: {
    flex: 1,
    gap: 4,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: P.text,
  },
  modalOptionSubtext: {
    fontSize: 13,
    color: P.textSecondary,
  },
  clearButton: {
    padding: 4,
  },
  // Detail modal
  detailContainer: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
    backgroundColor: P.cardBg,
  },
  detailSection: {
    backgroundColor: P.cardBg,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: P.softBorder,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 2,
  },
  treatmentCard: {
    backgroundColor: P.rowBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: P.border,
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  toothImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  treatmentHeaderInfo: {
    flex: 1,
  },
  toothName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    color: P.text,
  },
  toothPosition: {
    fontSize: 12,
    color: P.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  treatmentBody: {
    gap: 8,
  },
  treatmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  treatmentLabel: {
    fontSize: 13,
    fontWeight: '500',
    width: 100,
    color: P.textSecondary,
  },
  treatmentValue: {
    flex: 1,
    fontSize: 13,
    color: P.text,
  },
});

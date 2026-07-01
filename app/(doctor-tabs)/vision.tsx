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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, Search, Calendar, User, FileText, X, ChevronRight, ChevronDown, Check, Download, Filter, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { config } from '@/utils/config';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';

// Vision accent (saturated brand color — kept inline, not theme-dependent)
const A = {
  accent: '#2D7DD2',
  lightBg: '#EAF3FC',
};

interface VisionTest {
  id: string;
  test_date: string;
  test_type: string;
  results: string;
  recommendations: string;
  notes: string | null;
  doctor_id: string;
  doctor_name: string;
  doctor_specialization: string;
  patient_name: string;
  patient_medical_id: string;
  created_at: string;
  documents?: {
    name: string;
    url: string;
    type: string;
    path: string;
  }[];
}

interface EyeExamination {
  date: string;
  right_sphere: number | null;
  left_sphere: number | null;
  right_cylinder: number | null;
  left_cylinder: number | null;
  right_axis: number | null;
  left_axis: number | null;
  vision_with_glasses: string | null;
  vision_without_glasses: string | null;
  pressure_right: string | null;
  pressure_left: string | null;
  notes: string | null;
  doctor: string;
  company: string;
}

interface EyeglassPrescription {
  date: string;
  right_sphere: number | null;
  left_sphere: number | null;
  right_cylinder: number | null;
  left_cylinder: number | null;
  right_axis: number | null;
  left_axis: number | null;
  right_add: number | null;
  left_add: number | null;
  lens_type: string | null;
  frame_type: string | null;
  pd: string | null;
  remarks: string | null;
  doctor: string;
  company: string;
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

export default function DoctorVisionScreen() {
  const { session } = useAuth();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const [visionTests, setVisionTests] = useState<VisionTest[]>([]);
  const [filteredVisionTests, setFilteredVisionTests] = useState<VisionTest[]>([]);
  const [latestExam, setLatestExam] = useState<EyeExamination | null>(null);
  const [latestPrescription, setLatestPrescription] = useState<EyeglassPrescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

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
      setFilteredVisionTests(visionTests);
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filtered = visionTests.filter(test => {
      const testDate = new Date(test.test_date);

      switch (selectedDateFilter) {
        case 'today':
          return testDate >= today;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return testDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return testDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(today);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return testDate >= yearAgo;
        default:
          return true;
      }
    });

    setFilteredVisionTests(filtered);
  }, [visionTests, selectedDateFilter]);

  const loadVisionTests = useCallback(async (doctorId: string, patientMedicalId: string) => {
    try {
      setLoading(true);

      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;
      if (!globalId) {
        console.error('No global_id found in session');
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-vision-tests?global_id=${globalId}${companyId ? `&company_id=${companyId}` : ''}&doctor_id=${doctorId}&patient_medical_id=${patientMedicalId}`,
        {
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch vision tests');
      }

      const data = await response.json();
      const loadedTests = data.tests || [];
      setVisionTests(loadedTests);

      // Set latest examination and prescription
      setLatestExam(data.latest_examination || null);
      setLatestPrescription(data.latest_prescription || null);
    } catch (error) {
      console.error('Error loading vision tests:', error);
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
      setVisionTests([]);
      setPatients([]);
      setPatientSearchQuery('');
      loadInitialData();
    }
  }, [session?.user?.company_id, loadInitialData]);

  useEffect(() => {
    if (selectedDoctor && selectedPatient) {
      loadVisionTests(selectedDoctor.id, selectedPatient.medical_id);
    } else {
      setVisionTests([]);
      setFilteredVisionTests([]);
    }
  }, [selectedDoctor, selectedPatient, loadVisionTests]);

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

  const toggleTestExpansion = (testId: string) => {
    setExpandedTest(
      expandedTest === testId ? null : testId
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openDocument = (url: string) => {
    Linking.openURL(url);
  };

  if (loading && doctors.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={A.accent} />
          <Text style={styles.loadingText}>
            {t('doctorVision.loadingRecords')}
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
            <Eye size={26} color={A.accent} strokeWidth={2.4} />
          </View>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>{t('doctorVision.headerTitle')}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{t('doctorVision.headerSubtitle')}</Text>
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
                <Text style={styles.selectTitle}>{t('doctorVision.selectDataContext')}</Text>
                <Text style={styles.selectSubtitle}>{t('doctorVision.selectContextSubtitle')}</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>{t('doctorVision.selectDoctor')}</Text>
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
                {selectedDoctor ? selectedDoctor.name : t('doctorVision.chooseDoctor')}
              </Text>
              <ChevronDown size={18} color={P.chevron} />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>{t('doctorVision.selectPatient')}</Text>
            <TouchableOpacity
              style={[styles.dropdown, !selectedDoctor && styles.dropdownDisabled]}
              onPress={() => selectedDoctor && setShowPatientModal(true)}
              disabled={!selectedDoctor}
              activeOpacity={0.7}
            >
              <User size={18} color={!selectedDoctor ? P.placeholder : P.textSecondary} />
              <Text
                style={[
                  styles.dropdownText,
                  { color: selectedPatient ? P.text : (!selectedDoctor ? P.placeholder : P.placeholder) },
                ]}
                numberOfLines={1}
              >
                {selectedPatient ? selectedPatient.full_name : t('doctorVision.choosePatient')}
              </Text>
              <ChevronDown size={18} color={!selectedDoctor ? P.placeholder : P.chevron} />
            </TouchableOpacity>
          </View>

          {!selectedDoctor || !selectedPatient ? (
            <View style={styles.emptyOuterCard}>
              <View style={[styles.emptyInnerBox, { borderColor: P.dashed }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: A.lightBg }]}>
                  <Eye size={52} color={A.accent} strokeWidth={1.8} />
                </View>
                <Text style={styles.emptyTitle}>{t('doctorVision.emptyTitle')}</Text>
                <Text style={styles.emptyDescription}>
                  {t('doctorVision.selectBothPrompt')}
                </Text>
              </View>
            </View>
          ) : (
            <>
              {latestExam && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <View style={[styles.summaryIcon, { backgroundColor: A.lightBg }]}>
                      <Eye size={20} color={A.accent} />
                    </View>
                    <Text style={styles.summaryTitle}>{t('doctorVision.latestEyeExamination')}</Text>
                  </View>
                  <Text style={styles.summaryDate}>
                    {formatDate(latestExam.date)}
                  </Text>
                  <Text style={styles.summaryDoctor}>
                    {latestExam.doctor} • {latestExam.company}
                  </Text>

                  <View style={styles.visionGrid}>
                    {latestExam.right_sphere !== null && (
                      <View style={styles.visionItem}>
                        <Text style={styles.visionLabel}>{t('doctorVision.rightSphere')}</Text>
                        <Text style={styles.visionValue}>{latestExam.right_sphere}</Text>
                      </View>
                    )}
                    {latestExam.left_sphere !== null && (
                      <View style={styles.visionItem}>
                        <Text style={styles.visionLabel}>{t('doctorVision.leftSphere')}</Text>
                        <Text style={styles.visionValue}>{latestExam.left_sphere}</Text>
                      </View>
                    )}
                    {latestExam.vision_with_glasses && (
                      <View style={styles.visionItem}>
                        <Text style={styles.visionLabel}>{t('doctorVision.withGlasses')}</Text>
                        <Text style={styles.visionValue}>{latestExam.vision_with_glasses}</Text>
                      </View>
                    )}
                    {latestExam.vision_without_glasses && (
                      <View style={styles.visionItem}>
                        <Text style={styles.visionLabel}>{t('doctorVision.withoutGlasses')}</Text>
                        <Text style={styles.visionValue}>{latestExam.vision_without_glasses}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {latestPrescription && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <View style={[styles.summaryIcon, { backgroundColor: A.lightBg }]}>
                      <Eye size={20} color={A.accent} />
                    </View>
                    <Text style={styles.summaryTitle}>{t('doctorVision.latestEyeglassPrescription')}</Text>
                  </View>
                  <Text style={styles.summaryDate}>
                    {formatDate(latestPrescription.date)}
                  </Text>
                  <Text style={styles.summaryDoctor}>
                    {latestPrescription.doctor} • {latestPrescription.company}
                  </Text>

                  <View style={styles.visionGrid}>
                    {latestPrescription.right_sphere !== null && (
                      <View style={styles.visionItem}>
                        <Text style={styles.visionLabel}>{t('doctorVision.rightSphere')}</Text>
                        <Text style={styles.visionValue}>{latestPrescription.right_sphere}</Text>
                      </View>
                    )}
                    {latestPrescription.left_sphere !== null && (
                      <View style={styles.visionItem}>
                        <Text style={styles.visionLabel}>{t('doctorVision.leftSphere')}</Text>
                        <Text style={styles.visionValue}>{latestPrescription.left_sphere}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {filteredVisionTests.length === 0 ? (
                <View style={styles.emptyOuterCard}>
                  <View style={[styles.emptyInnerBox, { borderColor: P.dashed, minHeight: 280 }]}>
                    <View style={[styles.emptyIconCircle, { backgroundColor: A.lightBg }]}>
                      <Eye size={52} color={A.accent} strokeWidth={1.8} />
                    </View>
                    <Text style={styles.emptyDescription}>
                      {t('doctorVision.noVisionTests')}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.testsContainer}>
              {filteredVisionTests.map((test) => {
                const isExpanded = expandedTest === test.id;
                return (
                  <TouchableOpacity
                    key={test.id}
                    style={styles.testCard}
                    onPress={() => toggleTestExpansion(test.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.testHeader}>
                      <View style={styles.testHeaderLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: A.lightBg }]}>
                          <Eye size={20} color={A.accent} />
                        </View>
                        <View style={styles.testHeaderText}>
                          <Text style={styles.testType}>
                            {test.test_type}
                          </Text>
                          <Text style={styles.patientName}>
                            {test.patient_name}
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
                        {t('doctorVision.doctorPrefix', { name: test.doctor_name })}
                      </Text>
                    </View>

                    <View style={styles.testMeta}>
                      <View style={styles.metaItem}>
                        <Calendar size={14} color={P.textSecondary} />
                        <Text style={styles.metaText}>
                          {formatDate(test.test_date)}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <User size={14} color={P.textSecondary} />
                        <Text style={styles.metaText}>
                          {t('doctorVision.idLabel', { id: test.patient_medical_id })}
                        </Text>
                      </View>
                    </View>

                    {isExpanded && (
                      <View style={styles.testDetails}>
                        <View style={styles.divider} />

                        <View style={styles.infoSection}>
                          <Text style={styles.sectionTitle}>
                            {t('doctorVision.testResults')}
                          </Text>
                          <View style={styles.infoItem}>
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>
                                {t('doctorVision.resultsLabel')}
                              </Text>
                              <Text style={styles.infoValue}>
                                {test.results}
                              </Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>
                                {t('doctorVision.recommendationsLabel')}
                              </Text>
                              <Text style={styles.infoValue}>
                                {test.recommendations}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {test.notes && (
                          <View style={styles.notesContainer}>
                            <View style={styles.notesHeader}>
                              <FileText size={16} color={P.textSecondary} />
                              <Text style={styles.notesLabel}>
                                {t('doctorVision.additionalNotes')}
                              </Text>
                            </View>
                            <Text style={styles.notesText}>
                              {test.notes}
                            </Text>
                          </View>
                        )}

                        {test.documents && test.documents.length > 0 && (
                          <View style={styles.documentsSection}>
                            <Text style={styles.sectionTitle}>
                              {t('doctorVision.documents')}
                            </Text>
                            {test.documents.map((doc, index) => (
                              <TouchableOpacity
                                key={index}
                                style={styles.documentButton}
                                activeOpacity={0.7}
                                onPress={() => openDocument(doc.url)}
                              >
                                <FileText size={18} color={A.accent} />
                                <Text style={styles.documentName}>{doc.name}</Text>
                                <Download size={18} color={A.accent} />
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        <View style={styles.infoSection}>
                          <Text style={styles.sectionTitle}>
                            {t('doctorVision.visitInformation')}
                          </Text>
                          <View style={styles.infoItem}>
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>
                                {t('doctorVision.doctorLabel')}
                              </Text>
                              <Text style={styles.infoValue}>
                                {t('doctorVision.doctorPrefix', { name: test.doctor_name })}
                              </Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>
                                {t('doctorVision.specializationLabel')}
                              </Text>
                              <Text style={styles.infoValue}>
                                {test.doctor_specialization}
                              </Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>
                                {t('doctorVision.patientLabel')}
                              </Text>
                              <Text style={styles.infoValue}>
                                {test.patient_name}
                              </Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>
                                {t('doctorVision.medicalIdLabel')}
                              </Text>
                              <Text style={styles.infoValue}>
                                {test.patient_medical_id}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
                </View>
              )}
            </>
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
                  {t('doctorVision.selectDoctor')}
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
                  placeholder={t('doctorVision.searchDoctors')}
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
                      {doctorSearchQuery ? t('doctorVision.noMatchingDoctors') : t('doctorVision.noDoctorsFound')}
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
                  {t('doctorVision.selectPatient')}
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
                  placeholder={t('doctorVision.searchPatients')}
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
                    {patientSearchQuery ? t('doctorVision.noMatchingPatients') : t('doctorVision.noPatientsForDoctor')}
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
                        {t('doctorVision.idLabel', { id: patient.medical_id })}
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
                {t('doctorVision.dateRange')}
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <X size={24} color={P.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {[
                { value: 'all', label: t('doctorVision.dateAllTime') },
                { value: 'today', label: t('doctorVision.dateToday') },
                { value: 'week', label: t('doctorVision.dateLast7Days') },
                { value: 'month', label: t('doctorVision.dateLastMonth') },
                { value: 'year', label: t('doctorVision.dateLastYear') }
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
  // Summary cards
  summaryCard: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.softBorder,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: P.text,
    flex: 1,
  },
  summaryDate: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: P.textSecondary,
  },
  summaryDoctor: {
    fontSize: 13,
    marginBottom: 16,
    color: P.placeholder,
  },
  visionGrid: {
    gap: 10,
  },
  visionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: P.pageBg,
    borderWidth: 1,
    borderColor: P.softBorder,
  },
  visionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: P.textSecondary,
  },
  visionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: P.text,
  },
  // Test cards
  testsContainer: {
    gap: 14,
    paddingBottom: 8,
  },
  testCard: {
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
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testHeaderLeft: {
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
  testHeaderText: {
    flex: 1,
  },
  testType: {
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
  testMeta: {
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
  testDetails: {
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
  infoSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.text,
  },
  infoItem: {
    borderRadius: 12,
    padding: 12,
    gap: 10,
    backgroundColor: P.pageBg,
    borderWidth: 1,
    borderColor: P.softBorder,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    width: 130,
    color: P.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
    color: P.text,
  },
  documentsSection: {
    gap: 12,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: P.pageBg,
    borderColor: P.border,
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: P.pageBg,
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
});

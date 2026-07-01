import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, RefreshControl, Linking, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { SUPABASE_URL } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, Filter, ChevronDown, FileText, Download, Search, X } from 'lucide-react-native';
import { config } from '@/utils/config';
import { getSession } from '@/utils/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface EyeTest {
  id: string;
  date: string;
  test_type: string;
  result: string;
  notes: string | null;
  doctor_id: string;
  doctor: string;
  company: string;
  documents: {
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

interface GroupedTests {
  [doctorId: string]: {
    doctor: Doctor;
    tests: EyeTest[];
  };
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export default function VisionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allTests, setAllTests] = useState<EyeTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<EyeTest[]>([]);
  const [latestExam, setLatestExam] = useState<EyeExamination | null>(null);
  const [latestPrescription, setLatestPrescription] = useState<EyeglassPrescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setLoadingDoctors] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [medicalId, setMedicalId] = useState<string>('');
  const [dataLoaded, setDataLoaded] = useState(false);

  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'doctor' | 'date' | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const session = await getSession();
      if (session) {
        if (session.patient?.medical_id) {
          setMedicalId(session.patient.medical_id);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchDoctors = useCallback(async () => {
    try {
      setLoadingDoctors(true);

      const doctorsResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/mobile-get-patient-doctors`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ medicalId }),
        }
      );

      const doctorsData = await doctorsResponse.json();
      if (doctorsData.success) {
        const formattedDoctors = doctorsData.doctors.map((doc: any) => ({
          id: doc.id,
          name: `${doc.first_name} ${doc.last_name}`,
          specialization: doc.specialization || 'N/A',
        }));
        setDoctors(formattedDoctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  }, [medicalId]);

  const fetchEyeData = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }


      const summaryResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/mobile-get-patient-eye-summary`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ medicalId }),
        }
      );

      const summaryData = await summaryResponse.json();
      if (summaryData.success) {
        setLatestExam(summaryData.latest_examination);
        setLatestPrescription(summaryData.latest_prescription);
      }

      const requestBody: any = { medicalId };
      if (selectedDoctorFilter !== 'all') {
        requestBody.doctorId = selectedDoctorFilter;
      }

      const testsResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/mobile-get-patient-eye-tests`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const testsData = await testsResponse.json();
      if (testsData.success) {
        setAllTests(testsData.tests);
      }

      setDataLoaded(prev => prev || true);
    } catch (error) {
      console.error('Error fetching eye data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medicalId, selectedDoctorFilter]);

  const onRefresh = () => {
    if (medicalId) {
      fetchEyeData(true);
    }
  };

  const applyFilters = useCallback(() => {
    setFilterLoading(true);

    setTimeout(() => {
      let filtered = [...allTests];

      if (selectedDoctorFilter !== 'all') {
        filtered = filtered.filter(test => test.doctor_id === selectedDoctorFilter);
      }

      if (selectedDateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        filtered = filtered.filter(test => {
          const testDate = new Date(test.date);

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
      }

      setFilteredTests(filtered);
      setFilterLoading(false);
    }, 300);
  }, [allTests, selectedDoctorFilter, selectedDateFilter]);

  useEffect(() => {
    if (medicalId) {
      fetchDoctors();
      fetchEyeData();
    }
  }, [medicalId, fetchDoctors, fetchEyeData]);

  useEffect(() => {
    if (dataLoaded) {
      applyFilters();
    }
  }, [dataLoaded, applyFilters]);

  useEffect(() => {
    if (medicalId && dataLoaded && (selectedDoctorFilter !== 'all' || selectedDateFilter !== 'all')) {
      fetchEyeData();
    }
  }, [selectedDoctorFilter, selectedDateFilter, medicalId, dataLoaded, fetchEyeData]);

  const groupTestsByDoctor = (): GroupedTests => {
    const grouped: GroupedTests = {};

    filteredTests.forEach(test => {
      if (!grouped[test.doctor_id]) {
        const doctor = doctors.find(d => d.id === test.doctor_id);
        if (doctor) {
          grouped[test.doctor_id] = {
            doctor,
            tests: []
          };
        }
      }
      if (grouped[test.doctor_id]) {
        grouped[test.doctor_id].tests.push(test);
      }
    });

    return grouped;
  };

  const openDocument = (url: string) => {
    Linking.openURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDoctorFilterLabel = () => {
    if (selectedDoctorFilter === 'all') return t('patientVision.allDoctors');
    const doctor = doctors.find(d => d.id === selectedDoctorFilter);
    return doctor ? t('patientVision.doctorPrefix', { name: doctor.name }) : t('patientVision.allDoctors');
  };

  const getDateFilterLabel = () => {
    switch (selectedDateFilter) {
      case 'today': return t('patientVision.dateToday');
      case 'week': return t('patientVision.dateLast7Days');
      case 'month': return t('patientVision.dateLastMonth');
      case 'year': return t('patientVision.dateLastYear');
      default: return t('patientVision.dateAllTime');
    }
  };

  const groupedTests = groupTestsByDoctor();

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('patientVision.headerTitle')}</Text>
        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <Filter size={24} color={colors.primary} />
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('patientVision.loadingData')}</Text>
          </View>
        ) : filterLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {latestExam && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Eye size={24} color={colors.primary} />
                <Text style={styles.summaryTitle}>{t('patientVision.latestEyeExamination')}</Text>
              </View>
              <Text style={styles.summaryDate}>{formatDate(latestExam.date)}</Text>
              <Text style={styles.summaryDoctor}>{latestExam.doctor} • {latestExam.company}</Text>

              <View style={styles.visionGrid}>
                {latestExam.right_sphere !== null && (
                  <View style={styles.visionItem}>
                    <Text style={styles.visionLabel}>{t('patientVision.rightSphere')}</Text>
                    <Text style={styles.visionValue}>{latestExam.right_sphere}</Text>
                  </View>
                )}
                {latestExam.left_sphere !== null && (
                  <View style={styles.visionItem}>
                    <Text style={styles.visionLabel}>{t('patientVision.leftSphere')}</Text>
                    <Text style={styles.visionValue}>{latestExam.left_sphere}</Text>
                  </View>
                )}
                {latestExam.vision_with_glasses && (
                  <View style={styles.visionItem}>
                    <Text style={styles.visionLabel}>{t('patientVision.withGlasses')}</Text>
                    <Text style={styles.visionValue}>{latestExam.vision_with_glasses}</Text>
                  </View>
                )}
                {latestExam.vision_without_glasses && (
                  <View style={styles.visionItem}>
                    <Text style={styles.visionLabel}>{t('patientVision.withoutGlasses')}</Text>
                    <Text style={styles.visionValue}>{latestExam.vision_without_glasses}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {latestPrescription && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Eye size={24} color={colors.primary} />
                <Text style={styles.summaryTitle}>{t('patientVision.latestEyeglassPrescription')}</Text>
              </View>
              <Text style={styles.summaryDate}>{formatDate(latestPrescription.date)}</Text>
              <Text style={styles.summaryDoctor}>{latestPrescription.doctor} • {latestPrescription.company}</Text>

              <View style={styles.visionGrid}>
                {latestPrescription.right_sphere !== null && (
                  <View style={styles.visionItem}>
                    <Text style={styles.visionLabel}>{t('patientVision.rightSphere')}</Text>
                    <Text style={styles.visionValue}>{latestPrescription.right_sphere}</Text>
                  </View>
                )}
                {latestPrescription.left_sphere !== null && (
                  <View style={styles.visionItem}>
                    <Text style={styles.visionLabel}>{t('patientVision.leftSphere')}</Text>
                    <Text style={styles.visionValue}>{latestPrescription.left_sphere}</Text>
                  </View>
                )}
                {latestPrescription.lens_type && (
                  <View style={styles.visionItem}>
                    <Text style={styles.visionLabel}>{t('patientVision.lensType')}</Text>
                    <Text style={styles.visionValue}>{latestPrescription.lens_type}</Text>
                  </View>
                )}
                {latestPrescription.pd && (
                  <View style={styles.visionItem}>
                    <Text style={styles.visionLabel}>{t('patientVision.pd')}</Text>
                    <Text style={styles.visionValue}>{latestPrescription.pd}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.testsSection}>
            <Text style={styles.sectionTitle}>{t('patientVision.eyeTestsAndDocuments')}</Text>

            {filteredTests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FileText size={64} color={colors.border} />
                <Text style={styles.emptyTitle}>{t('patientVision.noEyeTestsFound')}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('patientVision.noEyeTestsMatch')}
                </Text>
              </View>
            ) : (
              Object.entries(groupedTests).map(([doctorId, group]) => (
                <View key={doctorId} style={styles.doctorGroup}>
                  <View style={styles.doctorGroupHeader}>
                    <View>
                      <Text style={styles.doctorGroupName}>{t('patientVision.doctorPrefix', { name: group.doctor.name })}</Text>
                      <Text style={styles.doctorGroupSpecialization}>
                        {group.doctor.specialization}
                      </Text>
                    </View>
                    <View style={styles.testCountBadge}>
                      <Text style={styles.testCountText}>{group.tests.length}</Text>
                    </View>
                  </View>

                  {group.tests.map((test) => (
                    <View key={test.id} style={styles.testCard}>
                      <View style={styles.testHeader}>
                        <Text style={styles.testType}>{test.test_type}</Text>
                        <Text style={styles.testDate}>{formatDate(test.date)}</Text>
                      </View>

                      <View style={styles.testResult}>
                        <Text style={styles.resultLabel}>{t('patientVision.resultLabel')}</Text>
                        <Text style={styles.resultValue}>{test.result}</Text>
                      </View>

                      {test.notes && (
                        <View style={styles.notesBox}>
                          <Text style={styles.notesLabel}>{t('patientVision.notesLabel')}</Text>
                          <Text style={styles.notesText}>{test.notes}</Text>
                        </View>
                      )}

                      {test.documents && test.documents.length > 0 && (
                        <View style={styles.documentsSection}>
                          <Text style={styles.documentsTitle}>{t('patientVision.documentsLabel')}</Text>
                          {test.documents.map((doc, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.documentButton}
                              activeOpacity={0.7}
                              onPress={() => openDocument(doc.url)}
                            >
                              <FileText size={18} color={colors.primary} />
                              <Text style={styles.documentName}>{doc.name}</Text>
                              <Download size={18} color={colors.primary} />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { setShowFilterModal(false); setOpenDropdown(null); setDoctorSearch(''); }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => { setShowFilterModal(false); setOpenDropdown(null); setDoctorSearch(''); }}
          >
          <TouchableOpacity activeOpacity={1} style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>{t('patientVision.filters')}</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity
                  onPress={() => { setSelectedDoctorFilter('all'); setSelectedDateFilter('all'); setOpenDropdown(null); setDoctorSearch(''); }}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>{t('patientVision.clearAll')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setShowFilterModal(false); setOpenDropdown(null); setDoctorSearch(''); }}
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
              <Text style={styles.filterSectionTitle}>{t('patientVision.doctor')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, openDropdown === 'doctor' && styles.dropdownTriggerOpen]}
                onPress={() => { if (openDropdown === 'doctor') { setOpenDropdown(null); setDoctorSearch(''); } else { setOpenDropdown('doctor'); setDoctorSearch(''); } }}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{getDoctorFilterLabel()}</Text>
                <ChevronDown size={18} color={colors.textSecondary} style={{ transform: [{ rotate: openDropdown === 'doctor' ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
              {openDropdown === 'doctor' && (() => {
                const doctorItems = [{ id: 'all', name: t('patientVision.allDoctors'), specialization: '' }, ...doctors.map(d => ({ id: d.id, name: t('patientVision.doctorPrefix', { name: d.name }), specialization: d.specialization }))]
                  .filter(item => item.id === 'all' || item.name.toLowerCase().includes(doctorSearch.toLowerCase()) || item.specialization.toLowerCase().includes(doctorSearch.toLowerCase()));
                return (
                  <View style={styles.dropdownList}>
                    <View style={styles.dropdownSearchRow}>
                      <Search size={15} color={colors.textSecondary} />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder={t('patientVision.searchDoctors')}
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
                          style={[styles.dropdownItem, selectedDoctorFilter === item.id && styles.dropdownItemSelected, index === doctorItems.length - 1 && styles.dropdownItemLast]}
                          onPress={() => { setSelectedDoctorFilter(item.id); setOpenDropdown(null); setDoctorSearch(''); }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.dropdownItemContent}>
                            <Text style={[styles.dropdownItemText, selectedDoctorFilter === item.id && styles.dropdownItemTextSelected]}>{item.name}</Text>
                            {item.specialization ? <Text style={styles.dropdownItemSubtext}>{item.specialization}</Text> : null}
                          </View>
                          {selectedDoctorFilter === item.id && <View style={styles.dropdownItemCheck} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              })()}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('patientVision.dateRange')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, openDropdown === 'date' && styles.dropdownTriggerOpen]}
                onPress={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{getDateFilterLabel()}</Text>
                <ChevronDown size={18} color={colors.textSecondary} style={{ transform: [{ rotate: openDropdown === 'date' ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
              {openDropdown === 'date' && (
                <View style={styles.dropdownList}>
                  {[
                    { value: 'all', label: t('patientVision.dateAllTime') },
                    { value: 'today', label: t('patientVision.dateToday') },
                    { value: 'week', label: t('patientVision.dateLast7Days') },
                    { value: 'month', label: t('patientVision.dateLastMonth') },
                    { value: 'year', label: t('patientVision.dateLastYear') },
                  ].map((option, idx, arr) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.dropdownItem, selectedDateFilter === option.value && styles.dropdownItemSelected, idx === arr.length - 1 && styles.dropdownItemLast]}
                      onPress={() => { setSelectedDateFilter(option.value as DateFilter); setOpenDropdown(null); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dropdownItemText, selectedDateFilter === option.value && styles.dropdownItemTextSelected]}>{option.label}</Text>
                      {selectedDateFilter === option.value && <View style={styles.dropdownItemCheck} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => { setOpenDropdown(null); setShowFilterModal(false); }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#56C6C8', '#69C7F0']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={styles.applyButtonText}>{t('patientVision.applyFilters')}</Text>
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
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  promptContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  promptSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  summaryDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryDoctor: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  visionGrid: {
    gap: 12,
  },
  visionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
  },
  visionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  visionValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  testsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  doctorGroup: {
    marginBottom: 24,
  },
  doctorGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  doctorGroupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  doctorGroupSpecialization: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  testCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  testCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.card,
  },
  testCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 20,
    marginBottom: 12,
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 6,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  testType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  testDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  notesBox: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  documentsSection: {
    marginTop: 8,
  },
  documentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  filterModalContent: {
    backgroundColor: colors.card,
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    borderRadius: 24,
    paddingTop: 20,
    overflow: 'hidden',
    shadowColor: '#000',
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
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  filterModalTitle: {
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
  dropdownItemContent: {
    flex: 1,
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
  dropdownItemSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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

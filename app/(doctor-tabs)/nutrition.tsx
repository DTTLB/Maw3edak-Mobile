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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Apple, Search, Calendar, User, FileText, X, ChevronRight, ChevronDown, Check, Activity, Filter, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { config } from '@/utils/config';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';

// Nutrition accent
const A = {
  accent: '#15C2B0',
  lightBg: '#E4F8F4',
  dashed: '#A6E9E1',
};

interface NutritionData {
  current_status: any;
  goals: any[];
  measurements: any[];
  follow_ups: any[];
  meal_plans: any[];
  documents: any[];
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

export default function DoctorNutritionScreen() {
  const { session } = useAuth();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [filteredNutritionData, setFilteredNutritionData] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    if (!nutritionData) {
      setFilteredNutritionData(null);
      return;
    }

    if (selectedDateFilter === 'all') {
      setFilteredNutritionData(nutritionData);
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filterByDate = (items: any[], dateField: string) => {
      return items.filter(item => {
        const itemDate = new Date(item[dateField]);

        switch (selectedDateFilter) {
          case 'today':
            return itemDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return itemDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return itemDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return itemDate >= yearAgo;
          default:
            return true;
        }
      });
    };

    setFilteredNutritionData(prev => {
      const source = prev!;
      return {
        current_status: source.current_status,
        goals: filterByDate(source.goals || [], 'created_at'),
        measurements: filterByDate(source.measurements || [], 'measurement_date'),
        follow_ups: filterByDate(source.follow_ups || [], 'follow_up_date'),
        meal_plans: filterByDate(source.meal_plans || [], 'created_at'),
        documents: filterByDate(source.documents || [], 'uploaded_at'),
      };
    });
  }, [nutritionData, selectedDateFilter]);

  const loadNutritionData = useCallback(async (doctorId: string, patientMedicalId: string) => {
    try {
      setLoading(true);

      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;
      if (!globalId) {
        console.error('No global_id found in session');
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-nutrition-plans?global_id=${globalId}${companyId ? `&company_id=${companyId}` : ''}&doctor_id=${doctorId}&patient_medical_id=${patientMedicalId}`,
        {
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch nutrition data');
      }

      const data = await response.json();
      if (data.success) {
        setNutritionData({
          current_status: data.current_status,
          goals: data.goals || [],
          measurements: data.measurements || [],
          follow_ups: data.follow_ups || [],
          meal_plans: data.meal_plans || [],
          documents: data.documents || []
        });
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
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
      setNutritionData(null);
      setPatients([]);
      setPatientSearchQuery('');
      loadInitialData();
    }
  }, [session?.user?.company_id, loadInitialData]);

  useEffect(() => {
    if (selectedDoctor && selectedPatient) {
      loadNutritionData(selectedDoctor.id, selectedPatient.medical_id);
    } else {
      setNutritionData(null);
      setFilteredNutritionData(null);
    }
  }, [selectedDoctor, selectedPatient, loadNutritionData]);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openDocument = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error'), t('doctorNutrition.cannotOpenDocument'));
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert(t('common.error'), t('doctorNutrition.failedToOpenDocument'));
    }
  };

  if (loading && doctors.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={A.accent} />
          <Text style={styles.loadingText}>
            {t('doctorNutrition.loadingNutritionRecords')}
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
            <Apple size={26} color={A.accent} strokeWidth={2.4} />
          </View>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>{t('doctorNutrition.title')}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{t('doctorNutrition.headerSubtitle')}</Text>
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
                <Text style={styles.selectTitle}>{t('doctorNutrition.selectDataContext')}</Text>
                <Text style={styles.selectSubtitle}>{t('doctorNutrition.selectContextSubtitle')}</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>{t('doctorNutrition.selectDoctor')}</Text>
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
                {selectedDoctor ? selectedDoctor.name : t('doctorNutrition.chooseDoctor')}
              </Text>
              <ChevronDown size={18} color={P.chevron} />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>{t('doctorNutrition.selectPatient')}</Text>
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
                  { color: selectedPatient ? P.text : P.placeholder },
                ]}
                numberOfLines={1}
              >
                {selectedPatient ? selectedPatient.full_name : t('doctorNutrition.choosePatient')}
              </Text>
              <ChevronDown size={18} color={!selectedDoctor ? P.placeholder : P.chevron} />
            </TouchableOpacity>
          </View>

          {!selectedDoctor || !selectedPatient ? (
            <View style={styles.emptyOuterCard}>
              <View style={[styles.emptyInnerBox, { borderColor: A.dashed }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: A.lightBg }]}>
                  <Apple size={52} color={A.accent} strokeWidth={1.8} />
                </View>
                <Text style={styles.emptyTitle}>{t('doctorNutrition.emptyTitle')}</Text>
                <Text style={styles.emptyDescription}>
                  {t('doctorNutrition.selectDoctorAndPatient')}
                </Text>
              </View>
            </View>
          ) : !filteredNutritionData ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="large" color={A.accent} />
            </View>
          ) : (
            <View>
              {filteredNutritionData.current_status && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIcon, { backgroundColor: A.lightBg }]}>
                      <Apple size={18} color={A.accent} strokeWidth={2} />
                    </View>
                    <Text style={styles.cardTitle}>{t('doctorNutrition.currentProgram')}</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('doctorNutrition.programLabel')}</Text>
                      <Text style={styles.statusValue}>{filteredNutritionData.current_status.program_type}</Text>
                    </View>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('doctorNutrition.goalLabel')}</Text>
                      <Text style={styles.statusValue}>{filteredNutritionData.current_status.chief_goal}</Text>
                    </View>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('doctorNutrition.currentWeightLabel')}</Text>
                      <Text style={styles.statusValue}>{filteredNutritionData.current_status.current_weight} kg</Text>
                    </View>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('doctorNutrition.targetWeightLabel')}</Text>
                      <Text style={styles.statusValue}>{filteredNutritionData.current_status.target_weight} kg</Text>
                    </View>
                    {filteredNutritionData.current_status.doctor.name && (
                      <View style={styles.statusDoctorInfo}>
                        <Text style={styles.doctorLabel}>{t('doctorNutrition.nutritionistLabel')}</Text>
                        <Text style={[styles.doctorName, { color: A.accent }]}>{filteredNutritionData.current_status.doctor.name}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {filteredNutritionData.goals && filteredNutritionData.goals.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIcon, { backgroundColor: A.lightBg }]}>
                      <FileText size={18} color={A.accent} strokeWidth={2} />
                    </View>
                    <Text style={styles.cardTitle}>{t('doctorNutrition.goalsTitle', { count: filteredNutritionData.goals.length })}</Text>
                  </View>
                  {filteredNutritionData.goals.slice(0, 3).map((goal: any) => (
                    <View key={goal.id} style={styles.subItem}>
                      <View style={styles.goalHeader}>
                        <Text style={styles.goalType}>{goal.goal_type}</Text>
                        <Text style={[styles.goalTarget, { color: A.accent }]}>
                          {goal.start_value} → {goal.target_value} {goal.unit}
                        </Text>
                      </View>
                      {goal.target_date && (
                        <Text style={styles.goalDate}>{t('doctorNutrition.targetDate', { date: formatDate(goal.target_date) })}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {filteredNutritionData.measurements && filteredNutritionData.measurements.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIcon, { backgroundColor: A.lightBg }]}>
                      <Activity size={18} color={A.accent} strokeWidth={2} />
                    </View>
                    <Text style={styles.cardTitle}>{t('doctorNutrition.recentMeasurements')}</Text>
                  </View>
                  {filteredNutritionData.measurements.slice(0, 3).map((measurement: any) => (
                    <View key={measurement.id} style={styles.subItem}>
                      <Text style={styles.measurementDate}>{formatDate(measurement.date)}</Text>
                      <View style={styles.measurementRow}>
                        <View style={styles.measurementCol}>
                          <Text style={styles.measurementLabel}>{t('doctorNutrition.weight')}</Text>
                          <Text style={[styles.measurementValue, { color: A.accent }]}>{measurement.weight} kg</Text>
                        </View>
                        <View style={styles.measurementCol}>
                          <Text style={styles.measurementLabel}>{t('doctorNutrition.bmi')}</Text>
                          <Text style={[styles.measurementValue, { color: A.accent }]}>{measurement.bmi.toFixed(1)}</Text>
                        </View>
                        <View style={styles.measurementCol}>
                          <Text style={styles.measurementLabel}>{t('doctorNutrition.bodyFat')}</Text>
                          <Text style={[styles.measurementValue, { color: A.accent }]}>{measurement.body_fat}%</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {filteredNutritionData.follow_ups && filteredNutritionData.follow_ups.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIcon, { backgroundColor: A.lightBg }]}>
                      <Calendar size={18} color={A.accent} strokeWidth={2} />
                    </View>
                    <Text style={styles.cardTitle}>{t('doctorNutrition.followUps')}</Text>
                  </View>
                  {filteredNutritionData.follow_ups.slice(0, 3).map((followUp: any) => (
                    <View key={followUp.id} style={styles.subItem}>
                      <View style={styles.followUpHeader}>
                        <Text style={styles.followUpDate}>{formatDate(followUp.date)}</Text>
                        <View style={[styles.tagPill, { backgroundColor: A.lightBg }]}>
                          <Text style={[styles.tagPillText, { color: A.accent }]}>{t('doctorNutrition.adherence', { value: followUp.adherence })}</Text>
                        </View>
                      </View>
                      {followUp.next_check_in && (
                        <Text style={styles.followUpNext}>{t('doctorNutrition.next', { date: formatDate(followUp.next_check_in) })}</Text>
                      )}
                      {followUp.doctor.name && (
                        <Text style={styles.followUpDoctor}>{t('doctorNutrition.withDoctor', { name: followUp.doctor.name })}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {filteredNutritionData.meal_plans && filteredNutritionData.meal_plans.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIcon, { backgroundColor: A.lightBg }]}>
                      <User size={18} color={A.accent} strokeWidth={2} />
                    </View>
                    <Text style={styles.cardTitle}>{t('doctorNutrition.mealPlans')}</Text>
                  </View>
                  {filteredNutritionData.meal_plans.slice(0, 3).map((plan: any) => (
                    <View key={plan.id} style={styles.subItem}>
                      <Text style={styles.mealPlanTitle}>{plan.plan_title}</Text>
                      <View style={styles.mealPlanDetails}>
                        <Text style={[styles.mealPlanCalories, { color: A.accent }]}>{t('doctorNutrition.caloriesPerDay', { calories: plan.daily_calories })}</Text>
                        <View style={[styles.tagPill, { backgroundColor: A.lightBg }]}>
                          <Text style={[styles.tagPillText, { color: A.accent }]}>{plan.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.mealPlanDate}>
                        {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {filteredNutritionData.documents && filteredNutritionData.documents.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIcon, { backgroundColor: A.lightBg }]}>
                      <FileText size={18} color={A.accent} strokeWidth={2} />
                    </View>
                    <Text style={styles.cardTitle}>{t('doctorNutrition.documents')}</Text>
                  </View>
                  {filteredNutritionData.documents.slice(0, 3).map((doc: any) => (
                    <TouchableOpacity
                      key={doc.id}
                      style={styles.documentItem}
                      onPress={() => openDocument(doc.file_url)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentName}>{doc.file_name}</Text>
                        <Text style={styles.documentDescription}>{doc.description}</Text>
                        <Text style={styles.documentDate}>{formatDate(doc.uploaded_at)}</Text>
                      </View>
                      <ChevronRight size={20} color={P.placeholder} strokeWidth={2} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {(!filteredNutritionData.current_status && filteredNutritionData.goals.length === 0 && filteredNutritionData.measurements.length === 0 &&
                filteredNutritionData.follow_ups.length === 0 && filteredNutritionData.meal_plans.length === 0 && filteredNutritionData.documents.length === 0) && (
                <View style={styles.emptyOuterCard}>
                  <View style={[styles.emptyInnerBox, { borderColor: A.dashed, minHeight: 280 }]}>
                    <View style={[styles.emptyIconCircle, { backgroundColor: A.lightBg }]}>
                      <Apple size={52} color={A.accent} strokeWidth={1.8} />
                    </View>
                    <Text style={styles.emptyDescription}>
                      {t('doctorNutrition.noNutritionData')}
                    </Text>
                  </View>
                </View>
              )}
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
                  {t('doctorNutrition.selectDoctor')}
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
                  placeholder={t('doctorNutrition.searchDoctors')}
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
                      {doctorSearchQuery ? t('doctorNutrition.noMatchingDoctors') : t('doctorNutrition.noDoctorsFound')}
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
                  {t('doctorNutrition.selectPatient')}
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
                  placeholder={t('doctorNutrition.searchPatients')}
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
                    {patientSearchQuery ? t('doctorNutrition.noMatchingPatients') : t('doctorNutrition.noPatientsForDoctor')}
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
                        {t('doctorNutrition.idLabel', { id: patient.medical_id })}
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
                {t('doctorNutrition.dateRange')}
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <X size={24} color={P.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {[
                { value: 'all', label: t('doctorNutrition.dateAllTime') },
                { value: 'today', label: t('doctorNutrition.dateToday') },
                { value: 'week', label: t('doctorNutrition.dateLast7') },
                { value: 'month', label: t('doctorNutrition.dateLastMonth') },
                { value: 'year', label: t('doctorNutrition.dateLastYear') }
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
  inlineLoading: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
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
  card: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: P.text,
    flex: 1,
  },
  cardContent: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: P.textSecondary,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: P.text,
  },
  statusDoctorInfo: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: P.softBorder,
  },
  doctorLabel: {
    fontSize: 12,
    marginBottom: 4,
    color: P.textSecondary,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  subItem: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: P.rowBg,
    borderWidth: 1,
    borderColor: P.softBorder,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalType: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
    color: P.text,
  },
  goalTarget: {
    fontSize: 13,
    fontWeight: '600',
  },
  goalDate: {
    fontSize: 12,
    color: P.textSecondary,
  },
  measurementDate: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    color: P.text,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  measurementCol: {
    flex: 1,
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 11,
    marginBottom: 4,
    color: P.textSecondary,
  },
  measurementValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  followUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  followUpDate: {
    fontSize: 13,
    fontWeight: '700',
    color: P.text,
  },
  followUpNext: {
    fontSize: 12,
    marginBottom: 4,
    color: P.textSecondary,
  },
  followUpDoctor: {
    fontSize: 12,
    color: P.textSecondary,
  },
  mealPlanTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: P.text,
  },
  mealPlanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealPlanCalories: {
    fontSize: 13,
    fontWeight: '600',
  },
  mealPlanDate: {
    fontSize: 12,
    color: P.textSecondary,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: P.rowBg,
    borderWidth: 1,
    borderColor: P.softBorder,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    color: P.text,
  },
  documentDescription: {
    fontSize: 12,
    marginBottom: 2,
    color: P.textSecondary,
  },
  documentDate: {
    fontSize: 11,
    color: P.textSecondary,
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
});

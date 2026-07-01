import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Apple, Target, TrendingUp, Calendar, FileText, Utensils, ChevronRight, Filter, Search, X, ChevronDown } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getSession } from '@/utils/auth';
import * as WebBrowser from 'expo-web-browser';
import { config } from '@/utils/config';
import { useTheme } from '@/contexts/ThemeContext';
import BackButton from '@/components/BackButton';

interface Doctor {
  id: string;
  full_name: string;
}

interface NutritionData {
  current_status: any;
  goals: any[];
  measurements: any[];
  follow_ups: any[];
  meal_plans: any[];
  documents: any[];
  available_doctors: Doctor[];
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export default function NutritionScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');
  const [tempSelectedDoctorId, setTempSelectedDoctorId] = useState<string | null>(null);
  const [tempSelectedDateFilter, setTempSelectedDateFilter] = useState<DateFilter>('all');
  const [openDropdown, setOpenDropdown] = useState<'doctor' | 'date' | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');

  const getDateRange = useCallback((filter: DateFilter): { startDate?: string; endDate?: string } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'today':
        return { startDate: today.toISOString().split('T')[0] };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { startDate: weekAgo.toISOString().split('T')[0] };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { startDate: monthAgo.toISOString().split('T')[0] };
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return { startDate: yearAgo.toISOString().split('T')[0] };
      default:
        return {};
    }
  }, []);

  const fetchNutritionData = useCallback(async (doctorFilter?: string | null, dateFilter?: DateFilter, isFiltering = false) => {
    try {
      if (isFiltering) {
        setLoading(true);
      }

      const session = await getSession();
      if (!session || !session.patient) {
        setError(t('patientNutrition.pleaseLogInAgain'));
        setLoading(false);
        return;
      }

      const apiUrl = `${config.supabaseUrl}/functions/v1/mobile-get-nutrition-overview`;
      const body: any = { medicalId: session.patient.medical_id };

      if (doctorFilter) {
        body.doctorId = doctorFilter;
      }

      if (dateFilter && dateFilter !== 'all') {
        const dateRange = getDateRange(dateFilter);
        if (dateRange.startDate) {
          body.startDate = dateRange.startDate;
        }
        if (dateRange.endDate) {
          body.endDate = dateRange.endDate;
        }
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setNutritionData(data);
        setError('');
      } else if (data.error === 'Patient not found') {
        // Patient simply has no nutrition records — show empty state, not an error
        setNutritionData(null);
        setError('');
      } else {
        setError(data.error || t('patientNutrition.failedToLoad'));
      }
    } catch (err) {
      setError(t('patientNutrition.failedToFetch'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [t, getDateRange]);

  useEffect(() => {
    fetchNutritionData();
  }, [fetchNutritionData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNutritionData(selectedDoctorId, selectedDateFilter);
    setRefreshing(false);
  };

  const applyFilters = () => {
    setSelectedDoctorId(tempSelectedDoctorId);
    setSelectedDateFilter(tempSelectedDateFilter);
    setShowFilters(false);
    fetchNutritionData(tempSelectedDoctorId, tempSelectedDateFilter, true);
  };

  const clearFilters = () => {
    setTempSelectedDoctorId(null);
    setTempSelectedDateFilter('all');
    setSelectedDoctorId(null);
    setSelectedDateFilter('all');
    setShowFilters(false);
    fetchNutritionData(null, 'all', true);
  };

  const hasActiveFilters = selectedDoctorId || selectedDateFilter !== 'all';

  const styles = createStyles(colors);

  const openDocument = async (doc: any) => {
    try {
      if (!doc.file_url) {
        Alert.alert(t('common.error'), t('patientNutrition.documentUrlNotAvailable'));
        return;
      }
      await WebBrowser.openBrowserAsync(doc.file_url);
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert(t('common.error'), t('patientNutrition.failedToOpenDocument'));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDoctorFilterLabel = () => {
    if (!tempSelectedDoctorId) return t('patientNutrition.allDoctors');
    const doctor = nutritionData?.available_doctors?.find(d => d.id === tempSelectedDoctorId);
    return doctor ? doctor.full_name : t('patientNutrition.allDoctors');
  };

  const getDateFilterLabelDisplay = () => {
    switch (tempSelectedDateFilter) {
      case 'today': return t('patientNutrition.today');
      case 'week': return t('patientNutrition.last7Days');
      case 'month': return t('patientNutrition.lastMonth');
      case 'year': return t('patientNutrition.lastYear');
      default: return t('patientNutrition.allTime');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton color={colors.text} />
          <Text style={styles.title}>{t('patientNutrition.title')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !nutritionData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton color={colors.text} />
          <Text style={styles.title}>{t('patientNutrition.title')}</Text>
        </View>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.emptyContainer}>
            <Apple size={48} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.emptyText}>
              {error || t('patientNutrition.noDataAvailable')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton color={colors.text} />
        <Text style={styles.title}>{t('patientNutrition.title')}</Text>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => {
            setTempSelectedDoctorId(selectedDoctorId);
            setTempSelectedDateFilter(selectedDateFilter);
            setShowFilters(true);
          }}
        >
          <Filter size={20} color={hasActiveFilters ? colors.card : colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFilters}
        animationType="fade"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => { setShowFilters(false); setOpenDropdown(null); setDoctorSearch(''); }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { setShowFilters(false); setOpenDropdown(null); setDoctorSearch(''); }}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('patientNutrition.filters')}</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>{t('patientNutrition.clearAll')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setShowFilters(false); setOpenDropdown(null); setDoctorSearch(''); }}
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
              <Text style={styles.filterSectionTitle}>{t('patientNutrition.doctor')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, openDropdown === 'doctor' && styles.dropdownTriggerOpen]}
                onPress={() => { if (openDropdown === 'doctor') { setOpenDropdown(null); setDoctorSearch(''); } else { setOpenDropdown('doctor'); setDoctorSearch(''); } }}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{getDoctorFilterLabel()}</Text>
                <ChevronDown size={18} color={colors.textSecondary} style={{ transform: [{ rotate: openDropdown === 'doctor' ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
              {openDropdown === 'doctor' && (() => {
                const available = nutritionData?.available_doctors || [];
                const doctorItems = [{ id: '', full_name: t('patientNutrition.allDoctors') }, ...available]
                  .filter(item => item.id === '' || item.full_name.toLowerCase().includes(doctorSearch.toLowerCase()));
                return (
                  <View style={styles.dropdownList}>
                    <View style={styles.dropdownSearchRow}>
                      <Search size={15} color={colors.textSecondary} />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder={t('patientNutrition.searchDoctors')}
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
                          key={item.id || 'all'}
                          style={[styles.dropdownItem, tempSelectedDoctorId === (item.id || null) && styles.dropdownItemSelected, index === doctorItems.length - 1 && styles.dropdownItemLast]}
                          onPress={() => { setTempSelectedDoctorId(item.id || null); setOpenDropdown(null); setDoctorSearch(''); }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dropdownItemText, tempSelectedDoctorId === (item.id || null) && styles.dropdownItemTextSelected]}>{item.full_name}</Text>
                          {tempSelectedDoctorId === (item.id || null) && <View style={styles.dropdownItemCheck} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              })()}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('patientNutrition.dateRange')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, openDropdown === 'date' && styles.dropdownTriggerOpen]}
                onPress={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{getDateFilterLabelDisplay()}</Text>
                <ChevronDown size={18} color={colors.textSecondary} style={{ transform: [{ rotate: openDropdown === 'date' ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
              {openDropdown === 'date' && (
                <View style={styles.dropdownList}>
                  {[
                    { value: 'all', label: t('patientNutrition.allTime') },
                    { value: 'today', label: t('patientNutrition.today') },
                    { value: 'week', label: t('patientNutrition.last7Days') },
                    { value: 'month', label: t('patientNutrition.lastMonth') },
                    { value: 'year', label: t('patientNutrition.lastYear') },
                  ].map((option, idx, arr) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.dropdownItem, tempSelectedDateFilter === option.value && styles.dropdownItemSelected, idx === arr.length - 1 && styles.dropdownItemLast]}
                      onPress={() => { setTempSelectedDateFilter(option.value as DateFilter); setOpenDropdown(null); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dropdownItemText, tempSelectedDateFilter === option.value && styles.dropdownItemTextSelected]}>{option.label}</Text>
                      {tempSelectedDateFilter === option.value && <View style={styles.dropdownItemCheck} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => { setOpenDropdown(null); setDoctorSearch(''); applyFilters(); }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#56C6C8', '#69C7F0']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={styles.applyButtonText}>{t('patientNutrition.applyFilters')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContentWithData}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {nutritionData.current_status && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Target size={20} color={colors.primary} strokeWidth={2} />
              <Text style={styles.cardTitle}>{t('patientNutrition.currentProgram')}</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>{t('patientNutrition.programLabel')}</Text>
                <Text style={styles.statusValue}>{nutritionData.current_status.program_type}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>{t('patientNutrition.goalLabel')}</Text>
                <Text style={styles.statusValue}>{nutritionData.current_status.chief_goal}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>{t('patientNutrition.currentWeightLabel')}</Text>
                <Text style={styles.statusValue}>{t('patientNutrition.kgValue', { value: nutritionData.current_status.current_weight })}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>{t('patientNutrition.targetWeightLabel')}</Text>
                <Text style={styles.statusValue}>{t('patientNutrition.kgValue', { value: nutritionData.current_status.target_weight })}</Text>
              </View>
              {nutritionData.current_status.doctor.name && (
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorLabel}>{t('patientNutrition.nutritionistLabel')}</Text>
                  <Text style={styles.doctorName}>{nutritionData.current_status.doctor.name}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {nutritionData.goals && nutritionData.goals.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Target size={20} color="#15C2B0" strokeWidth={2} />
              <Text style={styles.cardTitle}>{t('patientNutrition.goals', { count: nutritionData.goals.length })}</Text>
            </View>
            {nutritionData.goals.slice(0, 3).map((goal: any) => (
              <View key={goal.id} style={styles.goalItem}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalType}>{goal.goal_type}</Text>
                  <Text style={styles.goalTarget}>
                    {goal.start_value} → {goal.target_value} {goal.unit}
                  </Text>
                </View>
                {goal.target_date && (
                  <Text style={styles.goalDate}>{t('patientNutrition.goalTarget', { date: formatDate(goal.target_date) })}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {nutritionData.measurements && nutritionData.measurements.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <TrendingUp size={20} color="#15C2B0" strokeWidth={2} />
              <Text style={styles.cardTitle}>{t('patientNutrition.recentMeasurements')}</Text>
            </View>
            {nutritionData.measurements.slice(0, 3).map((measurement: any) => (
              <View key={measurement.id} style={styles.measurementItem}>
                <Text style={styles.measurementDate}>{formatDate(measurement.date)}</Text>
                <View style={styles.measurementRow}>
                  <View style={styles.measurementCol}>
                    <Text style={styles.measurementLabel}>{t('patientNutrition.weight')}</Text>
                    <Text style={styles.measurementValue}>{t('patientNutrition.kgValue', { value: measurement.weight })}</Text>
                  </View>
                  <View style={styles.measurementCol}>
                    <Text style={styles.measurementLabel}>{t('patientNutrition.bmi')}</Text>
                    <Text style={styles.measurementValue}>{measurement.bmi.toFixed(1)}</Text>
                  </View>
                  <View style={styles.measurementCol}>
                    <Text style={styles.measurementLabel}>{t('patientNutrition.bodyFat')}</Text>
                    <Text style={styles.measurementValue}>{t('patientNutrition.percentValue', { value: measurement.body_fat })}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {nutritionData.follow_ups && nutritionData.follow_ups.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Calendar size={20} color="#2D7DD2" strokeWidth={2} />
              <Text style={styles.cardTitle}>{t('patientNutrition.followUps')}</Text>
            </View>
            {nutritionData.follow_ups.slice(0, 3).map((followUp: any) => (
              <View key={followUp.id} style={styles.followUpItem}>
                <View style={styles.followUpHeader}>
                  <Text style={styles.followUpDate}>{formatDate(followUp.date)}</Text>
                  <Text style={styles.followUpAdherence}>{t('patientNutrition.adherence', { value: followUp.adherence })}</Text>
                </View>
                {followUp.next_check_in && (
                  <Text style={styles.followUpNext}>{t('patientNutrition.next', { date: formatDate(followUp.next_check_in) })}</Text>
                )}
                {followUp.doctor.name && (
                  <Text style={styles.followUpDoctor}>{t('patientNutrition.withDoctor', { name: followUp.doctor.name })}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {nutritionData.meal_plans && nutritionData.meal_plans.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Utensils size={20} color="#FF6F61" strokeWidth={2} />
              <Text style={styles.cardTitle}>{t('patientNutrition.mealPlans')}</Text>
            </View>
            {nutritionData.meal_plans.slice(0, 3).map((plan: any) => (
              <View key={plan.id} style={styles.mealPlanItem}>
                <Text style={styles.mealPlanTitle}>{plan.plan_title}</Text>
                <View style={styles.mealPlanDetails}>
                  <Text style={styles.mealPlanCalories}>{t('patientNutrition.caloriesPerDay', { value: plan.daily_calories })}</Text>
                  <Text style={styles.mealPlanStatus}>{plan.status}</Text>
                </View>
                <Text style={styles.mealPlanDate}>
                  {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {nutritionData.documents && nutritionData.documents.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FileText size={20} color="#15C2B0" strokeWidth={2} />
              <Text style={styles.cardTitle}>{t('patientNutrition.documents')}</Text>
            </View>
            {nutritionData.documents.slice(0, 3).map((doc: any) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.documentItem}
                onPress={() => openDocument(doc)}
                activeOpacity={0.7}
              >
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{doc.file_name}</Text>
                  <Text style={styles.documentDescription}>{doc.description}</Text>
                  <Text style={styles.documentDate}>{formatDate(doc.uploaded_at)}</Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
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
  modalScroll: { flexShrink: 1 },
  modalScrollContent: { paddingHorizontal: 24, paddingBottom: 8 },
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  clearButton: { paddingHorizontal: 12, paddingVertical: 6 },
  clearButtonText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  filterSection: { marginBottom: 20 },
  filterSectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  applyButton: { backgroundColor: 'transparent', overflow: 'hidden', paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  applyButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
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
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentWithData: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: colors.text,
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
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  statusValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  doctorInfo: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doctorLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: colors.primary,
  },
  goalItem: {
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalType: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    textTransform: 'capitalize',
  },
  goalTarget: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#15C2B0',
  },
  goalDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  measurementItem: {
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  measurementDate: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    marginBottom: 12,
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
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#15C2B0',
  },
  followUpItem: {
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  followUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  followUpDate: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  followUpAdherence: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#2D7DD2',
  },
  followUpNext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  followUpDoctor: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  mealPlanItem: {
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  mealPlanTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    marginBottom: 8,
  },
  mealPlanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealPlanCalories: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#FF6F61',
  },
  mealPlanStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#15C2B0',
    textTransform: 'uppercase',
  },
  mealPlanDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
});

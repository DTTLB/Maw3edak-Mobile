import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, RefreshControl, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, ChevronDown, Search, X, User } from 'lucide-react-native';
import { config } from '@/utils/config';
import { getSession } from '@/utils/auth';
import { useTheme } from '@/contexts/ThemeContext';
import BackButton from '@/components/BackButton';

interface Doctor {
  id: string;
  name: string;
  image?: string;
}

interface DentalEncounter {
  id: string;
  date: string;
  notes: string;
  doctor: Doctor;
  treatments_count: number;
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
    doctor: Doctor;
  };
  treatments: Treatment[];
  total_treatments: number;
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export default function DentalScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [encounters, setEncounters] = useState<DentalEncounter[]>([]);
  const [filteredEncounters, setFilteredEncounters] = useState<DentalEncounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState('');
  const [medicalId, setMedicalId] = useState<string>('');

  // Filters
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'doctor' | 'date' | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');

  // Detail modal
  const [selectedEncounter, setSelectedEncounter] = useState<EncounterDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const loadEncounters = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      if (!medicalId) {
        setError(t('patientDental.loginRequired'));
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-dental-encounters`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ medicalId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Patient simply has no dental records — show empty state, not an error
        if (data.error === 'Patient not found') {
          setEncounters([]);
          setDoctors([]);
          return;
        }
        throw new Error(data.error || t('patientDental.loadError'));
      }

      if (data.success) {
        // Filter out encounters with no treatments
        const encountersWithTreatments = (data.encounters || []).filter(
          (enc: DentalEncounter) => enc.treatments_count > 0
        );
        setEncounters(encountersWithTreatments);

        // Extract unique doctors who have encounters with treatments
        const uniqueDoctors = Array.from(
          new Map(
            encountersWithTreatments.map((enc: DentalEncounter) => [enc.doctor.id, enc.doctor])
          ).values()
        ) as Doctor[];
        setDoctors(uniqueDoctors);
      }
    } catch (err) {
      console.error('Error loading dental records:', err);
      setError(err instanceof Error ? err.message : t('patientDental.loadError'));
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [medicalId, t]);

  const onRefresh = () => {
    if (medicalId) {
      loadEncounters(true);
    }
  };

  const loadEncounterDetail = async (encounterId: string) => {
    try {
      setDetailLoading(true);

      if (!medicalId) return;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-dental-encounters`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ medicalId, encounterId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSelectedEncounter(data);
        setShowDetail(true);
      }
    } catch (err) {
      console.error('Error loading encounter detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    setFilterLoading(true);

    setTimeout(() => {
      let filtered = [...encounters];

      if (selectedDoctor) {
        filtered = filtered.filter(enc => enc.doctor.id === selectedDoctor);
      }

      if (selectedDateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        filtered = filtered.filter(enc => {
          const encDate = new Date(enc.date);
          const encDateOnly = new Date(encDate.getFullYear(), encDate.getMonth(), encDate.getDate());

          switch (selectedDateFilter) {
            case 'today':
              return encDateOnly.getTime() === today.getTime();
            case 'week':
              const weekAgo = new Date(today);
              weekAgo.setDate(weekAgo.getDate() - 7);
              return encDateOnly >= weekAgo && encDateOnly <= today;
            case 'month':
              const monthAgo = new Date(today);
              monthAgo.setMonth(monthAgo.getMonth() - 1);
              return encDateOnly >= monthAgo && encDateOnly <= today;
            case 'year':
              const yearAgo = new Date(today);
              yearAgo.setFullYear(yearAgo.getFullYear() - 1);
              return encDateOnly >= yearAgo && encDateOnly <= today;
            default:
              return true;
          }
        });
      }

      setFilteredEncounters(filtered);
      setFilterLoading(false);
    }, 300);
  }, [encounters, selectedDoctor, selectedDateFilter]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (medicalId) {
      loadEncounters();
    }
  }, [medicalId, loadEncounters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const getDateFilterLabel = (filter: DateFilter): string => {
    switch (filter) {
      case 'all': return t('patientDental.dateAllTime');
      case 'today': return t('patientDental.dateToday');
      case 'week': return t('patientDental.dateLast7');
      case 'month': return t('patientDental.dateLastMonth');
      case 'year': return t('patientDental.dateLastYear');
      default: return t('patientDental.dateAllTime');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#15C2B0';
      case 'in_progress': return '#F59E0B';
      case 'planned': return '#2D7DD2';
      case 'cancelled': return '#FF6F61';
      default: return '#9ca3af';
    }
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BackButton color={colors.text} style={{ marginRight: 8 }} />
            <Text style={styles.title}>{t('patientDental.headerTitle')}</Text>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BackButton color={colors.text} style={{ marginRight: 8 }} />
            <Text style={styles.title}>{t('patientDental.headerTitle')}</Text>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadEncounters()}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <BackButton color={colors.text} style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.title}>{t('patientDental.headerTitle')}</Text>
              <Text style={styles.subtitle}>{t('patientDental.totalEncounters', { count: encounters.length })}</Text>
            </View>
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

      {/* Encounters List */}
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
        {filterLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredEncounters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('patientDental.noDentalRecords')}</Text>
          </View>
        ) : (
          filteredEncounters.map((encounter) => (
            <TouchableOpacity
              key={encounter.id}
              style={styles.encounterCard}
              onPress={() => loadEncounterDetail(encounter.id)}
            >
              <View style={styles.encounterHeader}>
                <View style={styles.doctorInfo}>
                  {encounter.doctor.image ? (
                    <Image source={{ uri: encounter.doctor.image }} style={styles.doctorImage} />
                  ) : (
                    <View style={[styles.doctorImage, styles.doctorImagePlaceholder]}>
                      <User size={20} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.doctorTextInfo}>
                    <Text style={styles.doctorName}>{encounter.doctor.name}</Text>
                    <Text style={styles.encounterDate}>{formatDate(encounter.date)}</Text>
                  </View>
                </View>
                <View style={styles.treatmentsBadge}>
                  <Text style={styles.treatmentsBadgeText}>{t('patientDental.treatmentsBadge', { count: encounter.treatments_count })}</Text>
                </View>
              </View>
              {encounter.notes && (
                <Text style={styles.encounterNotes} numberOfLines={2}>{encounter.notes}</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
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
              <Text style={styles.filterModalTitle}>{t('patientDental.filters')}</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity
                  onPress={() => { setSelectedDoctor(''); setSelectedDateFilter('all'); setOpenDropdown(null); setDoctorSearch(''); }}
                  style={styles.clearFiltersButton}
                >
                  <Text style={styles.clearFiltersButtonText}>{t('patientDental.clearAll')}</Text>
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
              <Text style={styles.filterSectionTitle}>{t('patientDental.doctor')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, openDropdown === 'doctor' && styles.dropdownTriggerOpen]}
                onPress={() => { if (openDropdown === 'doctor') { setOpenDropdown(null); setDoctorSearch(''); } else { setOpenDropdown('doctor'); setDoctorSearch(''); } }}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{selectedDoctor ? (doctors.find(d => d.id === selectedDoctor)?.name || t('patientDental.allDoctors')) : t('patientDental.allDoctors')}</Text>
                <ChevronDown size={18} color={colors.textSecondary} style={{ transform: [{ rotate: openDropdown === 'doctor' ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
              {openDropdown === 'doctor' && (() => {
                const doctorItems = [{ id: '', name: t('patientDental.allDoctors') }, ...doctors.map(d => ({ id: d.id, name: d.name }))]
                  .filter(item => item.id === '' || item.name.toLowerCase().includes(doctorSearch.toLowerCase()));
                return (
                  <View style={styles.dropdownList}>
                    <View style={styles.dropdownSearchRow}>
                      <Search size={15} color={colors.textSecondary} />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder={t('patientDental.searchDoctors')}
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
                          style={[styles.dropdownItem, selectedDoctor === item.id && styles.dropdownItemSelected, index === doctorItems.length - 1 && styles.dropdownItemLast]}
                          onPress={() => { setSelectedDoctor(item.id); setOpenDropdown(null); setDoctorSearch(''); }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dropdownItemText, selectedDoctor === item.id && styles.dropdownItemTextSelected]}>{item.name}</Text>
                          {selectedDoctor === item.id && <View style={styles.dropdownItemCheck} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              })()}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('patientDental.dateRange')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, openDropdown === 'date' && styles.dropdownTriggerOpen]}
                onPress={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{getDateFilterLabel(selectedDateFilter)}</Text>
                <ChevronDown size={18} color={colors.textSecondary} style={{ transform: [{ rotate: openDropdown === 'date' ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
              {openDropdown === 'date' && (
                <View style={styles.dropdownList}>
                  {[
                    { value: 'all', label: t('patientDental.dateAllTime') },
                    { value: 'today', label: t('patientDental.dateToday') },
                    { value: 'week', label: t('patientDental.dateLast7') },
                    { value: 'month', label: t('patientDental.dateLastMonth') },
                    { value: 'year', label: t('patientDental.dateLastYear') },
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
                style={styles.applyFiltersButton}
                onPress={() => { setOpenDropdown(null); setShowFilterModal(false); }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#56C6C8', '#69C7F0']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={styles.applyFiltersButtonText}>{t('patientDental.applyFilters')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('patientDental.dentalEncounter')}</Text>
            <TouchableOpacity onPress={() => setShowDetail(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {detailLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : selectedEncounter ? (
            <ScrollView style={styles.modalContent}>
              {/* Encounter Info */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>{t('patientDental.encounterInformation')}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('patientDental.dateLabel')}</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedEncounter.encounter.date)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('patientDental.doctorLabel')}</Text>
                  <Text style={styles.infoValue}>{selectedEncounter.encounter.doctor.name}</Text>
                </View>
                {selectedEncounter.encounter.notes && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('patientDental.notesLabel')}</Text>
                    <Text style={styles.infoValue}>{selectedEncounter.encounter.notes}</Text>
                  </View>
                )}
              </View>

              {/* Treatments */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>{t('patientDental.treatmentsCount', { count: selectedEncounter.total_treatments })}</Text>
                {selectedEncounter.treatments.map((treatment) => (
                  <View key={treatment.id} style={styles.treatmentCard}>
                    <View style={styles.treatmentHeader}>
                      {treatment.tooth_image && (
                        <Image source={{ uri: treatment.tooth_image }} style={styles.toothImage} />
                      )}
                      <View style={styles.treatmentHeaderInfo}>
                        <Text style={styles.toothName}>{t('patientDental.toothLabel', { number: treatment.tooth_number, name: treatment.tooth_name })}</Text>
                        <Text style={styles.toothPosition}>
                          {t('patientDental.toothPosition', { arch: treatment.tooth_arch, position: treatment.tooth_position })}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(treatment.status) }]}>
                        <Text style={styles.statusText}>{t(`patientDental.status_${treatment.status.toLowerCase()}`, { defaultValue: treatment.status })}</Text>
                      </View>
                    </View>

                    <View style={styles.treatmentBody}>
                      <View style={styles.treatmentRow}>
                        <Text style={styles.treatmentLabel}>{t('patientDental.serviceLabel')}</Text>
                        <Text style={styles.treatmentValue}>{treatment.service_name}</Text>
                      </View>
                      {treatment.service_description && (
                        <View style={styles.treatmentRow}>
                          <Text style={styles.treatmentLabel}>{t('patientDental.descriptionLabel')}</Text>
                          <Text style={styles.treatmentValue}>{treatment.service_description}</Text>
                        </View>
                      )}
                      <View style={styles.treatmentRow}>
                        <Text style={styles.treatmentLabel}>{t('patientDental.diagnosisLabel')}</Text>
                        <Text style={styles.treatmentValue}>{treatment.diagnosis}</Text>
                      </View>
                      <View style={styles.treatmentRow}>
                        <Text style={styles.treatmentLabel}>{t('patientDental.treatmentLabel')}</Text>
                        <Text style={styles.treatmentValue}>{treatment.treatment}</Text>
                      </View>
                      {treatment.notes && (
                        <View style={styles.treatmentRow}>
                          <Text style={styles.treatmentLabel}>{t('patientDental.notesLabel')}</Text>
                          <Text style={styles.treatmentValue}>{treatment.notes}</Text>
                        </View>
                      )}
                      <View style={styles.treatmentRow}>
                        <Text style={styles.treatmentLabel}>{t('patientDental.dateLabel')}</Text>
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
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
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
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  encounterCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  encounterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  doctorImagePlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorTextInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    marginBottom: 4,
  },
  encounterDate: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  treatmentsBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  treatmentsBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
  encounterNotes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.card,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: colors.text,
  },
  treatmentCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    marginBottom: 2,
  },
  toothPosition: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
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
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    width: 100,
  },
  treatmentValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  filterModalContent: {
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
  filterModalHeader: {
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
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersButtonText: {
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
  applyFiltersButton: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  applyFiltersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

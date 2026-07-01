import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { User, Building2, FileText, ArrowLeft, ChevronDown, Search, X } from 'lucide-react-native';
import { config } from '@/utils/config';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getSession } from '@/utils/auth';

interface DoctorSummary {
  doctor_id: string;
  doctor_name: string;
  doctor_image?: string;
  total_charges: number;
  total_paid: number;
  total_balance: number;
  invoice_count: number;
}

interface ClinicSummary {
  clinic_id: string;
  clinic_name: string;
  total_charges: number;
  total_paid: number;
  total_balance: number;
  invoice_count: number;
}

interface Summary {
  total_charges: number;
  total_paid: number;
  total_balance: number;
  total_invoices: number;
  paid_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
}

interface StatementData {
  success: boolean;
  summary: Summary;
  by_doctor: DoctorSummary[];
  by_clinic: ClinicSummary[];
  invoices: any[];
}

export default function StatementScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [data, setData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'doctor' | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');

  const loadStatement = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const session = await getSession();
      if (!session) {
        setError(t('statement.noSession'));
        return;
      }

      const medicalId = session.patient?.medical_id;

      if (!medicalId) {
        setError(t('statement.noMedicalId'));
        return;
      }

      const apiUrl = `${config.supabaseUrl}/functions/v1/mobile-get-patient-statement`;

      const requestBody: any = { medicalId };
      if (selectedDoctor) {
        requestBody.doctor_id = selectedDoctor;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      if (!response.ok) {
        // A 404 ("Patient not found") means this medical ID simply has no
        // billing records yet (never registered at a clinic / no invoices) —
        // show the friendly empty state instead of a red error + Retry.
        if (response.status === 404) {
          setData({
            success: true,
            summary: {
              total_charges: 0,
              total_paid: 0,
              total_balance: 0,
              total_invoices: 0,
              paid_invoices: 0,
              pending_invoices: 0,
              overdue_invoices: 0,
            },
            by_doctor: [],
            by_clinic: [],
            invoices: [],
          });
          return;
        }
        throw new Error(responseData.error || t('statement.failedToLoad'));
      }

      if (responseData.success) {
        setData(responseData);
        if (!selectedDoctor) {
          setDoctors(responseData.by_doctor || []);
        }
      } else {
        setError(responseData.error || t('statement.failedToLoad'));
      }
    } catch (err) {
      console.error('Error loading statement:', err);
      setError(err instanceof Error ? err.message : t('statement.failedToLoad'));
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [selectedDoctor, t]);

  useEffect(() => {
    loadStatement();
  }, [loadStatement]);

  const onRefresh = () => {
    loadStatement(true);
  };

  const clearFilters = () => {
    setSelectedDoctor('');
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const styles = createStyles(colors);

  if (loading) {
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
          <Text style={styles.title}>{t('statement.title')}</Text>
          <View style={styles.headerSpacer} />
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('statement.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadStatement()}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return null;
  }

  const hasNoData = data.summary.total_invoices === 0;

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
        <Text style={styles.title}>{t('statement.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      {hasNoData ? (
        <View style={styles.centerContainer}>
          <FileText size={64} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={styles.noDataTitle}>{t('statement.noRecordsTitle')}</Text>
          <Text style={styles.noDataText}>{t('statement.noRecordsText')}</Text>
        </View>
      ) : (
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
        {/* Overall Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>{t('statement.overallSummary')}</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('statement.totalCharges')}</Text>
                <Text style={styles.summaryValue}>{formatCurrency(data.summary.total_charges)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('statement.totalPaid')}</Text>
                <Text style={[styles.summaryValue, { color: '#15C2B0' }]}>
                  {formatCurrency(data.summary.total_paid)}
                </Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('statement.totalBalance')}</Text>
                <Text style={[styles.summaryValue, { color: '#FF6F61' }]}>
                  {formatCurrency(data.summary.total_balance)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('statement.totalInvoices')}</Text>
                <Text style={styles.summaryValue}>{data.summary.total_invoices}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.invoiceStatusRow}>
              <View style={styles.invoiceStatusItem}>
                <View style={[styles.statusDot, { backgroundColor: '#15C2B0' }]} />
                <Text style={styles.invoiceStatusLabel}>{t('statement.statusPaid', { count: data.summary.paid_invoices })}</Text>
              </View>
              <View style={styles.invoiceStatusItem}>
                <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.invoiceStatusLabel}>{t('statement.statusPending', { count: data.summary.pending_invoices })}</Text>
              </View>
              <View style={styles.invoiceStatusItem}>
                <View style={[styles.statusDot, { backgroundColor: '#FF6F61' }]} />
                <Text style={styles.invoiceStatusLabel}>{t('statement.statusOverdue', { count: data.summary.overdue_invoices })}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* View Detailed Invoices Button */}
        <TouchableOpacity
          style={styles.viewInvoicesButton}
          onPress={() => router.push('/(tabs)/invoices')}
          activeOpacity={0.9}
        >
          <LinearGradient colors={['#2D7DD2', '#15C2B0', '#FF6F61']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <FileText size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.viewInvoicesButtonText}>{t('statement.viewDetailedInvoices')}</Text>
        </TouchableOpacity>

        {/* By Doctor */}
        {data.by_doctor && data.by_doctor.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('statement.byDoctor')}</Text>
            {data.by_doctor.map((doctor) => (
              <View key={doctor.doctor_id} style={styles.doctorCard}>
                <View style={styles.doctorHeader}>
                  <View style={styles.doctorInfo}>
                    {doctor.doctor_image ? (
                      <Image source={{ uri: doctor.doctor_image }} style={styles.doctorImage} />
                    ) : (
                      <View style={[styles.doctorImage, styles.doctorImagePlaceholder]}>
                        <User size={20} color={colors.textTertiary} />
                      </View>
                    )}
                    <View style={styles.doctorDetails}>
                      <Text style={styles.doctorName}>{doctor.doctor_name}</Text>
                      <Text style={styles.invoiceCount}>{t('statement.invoiceCount', { count: doctor.invoice_count })}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.doctorStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t('statement.charges')}</Text>
                    <Text style={styles.statValue}>{formatCurrency(doctor.total_charges)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t('statement.paid')}</Text>
                    <Text style={[styles.statValue, { color: '#15C2B0' }]}>
                      {formatCurrency(doctor.total_paid)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t('statement.balance')}</Text>
                    <Text style={[styles.statValue, { color: '#FF6F61' }]}>
                      {formatCurrency(doctor.total_balance)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* By Clinic */}
        {data.by_clinic && data.by_clinic.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('statement.byClinic')}</Text>
            {data.by_clinic.map((clinic) => (
              <View key={clinic.clinic_id} style={styles.clinicCard}>
                <View style={styles.clinicHeader}>
                  <View style={styles.clinicIconContainer}>
                    <Building2 size={24} color={colors.primary} />
                  </View>
                  <View style={styles.clinicDetails}>
                    <Text style={styles.clinicName}>{clinic.clinic_name}</Text>
                    <Text style={styles.invoiceCount}>{t('statement.invoiceCount', { count: clinic.invoice_count })}</Text>
                  </View>
                </View>
                <View style={styles.clinicStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t('statement.charges')}</Text>
                    <Text style={styles.statValue}>{formatCurrency(clinic.total_charges)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t('statement.paid')}</Text>
                    <Text style={[styles.statValue, { color: '#15C2B0' }]}>
                      {formatCurrency(clinic.total_paid)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t('statement.balance')}</Text>
                    <Text style={[styles.statValue, { color: '#FF6F61' }]}>
                      {formatCurrency(clinic.total_balance)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="fade"
        transparent={true}
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
              <Text style={styles.filterModalTitle}>{t('statement.filters')}</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity
                  onPress={() => { clearFilters(); setOpenDropdown(null); setDoctorSearch(''); }}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>{t('statement.clearAll')}</Text>
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
              <Text style={styles.filterSectionTitle}>{t('statement.doctorLabel')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, openDropdown === 'doctor' && styles.dropdownTriggerOpen]}
                onPress={() => { if (openDropdown === 'doctor') { setOpenDropdown(null); setDoctorSearch(''); } else { setOpenDropdown('doctor'); setDoctorSearch(''); } }}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{selectedDoctor ? (doctors.find(d => d.doctor_id === selectedDoctor)?.doctor_name || t('statement.allDoctors')) : t('statement.allDoctors')}</Text>
                <ChevronDown size={18} color={colors.textSecondary} style={{ transform: [{ rotate: openDropdown === 'doctor' ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
              {openDropdown === 'doctor' && (() => {
                const doctorItems = [{ doctor_id: '', doctor_name: t('statement.allDoctors') }, ...doctors]
                  .filter(item => item.doctor_id === '' || item.doctor_name.toLowerCase().includes(doctorSearch.toLowerCase()));
                return (
                  <View style={styles.dropdownList}>
                    <View style={styles.dropdownSearchRow}>
                      <Search size={15} color={colors.textSecondary} />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder={t('statement.searchDoctors')}
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
                          key={item.doctor_id || 'all'}
                          style={[styles.dropdownItem, selectedDoctor === item.doctor_id && styles.dropdownItemSelected, index === doctorItems.length - 1 && styles.dropdownItemLast]}
                          onPress={() => { setSelectedDoctor(item.doctor_id); setOpenDropdown(null); setDoctorSearch(''); }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dropdownItemText, selectedDoctor === item.doctor_id && styles.dropdownItemTextSelected]}>{item.doctor_name}</Text>
                          {selectedDoctor === item.doctor_id && <View style={styles.dropdownItemCheck} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              })()}
            </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => { setOpenDropdown(null); setShowFilterModal(false); }}
                activeOpacity={0.8}
              >
                <Text style={styles.applyButtonText}>{t('statement.applyFilters')}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  noDataTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summarySection: {
    marginBottom: 16,
  },
  viewInvoicesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 8,
  },
  viewInvoicesButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  invoiceStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  invoiceStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  invoiceStatusLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.text,
  },
  doctorCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doctorHeader: {
    marginBottom: 16,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  doctorImagePlaceholder: {
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    marginBottom: 4,
  },
  invoiceCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  doctorStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  clinicCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clinicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clinicIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clinicDetails: {
    flex: 1,
  },
  clinicName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    marginBottom: 4,
  },
  clinicStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
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
    backgroundColor: colors.primary,
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

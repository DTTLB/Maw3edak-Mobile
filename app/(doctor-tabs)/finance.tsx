import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft, TrendingUp, DollarSign, FileText, Receipt, Wallet,
  ChevronDown, Check, CircleAlert as AlertCircle, User, X,
  Package, Pill, Stethoscope, CreditCard, Calendar,
  ChevronRight, Search,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { config } from '@/utils/config';
import { useAuth } from '@/contexts/AuthContext';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DateFilter = 'today' | 'last7days' | 'alltime';

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
}

interface FinanceSummary {
  totalRevenue: number;
  totalPaid: number;
  totalUnpaid: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
}

interface Transaction {
  id: string;
  patientName: string;
  medicalId: string;
  amount: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  date: string;
  invoiceNumber: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface InvoicePayment {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  notes: string;
}

interface InvoiceDetail {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  payment_status: string;
  status: string;
  notes: string;
  patient_name: string;
  patient_medical_id: string;
  patient_phone: string;
  doctor_name: string;
  doctor_specialization: string;
}

const DATE_FILTERS: { key: DateFilter; labelKey: string }[] = [
  { key: 'today', labelKey: 'finance.dateToday' },
  { key: 'last7days', labelKey: 'finance.dateLast7Days' },
  { key: 'alltime', labelKey: 'finance.dateAllTime' },
];

export default function FinanceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [summary, setSummary] = useState<FinanceSummary>({
    totalRevenue: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('alltime');
  const [showDoctorModal, setShowDoctorModal] = useState(false);
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

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [invoicePayments, setInvoicePayments] = useState<InvoicePayment[]>([]);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Keep the latest filter selections in refs so loadFinanceData can read them
  // without becoming a new function identity on every filter change (which would
  // otherwise re-trigger the focus effect and reset the filters).
  const selectedDoctorRef = useRef(selectedDoctor);
  const selectedDateFilterRef = useRef(selectedDateFilter);
  useEffect(() => { selectedDoctorRef.current = selectedDoctor; }, [selectedDoctor]);
  useEffect(() => { selectedDateFilterRef.current = selectedDateFilter; }, [selectedDateFilter]);

  // Doctors the logged-in user has access to (includes themselves). The finance
  // view is scoped to this set server-side; this list only powers the filter.
  const loadDoctors = useCallback(async () => {
    try {
      setLoadingDoctors(true);
      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;
      if (!globalId) return;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-accessible-doctors?global_id=${globalId}${companyId ? `&company_id=${companyId}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
      }
    } catch (err) {
      console.error('Error loading doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  }, [session?.user?.global_id, session?.user?.company_id]);

  const loadFinanceData = useCallback(async (doctorFilter?: Doctor | null, dateFilter?: DateFilter) => {
    try {
      setLoading(true);
      setError(null);

      const companyId = session?.user?.company_id;
      const globalId = session?.user?.global_id;
      if (!companyId || !globalId) {
        setError(t('finance.noCompanyAssociated'));
        return;
      }

      const doctor = doctorFilter !== undefined ? doctorFilter : selectedDoctorRef.current;
      const date = dateFilter !== undefined ? dateFilter : selectedDateFilterRef.current;

      let url = `${config.supabaseUrl}/functions/v1/mobile-get-finance-summary?company_id=${companyId}&global_id=${globalId}&date_filter=${date}`;
      if (doctor?.id) {
        url += `&doctor_id=${doctor.id}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch finance data');

      const data = await response.json();

      setSummary({
        totalRevenue: data.summary?.totalRevenue ?? 0,
        totalPaid: data.summary?.totalPaid ?? 0,
        totalUnpaid: data.summary?.totalOutstanding ?? 0,
        totalInvoices: data.summary?.totalInvoices ?? 0,
        paidInvoices: data.summary?.paidInvoices ?? 0,
        unpaidInvoices: data.summary?.unpaidInvoices ?? 0,
      });

      setRecentTransactions(
        (data.transactions || []).map((tx: any) => ({
          id: tx.id,
          patientName: tx.patient_name,
          medicalId: tx.medical_id || '',
          amount: tx.total_amount,
          paidAmount: tx.paid_amount,
          balanceDue: tx.balance_due,
          status: tx.payment_status,
          date: tx.invoice_date,
          invoiceNumber: tx.invoice_number,
        }))
      );
    } catch (err) {
      console.error('Error loading finance data:', err);
      setError(t('finance.failedToLoadFinanceData'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.company_id, session?.user?.global_id, t]);

  useFocusEffect(
    useCallback(() => {
      loadDoctors();
      loadFinanceData(null, 'alltime');
    }, [loadDoctors, loadFinanceData])
  );

  const loadInvoiceDetail = async (invoiceId: string) => {
    try {
      setLoadingInvoice(true);
      setShowInvoiceModal(true);
      setInvoiceDetail(null);
      setInvoiceItems([]);
      setInvoicePayments([]);

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-invoice-detail?invoice_id=${invoiceId}`,
        {
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch invoice details');

      const data = await response.json();
      setInvoiceDetail(data.invoice);
      setInvoiceItems(data.items || []);
      setInvoicePayments(data.payments || []);
    } catch (err) {
      console.error('Error loading invoice detail:', err);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFinanceData();
  };

  const handleDoctorSelect = (doctor: Doctor | null) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(false);
    setDoctorSearchQuery('');
    loadFinanceData(doctor, selectedDateFilter);
  };

  const handleDateFilterChange = (filter: DateFilter) => {
    setSelectedDateFilter(filter);
    loadFinanceData(selectedDoctor, filter);
  };

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'paid': return '#15C2B0';
      case 'partial': return '#2D7DD2';
      case 'unpaid':
      case 'pending': return '#F59E0B';
      case 'overpaid': return '#2D7DD2';
      case 'cancelled':
      case 'canceled': return '#FF6F61';
      default: return '#6B7280';
    }
  };

  const getStatusBg = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'paid': return '#E4F8F4';
      case 'partial': return '#EAF3FC';
      case 'unpaid':
      case 'pending': return '#FEF3C7';
      case 'overpaid': return '#EAF3FC';
      case 'cancelled':
      case 'canceled': return '#FFEDEB';
      default: return '#F3F4F6';
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch ((type || '').toLowerCase()) {
      case 'package': return <Package size={16} color="#2D7DD2" strokeWidth={2} />;
      case 'material':
      case 'medical_material': return <Pill size={16} color="#15C2B0" strokeWidth={2} />;
      default: return <Stethoscope size={16} color="#F59E0B" strokeWidth={2} />;
    }
  };

  const getItemTypeBg = (type: string) => {
    switch ((type || '').toLowerCase()) {
      case 'package': return '#EAF3FC';
      case 'material':
      case 'medical_material': return '#E4F8F4';
      default: return '#FEF3C7';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch ((method || '').toLowerCase()) {
      case 'cash': return t('finance.paymentMethodCash');
      case 'card':
      case 'credit_card': return t('finance.paymentMethodCard');
      case 'bank_transfer': return t('finance.paymentMethodBankTransfer');
      case 'check': return t('finance.paymentMethodCheck');
      case 'insurance': return t('finance.paymentMethodInsurance');
      default: return method || t('finance.paymentMethodCash');
    }
  };

  const getStatusLabel = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'paid': return t('finance.statusPaid');
      case 'partial': return t('finance.statusPartial');
      case 'unpaid': return t('finance.statusUnpaid');
      case 'pending': return t('finance.statusPending');
      case 'overpaid': return t('finance.statusOverpaid');
      case 'cancelled':
      case 'canceled': return t('finance.statusCancelled');
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : status;
    }
  };

  const styles = useMemo(() => makeStyles(colors, P), [colors, P]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('finance.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={40} color={colors.error} strokeWidth={1.5} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => loadFinanceData()}
            >
              <Text style={styles.retryButtonText}>{t('finance.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.revenueCard, { backgroundColor: colors.primary }]}>
              <View style={styles.revenueCardHeader}>
                <Text style={styles.revenueLabel}>{t('finance.totalRevenue')}</Text>
                <View style={styles.revenueBadge}>
                  <TrendingUp size={14} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.revenueBadgeText}>
                    {(() => {
                      const f = DATE_FILTERS.find(f => f.key === selectedDateFilter);
                      return f ? t(f.labelKey) : '';
                    })()}
                  </Text>
                </View>
              </View>
              <Text style={styles.revenueAmount}>{formatCurrency(summary.totalRevenue)}</Text>
              <View style={styles.revenueRow}>
                <View style={styles.revenueItem}>
                  <View style={[styles.revenueDot, { backgroundColor: '#7FE6DA' }]} />
                  <Text style={styles.revenueItemLabel}>{t('finance.collected')}</Text>
                  <Text style={styles.revenueItemValue}>{formatCurrency(summary.totalPaid)}</Text>
                </View>
                <View style={styles.revenueDivider} />
                <View style={styles.revenueItem}>
                  <View style={[styles.revenueDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.revenueItemLabel}>{t('finance.outstanding')}</Text>
                  <Text style={styles.revenueItemValue}>{formatCurrency(summary.totalUnpaid)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                <View style={[styles.statBoxIcon, { backgroundColor: '#E4F8F4' }]}>
                  <Receipt size={20} color="#15C2B0" strokeWidth={2} />
                </View>
                <Text style={[styles.statBoxValue, { color: colors.text }]}>{summary.paidInvoices}</Text>
                <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>{t('finance.statPaid')}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                <View style={[styles.statBoxIcon, { backgroundColor: '#FFEDEB' }]}>
                  <FileText size={20} color="#FF6F61" strokeWidth={2} />
                </View>
                <Text style={[styles.statBoxValue, { color: colors.text }]}>{summary.unpaidInvoices}</Text>
                <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>{t('finance.statUnpaid')}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                <View style={[styles.statBoxIcon, { backgroundColor: '#EAF3FC' }]}>
                  <Wallet size={20} color="#2D7DD2" strokeWidth={2} />
                </View>
                <Text style={[styles.statBoxValue, { color: colors.text }]}>{summary.totalInvoices}</Text>
                <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>{t('finance.statTotal')}</Text>
              </View>
            </View>

            <View style={styles.filtersSection}>
              <Text style={[styles.filtersSectionTitle, { color: colors.textSecondary }]}>{t('finance.filters')}</Text>

              <TouchableOpacity
                style={[styles.doctorFilterButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowDoctorModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.doctorFilterLeft}>
                  <View style={[styles.doctorFilterIconBg, { backgroundColor: '#EAF3FC' }]}>
                    <User size={18} color="#2D7DD2" strokeWidth={2} />
                  </View>
                  <View style={styles.doctorFilterTextBlock}>
                    <Text style={[styles.doctorFilterLabel, { color: colors.textTertiary }]}>{t('finance.doctorLabel')}</Text>
                    <Text
                      style={[styles.doctorFilterValue, { color: selectedDoctor ? colors.text : colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {selectedDoctor ? t('finance.doctorName', { name: selectedDoctor.name }) : t('finance.allDoctors')}
                    </Text>
                  </View>
                </View>
                <ChevronDown size={18} color={colors.textTertiary} strokeWidth={2} />
              </TouchableOpacity>

              <View style={styles.dateFiltersRow}>
                {DATE_FILTERS.map((filter) => {
                  const active = selectedDateFilter === filter.key;
                  return (
                    <TouchableOpacity
                      key={filter.key}
                      style={[
                        styles.dateFilterChip,
                        active
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                      ]}
                      onPress={() => handleDateFilterChange(filter.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dateFilterChipText,
                          { color: active ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {t(filter.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : recentTransactions.length > 0 ? (
              <View style={styles.transactionsSection}>
                <Text style={[styles.filtersSectionTitle, { color: colors.textSecondary }]}>
                  {t('finance.transactions')}
                </Text>
                <View style={[styles.transactionsList, { backgroundColor: colors.card }]}>
                  {recentTransactions.map((tx, index) => (
                    <TouchableOpacity
                      key={tx.id}
                      style={[
                        styles.transactionItem,
                        index < recentTransactions.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        },
                      ]}
                      onPress={() => loadInvoiceDetail(tx.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.transactionLeft}>
                        <View style={[styles.transactionIcon, { backgroundColor: getStatusBg(tx.status) }]}>
                          <Receipt size={18} color={getStatusColor(tx.status)} strokeWidth={2} />
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={[styles.transactionName, { color: colors.text }]} numberOfLines={1}>
                            {tx.patientName}
                          </Text>
                          <Text style={[styles.transactionDate, { color: colors.textTertiary }]}>
                            {t('finance.transactionMeta', { invoiceNumber: tx.invoiceNumber, date: formatDate(tx.date) })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text style={[styles.transactionAmount, { color: colors.text }]}>
                          {formatCurrency(tx.amount)}
                        </Text>
                        <View style={[styles.transactionStatusBadge, { backgroundColor: getStatusBg(tx.status) }]}>
                          <Text style={[styles.transactionStatusText, { color: getStatusColor(tx.status) }]}>
                            {getStatusLabel(tx.status)}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <DollarSign size={48} color={colors.border} strokeWidth={1.5} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>{t('finance.noTransactionsTitle')}</Text>
                <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                  {selectedDoctor
                    ? t('finance.noDataForDoctor', { name: selectedDoctor.name })
                    : t('finance.noDataDefault')}
                </Text>
              </View>
            )}

            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>

      {/* Doctor Filter Modal */}
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
              style={[styles.modalSheet, { backgroundColor: colors.card }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHandle} />
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('finance.selectDoctor')}</Text>
                <TouchableOpacity onPress={() => {
                  setShowDoctorModal(false);
                  setDoctorSearchQuery('');
                }}>
                  <Text style={[styles.modalDone, { color: colors.primary }]}>{t('finance.done')}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.modalSearchContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <Search size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.modalSearchInput, { color: colors.text }]}
                  placeholder={t('finance.searchDoctors')}
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
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                {!doctorSearchQuery.trim() && (
                  <TouchableOpacity
                    style={[
                      styles.doctorOption,
                      { borderBottomColor: colors.border },
                      !selectedDoctor && { backgroundColor: colors.backgroundSecondary },
                    ]}
                    onPress={() => handleDoctorSelect(null)}
                  >
                    <View style={styles.doctorOptionLeft}>
                      <View style={[styles.doctorOptionAvatar, { backgroundColor: '#EAF3FC' }]}>
                        <User size={20} color="#2D7DD2" strokeWidth={2} />
                      </View>
                      <View>
                        <Text style={[styles.doctorOptionName, { color: colors.text }]}>{t('finance.allDoctors')}</Text>
                        <Text style={[styles.doctorOptionSpec, { color: colors.textSecondary }]}>
                          {t('finance.allDoctorsSubtitle')}
                        </Text>
                      </View>
                    </View>
                    {!selectedDoctor && (
                      <Check size={20} color={colors.primary} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                )}

                {loadingDoctors ? (
                  <View style={styles.modalLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : filteredDoctors.length === 0 ? (
                  <View style={styles.modalLoading}>
                    <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                      {doctorSearchQuery ? t('finance.noMatchingDoctors') : t('finance.noDoctorsFound')}
                    </Text>
                  </View>
                ) : (
                  filteredDoctors.map((doctor) => {
                    const active = selectedDoctor?.id === doctor.id;
                    return (
                      <TouchableOpacity
                        key={doctor.id}
                        style={[
                          styles.doctorOption,
                          { borderBottomColor: colors.border },
                          active && { backgroundColor: colors.backgroundSecondary },
                        ]}
                        onPress={() => handleDoctorSelect(doctor)}
                      >
                        <View style={styles.doctorOptionLeft}>
                          <View style={[styles.doctorOptionAvatar, { backgroundColor: active ? '#EAF3FC' : colors.backgroundSecondary }]}>
                            <Text style={[styles.doctorOptionInitial, { color: active ? '#2D7DD2' : colors.textSecondary }]}>
                              {doctor.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View>
                            <Text style={[styles.doctorOptionName, { color: colors.text }]}>
                              {t('finance.doctorName', { name: doctor.name })}
                            </Text>
                            {doctor.specialization && (
                              <Text style={[styles.doctorOptionSpec, { color: colors.textSecondary }]}>
                                {doctor.specialization}
                              </Text>
                            )}
                          </View>
                        </View>
                        {active && (
                          <Check size={20} color={colors.primary} strokeWidth={2.5} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        visible={showInvoiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.invoiceModalOverlay}>
          <View style={[styles.invoiceModalSheet, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.invoiceModalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <View style={styles.invoiceModalHandle} />
              <View style={styles.invoiceModalHeaderRow}>
                <View style={styles.invoiceModalHeaderLeft}>
                  <Text style={[styles.invoiceModalTitle, { color: colors.text }]}>
                    {invoiceDetail?.invoice_number || t('finance.invoice')}
                  </Text>
                  {invoiceDetail && (
                    <View style={[styles.invoiceStatusBadge, { backgroundColor: getStatusBg(invoiceDetail.payment_status) }]}>
                      <Text style={[styles.invoiceStatusText, { color: getStatusColor(invoiceDetail.payment_status) }]}>
                        {getStatusLabel(invoiceDetail.payment_status)}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.invoiceCloseBtn, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => setShowInvoiceModal(false)}
                >
                  <X size={20} color={colors.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            {loadingInvoice ? (
              <View style={styles.invoiceLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : invoiceDetail ? (
              <ScrollView
                style={styles.invoiceScrollView}
                contentContainerStyle={styles.invoiceScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Patient & Doctor Info */}
                <View style={[styles.invoiceInfoCard, { backgroundColor: colors.card }]}>
                  <View style={styles.invoiceInfoRow}>
                    <View style={[styles.invoiceInfoIcon, { backgroundColor: '#EAF3FC' }]}>
                      <User size={18} color="#2D7DD2" strokeWidth={2} />
                    </View>
                    <View style={styles.invoiceInfoText}>
                      <Text style={[styles.invoiceInfoLabel, { color: colors.textTertiary }]}>{t('finance.patient')}</Text>
                      <Text style={[styles.invoiceInfoValue, { color: colors.text }]}>{invoiceDetail.patient_name}</Text>
                      {invoiceDetail.patient_medical_id ? (
                        <Text style={[styles.invoiceInfoSub, { color: colors.textSecondary }]}>
                          {t('finance.patientId', { id: invoiceDetail.patient_medical_id })}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {invoiceDetail.doctor_name ? (
                    <View style={[styles.invoiceInfoRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, marginTop: 2 }]}>
                      <View style={[styles.invoiceInfoIcon, { backgroundColor: '#E4F8F4' }]}>
                        <Stethoscope size={18} color="#15C2B0" strokeWidth={2} />
                      </View>
                      <View style={styles.invoiceInfoText}>
                        <Text style={[styles.invoiceInfoLabel, { color: colors.textTertiary }]}>{t('finance.doctorLabel')}</Text>
                        <Text style={[styles.invoiceInfoValue, { color: colors.text }]}>{t('finance.doctorName', { name: invoiceDetail.doctor_name })}</Text>
                        {invoiceDetail.doctor_specialization ? (
                          <Text style={[styles.invoiceInfoSub, { color: colors.textSecondary }]}>{invoiceDetail.doctor_specialization}</Text>
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                  <View style={[styles.invoiceInfoRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, marginTop: 2 }]}>
                    <View style={[styles.invoiceInfoIcon, { backgroundColor: '#EAF3FC' }]}>
                      <Calendar size={18} color="#2D7DD2" strokeWidth={2} />
                    </View>
                    <View style={styles.invoiceInfoText}>
                      <Text style={[styles.invoiceInfoLabel, { color: colors.textTertiary }]}>{t('finance.invoiceDate')}</Text>
                      <Text style={[styles.invoiceInfoValue, { color: colors.text }]}>{formatDate(invoiceDetail.invoice_date)}</Text>
                    </View>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.invoiceSection}>
                  <Text style={[styles.invoiceSectionTitle, { color: colors.textSecondary }]}>{t('finance.items')}</Text>
                  <View style={[styles.invoiceItemsCard, { backgroundColor: colors.card }]}>
                    {invoiceItems.length === 0 ? (
                      <Text style={[styles.invoiceEmptyText, { color: colors.textSecondary }]}>{t('finance.noItemsFound')}</Text>
                    ) : (
                      invoiceItems.map((item, index) => (
                        <View
                          key={item.id}
                          style={[
                            styles.invoiceItemRow,
                            index < invoiceItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                          ]}
                        >
                          <View style={[styles.invoiceItemTypeIcon, { backgroundColor: getItemTypeBg(item.item_type) }]}>
                            {getItemTypeIcon(item.item_type)}
                          </View>
                          <View style={styles.invoiceItemInfo}>
                            <Text style={[styles.invoiceItemName, { color: colors.text }]} numberOfLines={2}>
                              {item.description}
                            </Text>
                            <Text style={[styles.invoiceItemQty, { color: colors.textSecondary }]}>
                              {t('finance.itemQuantity', { quantity: item.quantity, price: formatCurrency(item.unit_price) })}
                            </Text>
                          </View>
                          <Text style={[styles.invoiceItemTotal, { color: colors.text }]}>
                            {formatCurrency(item.line_total)}
                          </Text>
                        </View>
                      ))
                    )}

                    <View style={[styles.invoiceTotalsBlock, { borderTopColor: colors.border }]}>
                      <View style={styles.invoiceTotalRow}>
                        <Text style={[styles.invoiceTotalLabel, { color: colors.textSecondary }]}>{t('finance.subtotal')}</Text>
                        <Text style={[styles.invoiceTotalValue, { color: colors.text }]}>
                          {formatCurrency(invoiceDetail.total_amount)}
                        </Text>
                      </View>
                      <View style={styles.invoiceTotalRow}>
                        <Text style={[styles.invoiceTotalLabel, { color: '#15C2B0' }]}>{t('finance.paid')}</Text>
                        <Text style={[styles.invoiceTotalValue, { color: '#15C2B0' }]}>
                          -{formatCurrency(invoiceDetail.paid_amount)}
                        </Text>
                      </View>
                      <View style={[styles.invoiceTotalRow, styles.invoiceGrandTotal]}>
                        <Text style={[styles.invoiceGrandLabel, { color: colors.text }]}>{t('finance.balanceDue')}</Text>
                        <Text style={[
                          styles.invoiceGrandValue,
                          { color: invoiceDetail.balance_due <= 0 ? '#15C2B0' : '#FF6F61' },
                        ]}>
                          {formatCurrency(Math.max(0, invoiceDetail.balance_due))}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Payment History */}
                {invoicePayments.length > 0 && (
                  <View style={styles.invoiceSection}>
                    <Text style={[styles.invoiceSectionTitle, { color: colors.textSecondary }]}>{t('finance.paymentHistory')}</Text>
                    <View style={[styles.invoiceItemsCard, { backgroundColor: colors.card }]}>
                      {invoicePayments.map((payment, index) => (
                        <View
                          key={payment.id}
                          style={[
                            styles.invoicePaymentRow,
                            index < invoicePayments.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                          ]}
                        >
                          <View style={[styles.invoiceItemTypeIcon, { backgroundColor: '#E4F8F4' }]}>
                            <CreditCard size={16} color="#15C2B0" strokeWidth={2} />
                          </View>
                          <View style={styles.invoiceItemInfo}>
                            <Text style={[styles.invoiceItemName, { color: colors.text }]}>
                              {getPaymentMethodLabel(payment.payment_method)}
                            </Text>
                            <Text style={[styles.invoiceItemQty, { color: colors.textSecondary }]}>
                              {payment.reference_number
                                ? t('finance.paymentReference', { date: formatDate(payment.payment_date), reference: payment.reference_number })
                                : formatDate(payment.payment_date)}
                            </Text>
                          </View>
                          <Text style={[styles.invoiceItemTotal, { color: '#15C2B0' }]}>
                            {formatCurrency(payment.amount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Notes */}
                {invoiceDetail.notes ? (
                  <View style={styles.invoiceSection}>
                    <Text style={[styles.invoiceSectionTitle, { color: colors.textSecondary }]}>{t('finance.notes')}</Text>
                    <View style={[styles.invoiceNotesCard, { backgroundColor: colors.card }]}>
                      <Text style={[styles.invoiceNotesText, { color: colors.textSecondary }]}>
                        {invoiceDetail.notes}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <View style={{ height: 32 }} />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, P: DoctorPalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  revenueCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  revenueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  revenueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  revenueBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  revenueAmount: {
    fontSize: SCREEN_WIDTH < 360 ? 32 : 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 16,
    gap: 16,
  },
  revenueItem: {
    flex: 1,
    gap: 4,
  },
  revenueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  revenueItemLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  revenueItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  revenueDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statBoxIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statBoxLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  filtersSection: {
    gap: 10,
  },
  filtersSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  doctorFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  doctorFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  doctorFilterIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorFilterTextBlock: {
    flex: 1,
    gap: 2,
  },
  doctorFilterLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  doctorFilterValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  dateFiltersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateFilterChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateFilterChipText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  transactionsSection: {
    gap: 4,
  },
  transactionsList: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    gap: 3,
  },
  transactionName: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  transactionStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  transactionStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: P.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalSheet: {
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
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: P.placeholder,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
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
  clearButton: {
    padding: 4,
  },
  modalScroll: {
    flexGrow: 1,
  },
  modalLoading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 14,
  },
  doctorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  doctorOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  doctorOptionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorOptionInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  doctorOptionName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  doctorOptionSpec: {
    fontSize: 12,
  },
  // Invoice Detail Modal
  invoiceModalOverlay: {
    flex: 1,
    backgroundColor: P.overlay,
    justifyContent: 'flex-end',
  },
  invoiceModalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    flex: 1,
  },
  invoiceModalHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  invoiceModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: P.placeholder,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  invoiceModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  invoiceModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  invoiceModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  invoiceStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  invoiceStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  invoiceCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  invoiceScrollView: {
    flex: 1,
  },
  invoiceScrollContent: {
    padding: 16,
    gap: 16,
  },
  invoiceInfoCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  invoiceInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  invoiceInfoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceInfoText: {
    flex: 1,
    gap: 2,
  },
  invoiceInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invoiceInfoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  invoiceInfoSub: {
    fontSize: 12,
  },
  invoiceSection: {
    gap: 8,
  },
  invoiceSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  invoiceItemsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  invoiceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  invoiceItemTypeIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceItemInfo: {
    flex: 1,
    gap: 3,
  },
  invoiceItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  invoiceItemQty: {
    fontSize: 12,
  },
  invoiceItemTotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  invoiceTotalsBlock: {
    borderTopWidth: 1,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  invoiceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceTotalLabel: {
    fontSize: 14,
  },
  invoiceTotalValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  invoiceGrandTotal: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: P.border,
    marginTop: 4,
  },
  invoiceGrandLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  invoiceGrandValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  invoicePaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  invoiceNotesCard: {
    borderRadius: 16,
    padding: 16,
  },
  invoiceNotesText: {
    fontSize: 14,
    lineHeight: 22,
  },
  invoiceEmptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
});

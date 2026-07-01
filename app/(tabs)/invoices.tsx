import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Image, RefreshControl, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { X, Search, ChevronDown, Filter, User, ArrowLeft } from 'lucide-react-native';
import { config } from '@/utils/config';
import { getSession } from '@/utils/auth';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface Doctor {
  id: string;
  name: string;
  image?: string;
}

interface Clinic {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  notes?: string;
  doctor: Doctor;
  clinic: Clinic;
}

interface InvoiceItem {
  id: string;
  item_type: string;
  service_name?: string;
  material_name?: string;
  package_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

interface Payment {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  notes?: string;
}

interface InvoiceDetail {
  invoice: Invoice;
  items: InvoiceItem[];
  payments: Payment[];
  total_items: number;
  total_payments: number;
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';
type StatusFilter = 'all' | 'paid' | 'pending' | 'overdue';

export default function InvoicesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<any>(null);

  // Filters
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'doctor' | 'date' | 'status' | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');

  // Detail modal
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadInvoices = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const session = await getSession();
      if (!session) {
        setError(t('invoices.noSessionFound'));
        return;
      }

      const medicalId = session.patient?.medical_id;

      if (!medicalId) {
        setError(t('invoices.medicalIdNotFound'));
        return;
      }

      const apiUrl = `${config.supabaseUrl}/functions/v1/mobile-get-patient-invoices`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ medicalId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('invoices.failedToLoad'));
      }

      if (data.success) {
        setInvoices(data.invoices || []);
        setSummary(data.summary);

        // Extract unique doctors
        const uniqueDoctors = Array.from(
          new Map(
            (data.invoices || []).map((inv: Invoice) => [inv.doctor.id, inv.doctor])
          ).values()
        ) as Doctor[];
        setDoctors(uniqueDoctors);
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError(err instanceof Error ? err.message : t('invoices.failedToLoad'));
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [t]);

  const onRefresh = () => {
    loadInvoices(true);
  };

  const loadInvoiceDetail = async (invoiceId: string) => {
    try {
      setDetailLoading(true);
      setShowDetail(true);

      const session = await getSession();
      if (!session) {
        setError(t('invoices.noSessionFound'));
        return;
      }

      const medicalId = session.patient?.medical_id;

      if (!medicalId) {
        setError(t('invoices.medicalIdNotFound'));
        return;
      }

      const apiUrl = `${config.supabaseUrl}/functions/v1/mobile-get-patient-invoices`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ medicalId, invoice_id: invoiceId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('invoices.failedToLoadDetails'));
      }

      if (data.success) {
        setSelectedInvoice(data);
      }
    } catch (err) {
      console.error('Error loading invoice details:', err);
      setError(err instanceof Error ? err.message : t('invoices.failedToLoadDetails'));
    } finally {
      setDetailLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...invoices];

    if (selectedDoctor) {
      filtered = filtered.filter(inv => inv.doctor.id === selectedDoctor);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(inv => inv.status === selectedStatus);
    }

    if (selectedDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(inv => {
        const invDate = new Date(inv.invoice_date);
        const invDateOnly = new Date(invDate.getFullYear(), invDate.getMonth(), invDate.getDate());

        switch (selectedDateFilter) {
          case 'today':
            return invDateOnly.getTime() === today.getTime();
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return invDateOnly >= weekAgo && invDateOnly <= today;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return invDateOnly >= monthAgo && invDateOnly <= today;
          case 'year':
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return invDateOnly >= yearAgo && invDateOnly <= today;
          default:
            return true;
        }
      });
    }

    setFilteredInvoices(filtered);
  }, [invoices, selectedDoctor, selectedDateFilter, selectedStatus]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const getDateFilterLabel = (filter: DateFilter): string => {
    switch (filter) {
      case 'all': return t('invoices.dateAllTime');
      case 'today': return t('invoices.dateToday');
      case 'week': return t('invoices.dateLast7Days');
      case 'month': return t('invoices.dateLastMonth');
      case 'year': return t('invoices.dateLastYear');
      default: return t('invoices.dateAllTime');
    }
  };

  const getStatusFilterLabel = (filter: StatusFilter): string => {
    switch (filter) {
      case 'all': return t('invoices.statusAll');
      case 'paid': return t('invoices.statusPaid');
      case 'pending': return t('invoices.statusPending');
      case 'overdue': return t('invoices.statusOverdue');
      default: return t('invoices.statusAll');
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

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return '#15C2B0';
      case 'pending': return '#F59E0B';
      case 'overdue': return '#FF6F61';
      default: return '#9ca3af';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return t('invoices.statusPaid');
      case 'pending': return t('invoices.statusPending');
      case 'overdue': return t('invoices.statusOverdue');
      default: return status.toUpperCase();
    }
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
          <Text style={styles.title}>{t('invoices.title')}</Text>
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
          <Text style={styles.title}>{t('invoices.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadInvoices()}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{t('invoices.title')}</Text>
            {summary && (
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('invoices.summaryTotal')}</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(summary.total_charges)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('invoices.summaryPaid')}</Text>
                  <Text style={[styles.summaryValue, { color: '#15C2B0' }]}>{formatCurrency(summary.total_paid)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('invoices.summaryBalance')}</Text>
                  <Text style={[styles.summaryValue, { color: '#FF6F61' }]}>{formatCurrency(summary.total_balance)}</Text>
                </View>
              </View>
            )}
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

      {/* Invoices List */}
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
        {filteredInvoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('invoices.noInvoicesFound')}</Text>
          </View>
        ) : (
          filteredInvoices.map((invoice) => (
            <TouchableOpacity
              key={invoice.id}
              style={styles.invoiceCard}
              onPress={() => loadInvoiceDetail(invoice.id)}
            >
              <View style={styles.invoiceHeader}>
                <View style={styles.doctorInfo}>
                  {invoice.doctor.image ? (
                    <Image source={{ uri: invoice.doctor.image }} style={styles.doctorImage} />
                  ) : (
                    <View style={[styles.doctorImage, styles.doctorImagePlaceholder]}>
                      <User size={20} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.doctorDetails}>
                    <Text style={styles.doctorName}>{invoice.doctor.name}</Text>
                    <Text style={styles.clinicName}>{invoice.clinic.name}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(invoice.status)}15` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
                    {getStatusLabel(invoice.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.invoiceBody}>
                <View style={styles.invoiceRow}>
                  <Text style={styles.invoiceLabel}>{t('invoices.invoiceNumberLabel')}</Text>
                  <Text style={styles.invoiceValue}>{invoice.invoice_number}</Text>
                </View>
                <View style={styles.invoiceRow}>
                  <Text style={styles.invoiceLabel}>{t('invoices.dateLabel')}</Text>
                  <Text style={styles.invoiceValue}>{formatDate(invoice.invoice_date)}</Text>
                </View>
                <View style={styles.invoiceRow}>
                  <Text style={styles.invoiceLabel}>{t('invoices.dueDateLabel')}</Text>
                  <Text style={styles.invoiceValue}>{formatDate(invoice.due_date)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.invoiceRow}>
                  <Text style={styles.invoiceLabel}>{t('invoices.totalAmountLabel')}</Text>
                  <Text style={styles.invoiceValueBold}>{formatCurrency(invoice.total_amount)}</Text>
                </View>
                <View style={styles.invoiceRow}>
                  <Text style={styles.invoiceLabel}>{t('invoices.paidLabel')}</Text>
                  <Text style={[styles.invoiceValueBold, { color: '#15C2B0' }]}>{formatCurrency(invoice.paid_amount)}</Text>
                </View>
                <View style={styles.invoiceRow}>
                  <Text style={styles.invoiceLabel}>{t('invoices.balanceLabel')}</Text>
                  <Text style={[styles.invoiceValueBold, { color: '#FF6F61' }]}>{formatCurrency(invoice.balance)}</Text>
                </View>
              </View>
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
              <Text style={styles.filterModalTitle}>{t('invoices.filters')}</Text>
              <View style={styles.filterModalHeaderActions}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDoctor('');
                    setSelectedDateFilter('all');
                    setSelectedStatus('all');
                    setOpenDropdown(null);
                    setDoctorSearch('');
                  }}
                  style={styles.clearFiltersButton}
                >
                  <Text style={styles.clearFiltersButtonText}>{t('invoices.clearAll')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setShowFilterModal(false); setOpenDropdown(null); setDoctorSearch(''); }}
                  style={styles.filterModalCloseButton}
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
              <Text style={styles.filterSectionTitle}>{t('invoices.doctorLabel')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, openDropdown === 'doctor' && styles.dropdownTriggerOpen]}
                onPress={() => {
                  if (openDropdown === 'doctor') { setOpenDropdown(null); setDoctorSearch(''); }
                  else { setOpenDropdown('doctor'); setDoctorSearch(''); }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{selectedDoctor ? (doctors.find(d => d.id === selectedDoctor)?.name || t('invoices.allDoctors')) : t('invoices.allDoctors')}</Text>
                <ChevronDown size={18} color={colors.textSecondary} style={{ transform: [{ rotate: openDropdown === 'doctor' ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
              {openDropdown === 'doctor' && (() => {
                const doctorItems = [{ id: '', name: t('invoices.allDoctors') }, ...doctors.map(d => ({ id: d.id, name: d.name }))]
                  .filter(item => item.id === '' || item.name.toLowerCase().includes(doctorSearch.toLowerCase()));
                return (
                  <View style={styles.dropdownList}>
                    <View style={styles.dropdownSearchRow}>
                      <Search size={15} color={colors.textSecondary} />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder={t('invoices.searchDoctors')}
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
              <Text style={styles.filterSectionTitle}>{t('invoices.dateRange')}</Text>
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
                    { value: 'all', label: t('invoices.dateAllTime') },
                    { value: 'today', label: t('invoices.dateToday') },
                    { value: 'week', label: t('invoices.dateLast7Days') },
                    { value: 'month', label: t('invoices.dateLastMonth') },
                    { value: 'year', label: t('invoices.dateLastYear') },
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

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('invoices.statusLabel')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, openDropdown === 'status' && styles.dropdownTriggerOpen]}
                onPress={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{getStatusFilterLabel(selectedStatus)}</Text>
                <ChevronDown size={18} color={colors.textSecondary} style={{ transform: [{ rotate: openDropdown === 'status' ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
              {openDropdown === 'status' && (
                <View style={styles.dropdownList}>
                  {[
                    { value: 'all', label: t('invoices.statusAll') },
                    { value: 'paid', label: t('invoices.statusPaid') },
                    { value: 'pending', label: t('invoices.statusPending') },
                    { value: 'overdue', label: t('invoices.statusOverdue') },
                  ].map((option, idx, arr) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.dropdownItem, selectedStatus === option.value && styles.dropdownItemSelected, idx === arr.length - 1 && styles.dropdownItemLast]}
                      onPress={() => { setSelectedStatus(option.value as StatusFilter); setOpenDropdown(null); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dropdownItemText, selectedStatus === option.value && styles.dropdownItemTextSelected]}>{option.label}</Text>
                      {selectedStatus === option.value && <View style={styles.dropdownItemCheck} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => { setOpenDropdown(null); setShowFilterModal(false); }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#56C6C8', '#69C7F0']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={styles.applyFiltersButtonText}>{t('invoices.applyFilters')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal visible={showDetail} animationType="slide" onRequestClose={() => setShowDetail(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setShowDetail(false)}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('invoices.invoiceDetails')}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDetail(false)}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {detailLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : selectedInvoice ? (
            <ScrollView style={styles.modalContent} contentContainerStyle={styles.scrollContent}>
              {/* Invoice Info */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>{t('invoices.invoiceInformation')}</Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('invoices.invoiceNumberLabel')}</Text>
                    <Text style={styles.detailValue}>{selectedInvoice.invoice.invoice_number}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('invoices.dateLabel')}</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedInvoice.invoice.invoice_date)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('invoices.dueDateLabel')}</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedInvoice.invoice.due_date)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('invoices.doctorRowLabel')}</Text>
                    <Text style={styles.detailValue}>{selectedInvoice.invoice.doctor.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('invoices.clinicLabel')}</Text>
                    <Text style={styles.detailValue}>{selectedInvoice.invoice.clinic.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('invoices.statusRowLabel')}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(selectedInvoice.invoice.status)}15` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(selectedInvoice.invoice.status) }]}>
                        {getStatusLabel(selectedInvoice.invoice.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Items */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>{t('invoices.itemsCount', { count: selectedInvoice.total_items })}</Text>
                {selectedInvoice.items.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemType}>{item.item_type.toUpperCase()}</Text>
                      <Text style={styles.itemPrice}>{formatCurrency(item.total_price)}</Text>
                    </View>
                    <Text style={styles.itemName}>
                      {item.service_name || item.material_name || item.package_name}
                    </Text>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemDetailText}>{t('invoices.quantityLabel', { quantity: item.quantity })}</Text>
                      <Text style={styles.itemDetailText}>{t('invoices.unitPriceLabel', { price: formatCurrency(item.unit_price) })}</Text>
                    </View>
                    {item.notes && (
                      <Text style={styles.itemNotes}>{item.notes}</Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Payments */}
              {selectedInvoice.payments.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>{t('invoices.paymentsCount', { count: selectedInvoice.total_payments })}</Text>
                  {selectedInvoice.payments.map((payment) => (
                    <View key={payment.id} style={styles.paymentCard}>
                      <View style={styles.paymentHeader}>
                        <Text style={styles.paymentDate}>{formatDate(payment.payment_date)}</Text>
                        <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                      </View>
                      <Text style={styles.paymentMethod}>{payment.payment_method}</Text>
                      {payment.notes && (
                        <Text style={styles.paymentNotes}>{payment.notes}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Totals */}
              <View style={styles.detailSection}>
                <View style={styles.totalCard}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{t('invoices.totalAmountLabel')}</Text>
                    <Text style={styles.totalValue}>{formatCurrency(selectedInvoice.invoice.total_amount)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{t('invoices.totalPaidLabel')}</Text>
                    <Text style={[styles.totalValue, { color: '#15C2B0' }]}>{formatCurrency(selectedInvoice.invoice.paid_amount)}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabelBold}>{t('invoices.balanceDueLabel')}</Text>
                    <Text style={[styles.totalValueBold, { color: '#FF6F61' }]}>{formatCurrency(selectedInvoice.invoice.balance)}</Text>
                  </View>
                </View>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginRight: 12,
  },
  headerSpacer: {
    width: 40,
  },
  headerTop: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  filterIconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    marginLeft: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    marginBottom: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: colors.text,
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
    color: colors.card,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  invoiceCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  doctorImagePlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    marginBottom: 2,
  },
  clinicName: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  invoiceBody: {
    gap: 8,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  invoiceValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.text,
  },
  invoiceValueBold: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
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
  modalBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.text,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemType: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: colors.primary,
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDetailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  itemNotes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  paymentCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentDate: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.text,
  },
  paymentAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#15C2B0',
  },
  paymentMethod: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  paymentNotes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  totalCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
  },
  totalLabelBold: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  totalValueBold: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
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
  filterModalFooter: {
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
  filterModalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterModalCloseButton: {
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
  },
  applyFiltersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

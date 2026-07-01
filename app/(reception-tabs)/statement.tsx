import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Stethoscope,
  Users,
  ChevronDown,
  X,
  Check,
  Receipt,
  Wallet,
  Scale,
  ChevronRight,
  Search,
  Calendar as CalendarIcon,
  CreditCard,
  FileText,
  AlertCircle,
  TrendingDown,
  CheckCircle2,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import BookingCalendar from '@/components/reception/BookingCalendar';
import {
  getStatement,
  addInvoicePayment,
  deleteInvoice,
  deletePayment,
  toDateKey,
  PAYMENT_METHODS,
  type Statement,
  type StatementInvoice,
  type StatementOption,
  type StatementPatientOption,
  type PaymentMethod,
} from '@/utils/receptionApi';

// Reception "Statement" screen — mirrors the web FinancePage: summary stat cards
// (charges / paid / balance), two combinable filters (by doctor AND by patient),
// and a tappable invoice list that expands to show its line items. Backed by
// business-get-statement.

const PAID_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  paid: { bg: '#DCFCE7', fg: '#15803D' },
  partial: { bg: '#FEF3C7', fg: '#B45309' },
  unpaid: { bg: '#FEE2E2', fg: '#B91C1C' },
  overpaid: { bg: '#DBEAFE', fg: '#1D4ED8' },
};

const money = (n: number) => `$${Math.round((Number(n) + Number.EPSILON) * 100) / 100}`;

// Dashboard card ids. Several map to the same list filter (see kpiFilter).
type KpiCardId =
  | 'totalAmt' | 'totalPaid' | 'balanceDue'
  | 'countAll' | 'paidCount' | 'unpaidCount' | 'partialCount';
type KpiFilter = 'all' | 'paid' | 'unpaid' | 'partial' | 'balance';

const kpiCardToFilter = (card: KpiCardId | null): KpiFilter => {
  switch (card) {
    case 'totalPaid':
    case 'paidCount':
      return 'paid';
    case 'balanceDue':
      return 'balance';
    case 'unpaidCount':
      return 'unpaid';
    case 'partialCount':
      return 'partial';
    default:
      return 'all';
  }
};

export default function ReceptionStatementScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();

  const userId = session?.user?.realUserId || session?.user?.global_id || '';
  const companyId = session?.user?.company_id || null;

  const [data, setData] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [doctorFilter, setDoctorFilter] = useState<StatementOption | null>(null);
  const [patientFilter, setPatientFilter] = useState<StatementPatientOption | null>(null);
  const [picker, setPicker] = useState<'doctor' | 'patient' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Tapping a KPI card filters the invoice list. Each card has its own id (for
  // the highlight); several ids map to the same underlying list filter.
  const [kpiCard, setKpiCard] = useState<KpiCardId | null>(null);

  // Date-range filter (client-side, on invoice_date).
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [datePicker, setDatePicker] = useState<'from' | 'to' | null>(null);

  // Record-payment flow.
  const [payInvoice, setPayInvoice] = useState<StatementInvoice | null>(null);
  const [payAmountText, setPayAmountText] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payReference, setPayReference] = useState('');
  const [payMethodOpen, setPayMethodOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const openPicker = (which: 'doctor' | 'patient') => {
    setPickerSearch('');
    setPicker(which);
  };
  const toggleKpi = (card: KpiCardId) =>
    setKpiCard((prev) => (prev === card ? null : card));

  // Wide selectable window so staff can pick any past (or future) invoice date.
  const rangeMin = useMemo(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 5); return d; }, []);
  const rangeMax = useMemo(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d; }, []);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const load = useCallback(async () => {
    if (!userId) return;
    setError('');
    try {
      const result = await getStatement(userId, companyId, doctorFilter?.id ?? null, patientFilter?.id ?? null);
      setData(result);
    } catch (e: any) {
      setError(e?.message || t('reception.stmLoadError'));
    } finally {
      setLoading(false);
    }
  }, [userId, companyId, doctorFilter?.id, patientFilter?.id, t]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Filter option lists: keep the full doctor list, but scope patients to the
  // chosen doctor when one is active (so the two filters compose sensibly).
  const doctorOptions = useMemo(() => data?.doctors ?? [], [data]);
  const patientOptions = useMemo(() => {
    const all = data?.patients ?? [];
    if (!doctorFilter) return all;
    const ids = new Set((data?.invoices ?? []).filter((i) => i.doctor_id === doctorFilter.id).map((i) => i.patient_id));
    return all.filter((p) => ids.has(p.id));
  }, [data, doctorFilter]);

  const summary = data?.summary ?? { total_charges: 0, total_paid: 0, total_balance: 0, total_invoices: 0 };
  const invoices = useMemo(() => data?.invoices ?? [], [data]);

  // Per-status invoice counts for the dashboard (over the server-scoped set).
  const counts = useMemo(() => {
    let paid = 0, unpaid = 0, partial = 0;
    for (const i of invoices) {
      const s = i.payment_status;
      if (s === 'paid' || s === 'overpaid') paid++;
      else if (s === 'partial') partial++;
      else unpaid++;
    }
    return { total: invoices.length, paid, unpaid, partial };
  }, [invoices]);

  const kpiFilter = kpiCardToFilter(kpiCard);

  // Invoices shown in the list, narrowed by the tapped KPI card AND date range.
  const shownInvoices = useMemo(() => {
    const fromKey = dateFrom ? toDateKey(dateFrom) : null;
    const toKey = dateTo ? toDateKey(dateTo) : null;
    return invoices.filter((i) => {
      const s = i.payment_status;
      if (kpiFilter === 'paid' && !(s === 'paid' || s === 'overpaid')) return false;
      if (kpiFilter === 'unpaid' && !(s === 'unpaid' || (s !== 'paid' && s !== 'overpaid' && s !== 'partial'))) return false;
      if (kpiFilter === 'partial' && s !== 'partial') return false;
      if (kpiFilter === 'balance' && !(i.balance_due > 0)) return false;
      // invoice_date is an ISO date string; lexical compare works for YYYY-MM-DD.
      const d = (i.invoice_date || '').slice(0, 10);
      if (fromKey && d < fromKey) return false;
      if (toKey && d > toKey) return false;
      return true;
    });
  }, [invoices, kpiFilter, dateFrom, dateTo]);

  // ---- Record-payment flow -------------------------------------------------

  const openPayment = (inv: StatementInvoice) => {
    setPayInvoice(inv);
    setPayAmountText(inv.balance_due > 0 ? String(inv.balance_due) : '');
    setPayMethod('cash');
    setPayReference('');
    setPayMethodOpen(false);
  };

  const submitPayment = async () => {
    if (!payInvoice) return;
    const amount = Number(payAmountText) || 0;
    if (!(amount > 0)) {
      Alert.alert(t('reception.stmPaymentTitle'), t('reception.ciNeedPaymentAmount'));
      return;
    }
    setPaying(true);
    try {
      await addInvoicePayment({
        userId,
        invoiceId: payInvoice.id,
        paymentDate: toDateKey(new Date()),
        amount,
        paymentMethod: payMethod,
        referenceNumber: payReference.trim() || null,
      });
      setPayInvoice(null);
      await load(); // refresh balances / payment_status from the server
    } catch (e: any) {
      Alert.alert(t('reception.stmPaymentTitle'), e?.message || t('reception.errorGeneric'));
    } finally {
      setPaying(false);
    }
  };

  // ---- Edit / delete -------------------------------------------------------

  const handleEditInvoice = (inv: StatementInvoice) => {
    router.push({ pathname: '/(reception-tabs)/create-invoice', params: { invoiceId: inv.id } } as any);
  };

  const handleDeleteInvoice = (inv: StatementInvoice) => {
    Alert.alert(
      t('reception.stmDeleteInvoiceTitle'),
      t('reception.stmDeleteInvoiceMsg', { number: inv.invoice_number }),
      [
        { text: t('reception.cancel'), style: 'cancel' },
        {
          text: t('reception.stmDelete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInvoice(userId, inv.id);
              await load();
            } catch (e: any) {
              Alert.alert(t('reception.stmDeleteInvoiceTitle'), e?.message || t('reception.errorGeneric'));
            }
          },
        },
      ]
    );
  };

  const handleDeletePayment = (inv: StatementInvoice, paymentId: string) => {
    Alert.alert(
      t('reception.stmDeletePaymentTitle'),
      t('reception.stmDeletePaymentMsg'),
      [
        { text: t('reception.cancel'), style: 'cancel' },
        {
          text: t('reception.stmDelete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePayment(userId, paymentId);
              await load();
            } catch (e: any) {
              Alert.alert(t('reception.stmDeletePaymentTitle'), e?.message || t('reception.errorGeneric'));
            }
          },
        },
      ]
    );
  };

  // Doctor / patient picker options, narrowed by the in-picker search box.
  const q = pickerSearch.trim().toLowerCase();
  const filteredDoctorOptions = useMemo(
    () => (!q ? doctorOptions : doctorOptions.filter((d) => d.name.toLowerCase().includes(q))),
    [doctorOptions, q]
  );
  const filteredPatientOptions = useMemo(
    () =>
      !q
        ? patientOptions
        : patientOptions.filter(
            (p) => p.name.toLowerCase().includes(q) || (p.medical_id || '').toLowerCase().includes(q)
          ),
    [patientOptions, q]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('reception.stmTitle')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Dashboard — tap any card to filter the list below. The Total Invoices
            amount spans the full first line; the rest are two per line. */}
        <View style={styles.dashWrap}>
          <StatCard big fullWidth icon={FileText} label={t('reception.stmTotalInvoices')} value={money(summary.total_charges)} tint="#2D7DD2" colors={colors} active={kpiCard === 'totalAmt'} onPress={() => toggleKpi('totalAmt')} />
          <StatCard big icon={Wallet} label={t('reception.stmTotalPaid')} value={money(summary.total_paid)} tint="#15C2B0" colors={colors} active={kpiCard === 'totalPaid'} onPress={() => toggleKpi('totalPaid')} />
          <StatCard big icon={AlertCircle} label={t('reception.stmBalanceDue')} value={money(summary.total_balance)} tint="#FF6F61" colors={colors} active={kpiCard === 'balanceDue'} onPress={() => toggleKpi('balanceDue')} />
          <StatCard icon={Receipt} label={t('reception.stmTotalInvoices')} value={String(counts.total)} tint="#7C3AED" colors={colors} active={kpiCard === 'countAll'} onPress={() => toggleKpi('countAll')} />
          <StatCard icon={CheckCircle2} label={t('reception.stmPaidCount')} value={String(counts.paid)} tint="#15C2B0" colors={colors} active={kpiCard === 'paidCount'} onPress={() => toggleKpi('paidCount')} />
          <StatCard icon={Scale} label={t('reception.stmUnpaidCount')} value={String(counts.unpaid)} tint="#FF6F61" colors={colors} active={kpiCard === 'unpaidCount'} onPress={() => toggleKpi('unpaidCount')} />
          <StatCard icon={TrendingDown} label={t('reception.stmPartialCount')} value={String(counts.partial)} tint="#F59E0B" colors={colors} active={kpiCard === 'partialCount'} onPress={() => toggleKpi('partialCount')} />
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          <FilterBtn
            icon={Stethoscope}
            value={doctorFilter ? doctorFilter.name : t('reception.stmAllDoctors')}
            active={!!doctorFilter}
            colors={colors}
            onPress={() => openPicker('doctor')}
          />
          <FilterBtn
            icon={Users}
            value={patientFilter ? patientFilter.name : t('reception.stmAllPatients')}
            active={!!patientFilter}
            colors={colors}
            onPress={() => openPicker('patient')}
          />
        </View>

        {/* Date range */}
        <View style={styles.filtersRow}>
          <FilterBtn
            icon={CalendarIcon}
            value={dateFrom ? toDateKey(dateFrom) : t('reception.stmDateFrom')}
            active={!!dateFrom}
            colors={colors}
            onPress={() => setDatePicker('from')}
          />
          <FilterBtn
            icon={CalendarIcon}
            value={dateTo ? toDateKey(dateTo) : t('reception.stmDateTo')}
            active={!!dateTo}
            colors={colors}
            onPress={() => setDatePicker('to')}
          />
        </View>
        {(dateFrom || dateTo) ? (
          <TouchableOpacity onPress={() => { setDateFrom(null); setDateTo(null); }} activeOpacity={0.7} style={styles.clearDates}>
            <X size={14} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.clearDatesText, { color: colors.primary }]}>{t('reception.stmClearDates')}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Invoice list */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : error ? (
          <EmptyState text={error} colors={colors} retry={load} retryLabel={t('reception.retry')} />
        ) : shownInvoices.length === 0 ? (
          <EmptyState text={t('reception.stmNoInvoices')} colors={colors} />
        ) : (
          <View style={{ gap: 12, marginTop: 4 }}>
            {shownInvoices.map((inv) => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                expanded={expanded.has(inv.id)}
                onToggle={() => toggleExpand(inv.id)}
                onPay={() => openPayment(inv)}
                onEdit={() => handleEditInvoice(inv)}
                onDelete={() => handleDeleteInvoice(inv)}
                onDeletePayment={(pid) => handleDeletePayment(inv, pid)}
                colors={colors}
                t={t}
              />
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Filter picker */}
      <Modal visible={!!picker} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <TouchableOpacity style={styles.pickerScrim} activeOpacity={1} onPress={() => setPicker(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerCard, { backgroundColor: colors.card }]}>
            <View style={[styles.pickerHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                {picker === 'doctor' ? t('reception.stmFilterDoctor') : t('reception.stmFilterPatient')}
              </Text>
              <TouchableOpacity onPress={() => setPicker(null)} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.searchWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Search size={16} color={colors.textSecondary} strokeWidth={2} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={picker === 'doctor' ? t('reception.stmSearchDoctor') : t('reception.stmSearchPatient')}
                placeholderTextColor={colors.textTertiary}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                autoCorrect={false}
              />
              {pickerSearch ? (
                <TouchableOpacity onPress={() => setPickerSearch('')} hitSlop={8}>
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {picker === 'doctor' && (
                <>
                  {!pickerSearch ? (
                    <PickerRow label={t('reception.stmAllDoctors')} selected={!doctorFilter} colors={colors} onPress={() => { setDoctorFilter(null); setPicker(null); }} />
                  ) : null}
                  {filteredDoctorOptions.map((d) => (
                    <PickerRow key={d.id} label={d.name} selected={doctorFilter?.id === d.id} colors={colors} onPress={() => { setDoctorFilter(d); setPicker(null); }} />
                  ))}
                  {filteredDoctorOptions.length === 0 ? <Text style={[styles.pickerEmpty, { color: colors.textTertiary }]}>{t('reception.noDoctors')}</Text> : null}
                </>
              )}
              {picker === 'patient' && (
                <>
                  {!pickerSearch ? (
                    <PickerRow label={t('reception.stmAllPatients')} selected={!patientFilter} colors={colors} onPress={() => { setPatientFilter(null); setPicker(null); }} />
                  ) : null}
                  {filteredPatientOptions.map((p) => (
                    <PickerRow key={p.id} label={p.name} sub={p.medical_id} selected={patientFilter?.id === p.id} colors={colors} onPress={() => { setPatientFilter(p); setPicker(null); }} />
                  ))}
                  {filteredPatientOptions.length === 0 ? <Text style={[styles.pickerEmpty, { color: colors.textTertiary }]}>{t('reception.noPatients')}</Text> : null}
                </>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Date range calendar */}
      <Modal visible={!!datePicker} transparent animationType="fade" onRequestClose={() => setDatePicker(null)}>
        <TouchableOpacity style={styles.pickerScrim} activeOpacity={1} onPress={() => setDatePicker(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerCard, { backgroundColor: colors.card }]}>
            <View style={[styles.pickerHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                {datePicker === 'from' ? t('reception.stmDateFrom') : t('reception.stmDateTo')}
              </Text>
              <TouchableOpacity onPress={() => setDatePicker(null)} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <BookingCalendar
              key={datePicker || 'none'}
              selectedDate={datePicker === 'from' ? dateFrom : dateTo}
              onSelect={(d) => {
                if (datePicker === 'from') setDateFrom(d); else setDateTo(d);
                setDatePicker(null);
              }}
              minDate={datePicker === 'to' && dateFrom ? dateFrom : rangeMin}
              maxDate={datePicker === 'from' && dateTo ? dateTo : rangeMax}
              hint=""
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Record payment */}
      <Modal visible={!!payInvoice} transparent animationType="fade" onRequestClose={() => setPayInvoice(null)}>
        <TouchableOpacity style={styles.pickerScrim} activeOpacity={1} onPress={() => setPayInvoice(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerCard, { backgroundColor: colors.card }]}>
            <View style={[styles.pickerHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('reception.stmPaymentTitle')}</Text>
              <TouchableOpacity onPress={() => setPayInvoice(null)} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {payInvoice ? (
              <View style={{ paddingTop: 14, gap: 14 }}>
                <Text style={[payStyles.sub, { color: colors.textSecondary }]}>
                  #{payInvoice.invoice_number} · {t('reception.stmBalance')} {money(payInvoice.balance_due)}
                </Text>
                <View>
                  <Text style={[payStyles.label, { color: colors.text }]}>{t('reception.ciAmount')}</Text>
                  <TextInput
                    style={[payStyles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                    value={payAmountText}
                    onChangeText={(v) => setPayAmountText(v.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View>
                  <Text style={[payStyles.label, { color: colors.text }]}>{t('reception.ciPaymentMethod')}</Text>
                  <TouchableOpacity
                    style={[payStyles.select, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setPayMethodOpen((o) => !o)}
                    activeOpacity={0.8}
                  >
                    <CreditCard size={16} color={colors.primary} strokeWidth={2} />
                    <Text style={[payStyles.selectText, { color: colors.text }]}>{t(`reception.pm_${payMethod}`)}</Text>
                    <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                  {payMethodOpen ? (
                    <View style={[payStyles.methodList, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      {PAYMENT_METHODS.map((m) => (
                        <TouchableOpacity key={m} style={payStyles.methodRow} onPress={() => { setPayMethod(m); setPayMethodOpen(false); }} activeOpacity={0.7}>
                          <Text style={[payStyles.methodText, { color: colors.text }]}>{t(`reception.pm_${m}`)}</Text>
                          {payMethod === m ? <Check size={16} color={colors.primary} strokeWidth={2.5} /> : null}
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>
                <View>
                  <Text style={[payStyles.label, { color: colors.text }]}>{t('reception.ciReference')}</Text>
                  <TextInput
                    style={[payStyles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                    value={payReference}
                    onChangeText={setPayReference}
                    placeholder={t('reception.ciReference')}
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
                <TouchableOpacity style={payStyles.submitBtn} onPress={submitPayment} disabled={paying} activeOpacity={0.9}>
                  <View style={[payStyles.submitInner, { backgroundColor: colors.primary, opacity: paying ? 0.7 : 1 }]}>
                    {paying ? <ActivityIndicator color="#FFFFFF" /> : <Text style={payStyles.submitText}>{t('reception.stmRecordPayment')}</Text>}
                  </View>
                </TouchableOpacity>
              </View>
            ) : null}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({ icon: Icon, label, value, tint, colors, active, onPress, big, fullWidth }: { icon: any; label: string; value: string; tint: string; colors: any; active?: boolean; onPress?: () => void; big?: boolean; fullWidth?: boolean }) {
  return (
    <TouchableOpacity
      style={[
        big ? statStyles.bigCard : statStyles.card,
        fullWidth && statStyles.fullWidth,
        { backgroundColor: active ? tint + '14' : colors.card, borderColor: active ? tint : colors.border, borderWidth: active ? 2 : 1 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={statStyles.headRow}>
        <View style={[statStyles.iconWrap, { backgroundColor: tint + '22' }]}>
          <Icon size={big ? 16 : 15} color={tint} strokeWidth={2.2} />
        </View>
        <Text style={[statStyles.label, { color: colors.textSecondary }]} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={[big ? statStyles.bigValue : statStyles.value, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text>
    </TouchableOpacity>
  );
}

function FilterBtn({ icon: Icon, value, active, colors, onPress }: { icon: any; value: string; active: boolean; colors: any; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[filterStyles.btn, { backgroundColor: colors.card, borderColor: active ? colors.primary : colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Icon size={16} color={colors.primary} strokeWidth={2} />
      <Text style={[filterStyles.text, { color: colors.text }]} numberOfLines={1}>{value}</Text>
      <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
    </TouchableOpacity>
  );
}

function InvoiceCard({ invoice, expanded, onToggle, onPay, onEdit, onDelete, onDeletePayment, colors, t }: {
  invoice: StatementInvoice;
  expanded: boolean;
  onToggle: () => void;
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeletePayment: (paymentId: string) => void;
  colors: any;
  t: any;
}) {
  const sc = PAID_STATUS_COLORS[invoice.payment_status] || { bg: colors.backgroundSecondary, fg: colors.textSecondary };
  const payments = invoice.payments || [];
  return (
    <View style={[cardStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={cardStyles.top} onPress={onToggle} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={[cardStyles.number, { color: colors.text }]}>#{invoice.invoice_number}</Text>
          <Text style={[cardStyles.sub, { color: colors.textSecondary }]} numberOfLines={1}>
            {invoice.patient_name} · {invoice.doctor_name}
          </Text>
          <Text style={[cardStyles.date, { color: colors.textTertiary }]}>{invoice.invoice_date}</Text>
        </View>
        <View style={cardStyles.right}>
          <Text style={[cardStyles.total, { color: colors.text }]}>{money(invoice.total_amount)}</Text>
          <View style={[cardStyles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[cardStyles.badgeText, { color: sc.fg }]}>{t(`reception.ps_${invoice.payment_status}`, invoice.payment_status)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={cardStyles.amountsRow}>
        <AmountChip label={t('reception.stmPaid')} value={money(invoice.paid_amount)} colors={colors} />
        <AmountChip label={t('reception.stmBalance')} value={money(invoice.balance_due)} colors={colors} />
        <TouchableOpacity style={cardStyles.expandHint} onPress={onToggle} activeOpacity={0.7}>
          <Text style={[cardStyles.expandText, { color: colors.primary }]}>
            {expanded ? t('reception.stmHideItems') : t('reception.stmShowItems')}
          </Text>
          <ChevronRight size={14} color={colors.primary} strokeWidth={2.5} style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={[cardStyles.actions, { borderTopColor: colors.border }]}>
        {invoice.balance_due > 0 ? (
          <TouchableOpacity style={[cardStyles.actionBtn, { backgroundColor: colors.primary }]} onPress={onPay} activeOpacity={0.85}>
            <CreditCard size={15} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={cardStyles.actionBtnTextLight}>{t('reception.stmPayAction')}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={[cardStyles.actionBtnOutline, { borderColor: colors.border }]} onPress={onEdit} activeOpacity={0.85}>
          <Pencil size={15} color={colors.text} strokeWidth={2.2} />
          <Text style={[cardStyles.actionBtnText, { color: colors.text }]}>{t('reception.stmEdit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[cardStyles.actionBtnOutline, { borderColor: '#FCA5A5' }]} onPress={onDelete} activeOpacity={0.85}>
          <Trash2 size={15} color="#EF4444" strokeWidth={2.2} />
          <Text style={[cardStyles.actionBtnText, { color: '#EF4444' }]}>{t('reception.stmDelete')}</Text>
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View style={[cardStyles.items, { borderTopColor: colors.border }]}>
          {invoice.items.length === 0 ? (
            <Text style={[cardStyles.itemEmpty, { color: colors.textTertiary }]}>{t('reception.stmNoItems')}</Text>
          ) : (
            invoice.items.map((it, idx) => (
              <View key={idx} style={cardStyles.itemRow}>
                <Text style={[cardStyles.itemName, { color: colors.text }]} numberOfLines={1}>{it.name}</Text>
                <Text style={[cardStyles.itemQty, { color: colors.textSecondary }]}>×{it.quantity}</Text>
                <Text style={[cardStyles.itemTotal, { color: colors.text }]}>{money(it.line_total)}</Text>
              </View>
            ))
          )}

          {payments.length > 0 ? (
            <View style={[cardStyles.paymentsHead, { borderTopColor: colors.border }]}>
              <Text style={[cardStyles.paymentsTitle, { color: colors.textSecondary }]}>{t('reception.stmPayments')}</Text>
            </View>
          ) : null}
          {payments.map((p) => (
            <View key={p.id} style={cardStyles.itemRow}>
              <Text style={[cardStyles.itemName, { color: colors.text }]} numberOfLines={1}>
                {t(`reception.pm_${p.payment_method}`, p.payment_method)} · {p.payment_date}
              </Text>
              <Text style={[cardStyles.itemTotal, { color: '#15803D' }]}>{money(p.amount)}</Text>
              <TouchableOpacity onPress={() => onDeletePayment(p.id)} hitSlop={8} style={{ paddingLeft: 6 }}>
                <Trash2 size={15} color="#EF4444" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function AmountChip({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View>
      <Text style={[cardStyles.chipLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[cardStyles.chipValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function PickerRow({ label, sub, selected, colors, onPress }: { label: string; sub?: string | null; selected?: boolean; colors: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={pickerRowStyles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={[pickerRowStyles.text, { color: colors.text }]} numberOfLines={1}>{label}</Text>
        {sub ? <Text style={[pickerRowStyles.sub, { color: colors.textSecondary }]} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {selected ? <Check size={18} color={colors.primary} strokeWidth={2.5} /> : null}
    </TouchableOpacity>
  );
}

function EmptyState({ text, colors, retry, retryLabel }: { text: string; colors: any; retry?: () => void; retryLabel?: string }) {
  return (
    <View style={emptyStyles.wrap}>
      <Receipt size={48} color={colors.textTertiary} strokeWidth={1.5} />
      <Text style={[emptyStyles.text, { color: colors.textSecondary }]}>{text}</Text>
      {retry ? (
        <TouchableOpacity onPress={retry} style={[emptyStyles.retry, { borderColor: colors.primary }]} activeOpacity={0.7}>
          <Text style={[emptyStyles.retryText, { color: colors.primary }]}>{retryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const statStyles = StyleSheet.create({
  // Two cards per line: each takes just under half the row (gap accounted for).
  bigCard: { flexGrow: 1, flexBasis: '47%', minWidth: 150, borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  card: { flexGrow: 1, flexBasis: '47%', minWidth: 140, borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  fullWidth: { flexBasis: '100%' },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  bigValue: { fontSize: 24, fontWeight: '800' },
  value: { fontSize: 22, fontWeight: '800' },
  label: { flex: 1, fontSize: 12, fontWeight: '600' },
});

const filterStyles = StyleSheet.create({
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12 },
  text: { flex: 1, fontSize: 13.5, fontWeight: '700' },
});

const cardStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  number: { fontSize: 16, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 3 },
  date: { fontSize: 12, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  total: { fontSize: 16, fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  amountsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 20, marginTop: 12 },
  chipLabel: { fontSize: 11, fontWeight: '600' },
  chipValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  expandHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  expandText: { fontSize: 13, fontWeight: '700' },
  items: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemName: { flex: 1, fontSize: 13.5, fontWeight: '600' },
  itemQty: { fontSize: 13, fontWeight: '600' },
  itemTotal: { fontSize: 13.5, fontWeight: '700', minWidth: 60, textAlign: 'right' },
  itemEmpty: { fontSize: 13, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actionBtnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  actionBtnTextLight: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  paymentsHead: { marginTop: 6, paddingTop: 10, borderTopWidth: 1 },
  paymentsTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
});

const payStyles = StyleSheet.create({
  sub: { fontSize: 13, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  input: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 16, fontWeight: '700' },
  select: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14 },
  selectText: { flex: 1, fontSize: 15, fontWeight: '600' },
  methodList: { marginTop: 6, borderRadius: 12, borderWidth: 1.5, overflow: 'hidden' },
  methodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  methodText: { fontSize: 14.5, fontWeight: '600' },
  submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  submitInner: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});

const pickerRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  text: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12.5, marginTop: 2 },
});

const emptyStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, gap: 12 },
  text: { fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
  retry: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, marginTop: 4 },
  retryText: { fontSize: 14, fontWeight: '700' },
});

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    headerBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800' },

    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },

    dashWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
    filtersRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 10 },
    clearDates: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginBottom: 12, paddingVertical: 4 },
    clearDatesText: { fontSize: 13, fontWeight: '700' },

    pickerScrim: { flex: 1, backgroundColor: 'rgba(2,6,23,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    pickerCard: { width: '100%', maxWidth: 420, borderRadius: 22, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16, maxHeight: '80%' },
    pickerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
    pickerTitle: { fontSize: 17, fontWeight: '800' },
    pickerList: { paddingTop: 4 },
    pickerEmpty: { fontSize: 14, textAlign: 'center', paddingVertical: 24 },
    searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1.5, marginTop: 12 },
    searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  });

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Stethoscope,
  Users,
  Building2,
  ChevronDown,
  X,
  Check,
  Plus,
  Trash2,
  Receipt,
  CheckCircle2,
  Search,
  CreditCard,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  getDoctors,
  getPatientsByDoctor,
  getBillingResources,
  createInvoice,
  updateInvoice,
  getInvoiceDetail,
  addInvoicePayment,
  toDateKey,
  PAYMENT_METHODS,
  type ReceptionDoctor,
  type ReceptionPatient,
  type ReceptionClinic,
  type BillingResources,
  type BillingResource,
  type BillingItemType,
  type PaymentMethod,
  type InvoiceLineItemInput,
} from '@/utils/receptionApi';

// Reception "Create Invoice" screen — mirrors the web InvoiceFormModal: pick a
// doctor + patient (+ optional clinic), choose a date/status, add line items
// (services / medications / packages) with live totals, and optionally record a
// payment in the same step. Submits to business-create-invoice.

type InvoiceStatus = 'draft' | 'sent' | 'paid';
const STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid'];

interface LineItem extends InvoiceLineItemInput {
  key: string;
  name: string;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

let lineKeySeq = 0;

export default function ReceptionCreateInvoiceScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();

  const userId = session?.user?.realUserId || session?.user?.global_id || '';
  const companyId = session?.user?.company_id || null;

  // Edit mode: an invoiceId param means we're editing an existing invoice.
  const params = useLocalSearchParams<{ invoiceId?: string }>();
  const editingId = params.invoiceId || null;
  const isEditing = !!editingId;
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Reference data
  const [doctors, setDoctors] = useState<ReceptionDoctor[]>([]);
  const [patients, setPatients] = useState<ReceptionPatient[]>([]);
  const [resources, setResources] = useState<BillingResources>({ services: [], materials: [], packages: [] });
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingResources, setLoadingResources] = useState(true);

  // Selections
  const [doctor, setDoctor] = useState<ReceptionDoctor | null>(null);
  const [patient, setPatient] = useState<ReceptionPatient | null>(null);
  const [clinic, setClinic] = useState<ReceptionClinic | null>(null);
  const [invoiceDate, setInvoiceDate] = useState<Date>(() => new Date());
  const [status, setStatus] = useState<InvoiceStatus>('draft');

  // Line items
  const [activeType, setActiveType] = useState<BillingItemType>('service');
  const [items, setItems] = useState<LineItem[]>([]);

  // Money
  const [taxText, setTaxText] = useState('0');
  const [discountText, setDiscountText] = useState('0');

  // Payment
  const [recordPayment, setRecordPayment] = useState(false);
  const [payAmountText, setPayAmountText] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payReference, setPayReference] = useState('');

  // Modals
  const [picker, setPicker] = useState<'doctor' | 'patient' | 'clinic' | 'item' | 'method' | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [createdNumber, setCreatedNumber] = useState<string | null>(null);
  // Resolved ids of the invoice being edited, used to match the full doctor /
  // clinic objects (for clinic options) once the reference lists load.
  const [editDoctorId, setEditDoctorId] = useState<string | null>(null);
  const [editClinicId, setEditClinicId] = useState<string | null>(null);
  const [editNumber, setEditNumber] = useState<string | null>(null);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  // ---- Data loading --------------------------------------------------------

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoadingDoctors(true);
    getDoctors(userId, companyId)
      .then((docs) => { if (!cancelled) setDoctors(docs); })
      .catch(() => { if (!cancelled) setDoctors([]); })
      .finally(() => { if (!cancelled) setLoadingDoctors(false); });
    return () => { cancelled = true; };
  }, [userId, companyId]);

  const doctorId = doctor?.id;

  // Patients AND billable items are both scoped to the chosen doctor — a doctor
  // only offers the services / medications / packages they are assigned to.
  useEffect(() => {
    if (!doctorId || !userId) {
      setPatients([]);
      setResources({ services: [], materials: [], packages: [] });
      return;
    }
    let cancelled = false;
    setLoadingPatients(true);
    getPatientsByDoctor(userId, doctorId, companyId)
      .then((pts) => { if (!cancelled) setPatients(pts); })
      .catch(() => { if (!cancelled) setPatients([]); })
      .finally(() => { if (!cancelled) setLoadingPatients(false); });

    setLoadingResources(true);
    getBillingResources(userId, companyId, doctorId)
      .then((r) => { if (!cancelled) setResources(r); })
      .catch(() => { if (!cancelled) setResources({ services: [], materials: [], packages: [] }); })
      .finally(() => { if (!cancelled) setLoadingResources(false); });
    return () => { cancelled = true; };
  }, [doctorId, userId, companyId]);

  // ---- Edit mode: load the existing invoice + prefill ----------------------
  useEffect(() => {
    if (!editingId || !userId) return;
    let cancelled = false;
    setLoadingInvoice(true);
    getInvoiceDetail(userId, editingId)
      .then((inv) => {
        if (cancelled) return;
        setEditNumber(inv.invoice_number);
        setEditDoctorId(inv.doctor_id);
        setEditClinicId(inv.clinic_id);
        // Minimal doctor/patient for display; the full doctor (with clinics) is
        // swapped in by the matching effect below once the doctor list loads.
        setDoctor({ id: inv.doctor_id, first_name: inv.doctor_name, last_name: '', image_url: null, specialization: '', company_id: '', clinics: [] });
        setPatient({ patient_id: inv.patient_id, medical_id: inv.patient_medical_id, full_name: inv.patient_name, email: null, phone: null, company_id: '', company_name: '', appointment_count: 0, last_appointment_date: null });
        setInvoiceDate(inv.invoice_date ? new Date(`${inv.invoice_date.slice(0, 10)}T00:00:00`) : new Date());
        setStatus((['draft', 'sent', 'paid'].includes(inv.status) ? inv.status : 'draft') as InvoiceStatus);
        setTaxText(String(inv.tax_amount || 0));
        setDiscountText(String(inv.discount_amount || 0));
        setItems(inv.items.map((d) => {
          lineKeySeq += 1;
          return {
            key: `li-${lineKeySeq}`,
            name: d.name,
            item_type: d.item_type,
            description: d.description || d.name,
            quantity: d.quantity,
            unit_price: d.unit_price,
            service_id: d.service_id,
            medical_material_id: d.medical_material_id,
            package_id: d.package_id,
          };
        }));
      })
      .catch((e: any) => { if (!cancelled) Alert.alert(t('reception.ciErrorTitle'), e?.message || t('reception.errorGeneric')); })
      .finally(() => { if (!cancelled) setLoadingInvoice(false); });
    return () => { cancelled = true; };
  }, [editingId, userId, t]);

  // When editing, swap in the full doctor (for its clinic list) and preselect
  // the saved clinic once the reference data is available.
  useEffect(() => {
    if (!isEditing || !editDoctorId || doctors.length === 0) return;
    const full = doctors.find((d) => d.id === editDoctorId);
    if (!full) return;
    setDoctor((prev) => (prev && prev.clinics.length > 0 ? prev : full));
    if (editClinicId) {
      const c = full.clinics.find((cl) => cl.id === editClinicId);
      if (c) setClinic(c);
    }
  }, [isEditing, editDoctorId, editClinicId, doctors]);

  // ---- Derived totals ------------------------------------------------------

  const subtotal = useMemo(
    () => round2(items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0)),
    [items]
  );
  const tax = useMemo(() => Math.max(0, Number(taxText) || 0), [taxText]);
  const discount = useMemo(() => Math.max(0, Number(discountText) || 0), [discountText]);
  const grandTotal = useMemo(() => round2(subtotal + tax - discount), [subtotal, tax, discount]);

  const resourceList: BillingResource[] = useMemo(() => {
    if (activeType === 'service') return resources.services;
    if (activeType === 'material') return resources.materials;
    return resources.packages;
  }, [activeType, resources]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.medical_id?.toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q)
    );
  }, [patients, patientSearch]);

  const filteredDoctors = useMemo(() => {
    const q = doctorSearch.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d) => `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) || (d.specialization || '').toLowerCase().includes(q));
  }, [doctors, doctorSearch]);

  const filteredResources = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return resourceList;
    return resourceList.filter((r) => r.name.toLowerCase().includes(q));
  }, [resourceList, itemSearch]);

  // ---- Handlers ------------------------------------------------------------

  const handleSelectDoctor = (d: ReceptionDoctor) => {
    const changed = d.id !== doctor?.id;
    setDoctor(d);
    // A new doctor invalidates patient + clinic + items — all are doctor-scoped
    // (items reference services/materials/packages the doctor is assigned to).
    if (changed) {
      setPatient(null);
      setClinic(d.clinics.length === 1 ? d.clinics[0] : null);
      setItems([]);
    }
    setPicker(null);
  };

  const addItem = (r: BillingResource) => {
    lineKeySeq += 1;
    const idField: Partial<InvoiceLineItemInput> =
      activeType === 'service'
        ? { service_id: r.id }
        : activeType === 'material'
        ? { medical_material_id: r.id }
        : { package_id: r.id };
    setItems((prev) => [
      ...prev,
      {
        key: `li-${lineKeySeq}`,
        name: r.name,
        item_type: activeType,
        description: r.name,
        quantity: 1,
        unit_price: round2(r.price || 0),
        ...idField,
      },
    ]);
    setPicker(null);
  };

  const updateItem = (key: string, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };
  const removeItem = (key: string) => setItems((prev) => prev.filter((it) => it.key !== key));

  const canSubmit = !!doctor && !!patient && items.length > 0 && !submitting && !loadingInvoice;

  const handleSubmit = async () => {
    if (!doctor || !patient) {
      Alert.alert(t('reception.ciErrorTitle'), t('reception.ciNeedDoctorPatient'));
      return;
    }
    if (items.length === 0) {
      Alert.alert(t('reception.ciErrorTitle'), t('reception.ciNeedItems'));
      return;
    }
    const payAmount = Number(payAmountText) || 0;
    if (!isEditing && recordPayment && !(payAmount > 0)) {
      Alert.alert(t('reception.ciErrorTitle'), t('reception.ciNeedPaymentAmount'));
      return;
    }

    setSubmitting(true);
    try {
      const lineItems = items.map(({ key, name, ...rest }) => rest);

      if (isEditing && editingId) {
        await updateInvoice({
          userId,
          invoiceId: editingId,
          doctorId: doctor.id,
          clinicId: clinic?.id ?? null,
          invoiceDate: toDateKey(invoiceDate),
          taxAmount: tax,
          discountAmount: discount,
          status,
          items: lineItems,
        });
        setCreatedNumber(editNumber || '');
        return;
      }

      const { invoice, invoiceNumber } = await createInvoice({
        userId,
        patientId: patient.patient_id,
        doctorId: doctor.id,
        clinicId: clinic?.id ?? null,
        invoiceDate: toDateKey(invoiceDate),
        taxAmount: tax,
        discountAmount: discount,
        status,
        items: lineItems,
      });

      // Optionally record a payment against the brand-new invoice.
      if (recordPayment && payAmount > 0) {
        try {
          await addInvoicePayment({
            userId,
            invoiceId: invoice.id,
            paymentDate: toDateKey(invoiceDate),
            amount: payAmount,
            paymentMethod: payMethod,
            referenceNumber: payReference.trim() || null,
          });
        } catch (e: any) {
          // The invoice exists; only the payment failed. Surface it but still
          // show the success screen with the created number.
          Alert.alert(
            t('reception.ciErrorTitle'),
            t('reception.ciPaymentFailed', { error: e?.message || '' })
          );
        }
      }

      setCreatedNumber(invoiceNumber);
    } catch (e: any) {
      Alert.alert(t('reception.ciErrorTitle'), e?.message || t('reception.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDoctor(null);
    setPatient(null);
    setClinic(null);
    setInvoiceDate(new Date());
    setStatus('draft');
    setItems([]);
    setTaxText('0');
    setDiscountText('0');
    setRecordPayment(false);
    setPayAmountText('');
    setPayMethod('cash');
    setPayReference('');
    setCreatedNumber(null);
  };

  const methodLabel = (m: PaymentMethod) =>
    t(`reception.pm_${m}`);

  // ---- Success screen ------------------------------------------------------

  if (createdNumber) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: colors.primaryLight }]}>
            <CheckCircle2 size={56} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>{isEditing ? t('reception.ciUpdatedTitle') : t('reception.ciSuccessTitle')}</Text>
          <Text style={[styles.successText, { color: colors.textSecondary }]}>
            {isEditing ? t('reception.ciUpdatedText', { number: createdNumber }) : t('reception.ciSuccessText', { number: createdNumber })}
          </Text>
          <View style={styles.successActions}>
            {isEditing ? (
              <TouchableOpacity style={styles.successPrimaryBtn} onPress={() => router.replace('/(reception-tabs)/statement' as any)} activeOpacity={0.9}>
                <LinearGradient colors={['#2D7DD2', '#15C2B0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.successPrimaryGrad}>
                  <Receipt size={20} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.successPrimaryText}>{t('reception.ciViewStatement')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.successPrimaryBtn} onPress={resetForm} activeOpacity={0.9}>
                  <LinearGradient colors={['#2D7DD2', '#15C2B0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.successPrimaryGrad}>
                    <Receipt size={20} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.successPrimaryText}>{t('reception.ciCreateAnother')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.successSecondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={() => router.push('/(reception-tabs)/statement' as any)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.successSecondaryText, { color: colors.primary }]}>{t('reception.ciViewStatement')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Form ----------------------------------------------------------------

  const SelectRow = ({
    icon: Icon,
    label,
    value,
    placeholder,
    onPress,
    disabled,
  }: {
    icon: any;
    label: string;
    value?: string | null;
    placeholder: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.selectBtn,
          { backgroundColor: colors.card, borderColor: value ? colors.primary : colors.border, opacity: disabled ? 0.5 : 1 },
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Icon size={18} color={colors.primary} strokeWidth={2} />
        <Text style={[styles.selectText, { color: value ? colors.text : colors.textTertiary }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? t('reception.ciEditTitle') : t('reception.ciTitle')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Doctor / patient / clinic. Doctor + patient are locked when editing. */}
        <SelectRow
          icon={Stethoscope}
          label={t('reception.ciDoctorLabel')}
          value={doctor ? `${doctor.first_name} ${doctor.last_name}`.trim() : null}
          placeholder={loadingDoctors ? t('reception.loading') : t('reception.ciSelectDoctor')}
          onPress={() => { setDoctorSearch(''); setPicker('doctor'); }}
          disabled={isEditing}
        />
        <SelectRow
          icon={Users}
          label={t('reception.ciPatientLabel')}
          value={patient ? patient.full_name : null}
          placeholder={!doctor ? t('reception.ciPatientNeedsDoctor') : t('reception.ciSelectPatient')}
          onPress={() => { setPatientSearch(''); setPicker('patient'); }}
          disabled={!doctor || isEditing}
        />
        {doctor && doctor.clinics.length > 0 ? (
          <SelectRow
            icon={Building2}
            label={t('reception.ciClinicLabel')}
            value={clinic ? clinic.name : null}
            placeholder={t('reception.ciSelectClinic')}
            onPress={() => setPicker('clinic')}
          />
        ) : null}

        {/* Status */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('reception.ciStatusLabel')}</Text>
          <View style={styles.segment}>
            {STATUSES.map((s) => {
              const active = status === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.segmentItem, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
                  onPress={() => setStatus(s)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                    {t(`reception.st_${s}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Line items */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('reception.ciItemsTitle')}</Text>

          {/* Type selector */}
          <View style={styles.segment}>
            {(['service', 'material', 'package'] as BillingItemType[]).map((typ) => {
              const active = activeType === typ;
              const label = typ === 'service' ? t('reception.ciTypeService') : typ === 'material' ? t('reception.ciTypeMaterial') : t('reception.ciTypePackage');
              return (
                <TouchableOpacity
                  key={typ}
                  style={[styles.segmentItem, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
                  onPress={() => setActiveType(typ)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, { color: active ? '#FFFFFF' : colors.textSecondary }]} numberOfLines={1}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.addItemBtn, { borderColor: colors.primary, opacity: !doctor || loadingResources ? 0.5 : 1 }]}
            onPress={() => { setItemSearch(''); setPicker('item'); }}
            activeOpacity={0.8}
            disabled={loadingResources || !doctor}
          >
            <Plus size={18} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.addItemText, { color: colors.primary }]}>
              {loadingResources ? t('reception.loading') : !doctor ? t('reception.ciSelectDoctorFirst') : t('reception.ciAddItem')}
            </Text>
          </TouchableOpacity>

          {items.length === 0 ? (
            <Text style={[styles.emptyItems, { color: colors.textTertiary }]}>{t('reception.ciNoItems')}</Text>
          ) : (
            <View style={{ gap: 12, marginTop: 12 }}>
              {items.map((it) => (
                <View key={it.key} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.itemTop}>
                    <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>{it.name}</Text>
                    <TouchableOpacity onPress={() => removeItem(it.key)} hitSlop={8}>
                      <Trash2 size={18} color="#EF4444" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.itemRow}>
                    <View style={styles.itemInputWrap}>
                      <Text style={[styles.itemInputLabel, { color: colors.textSecondary }]}>{t('reception.ciQty')}</Text>
                      <TextInput
                        style={[styles.itemInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                        value={String(it.quantity)}
                        onChangeText={(v) => updateItem(it.key, { quantity: Math.max(0, Number(v.replace(/[^0-9.]/g, '')) || 0) })}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.itemInputWrap}>
                      <Text style={[styles.itemInputLabel, { color: colors.textSecondary }]}>{t('reception.ciUnitPrice')}</Text>
                      <TextInput
                        style={[styles.itemInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                        value={String(it.unit_price)}
                        onChangeText={(v) => updateItem(it.key, { unit_price: Math.max(0, Number(v.replace(/[^0-9.]/g, '')) || 0) })}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.itemLineTotal}>
                      <Text style={[styles.itemInputLabel, { color: colors.textSecondary }]}>{t('reception.ciLineTotal')}</Text>
                      <Text style={[styles.itemLineTotalValue, { color: colors.text }]}>${round2(it.quantity * it.unit_price)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Tax / discount */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('reception.ciTax')}</Text>
            <TextInput
              style={[styles.moneyInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={taxText}
              onChangeText={(v) => setTaxText(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.col}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('reception.ciDiscount')}</Text>
            <TextInput
              style={[styles.moneyInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={discountText}
              onChangeText={(v) => setDiscountText(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Totals */}
        <View style={[styles.totalsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TotalsRow label={t('reception.ciSubtotal')} value={subtotal} colors={colors} />
          <TotalsRow label={t('reception.ciTax')} value={tax} colors={colors} />
          <TotalsRow label={t('reception.ciDiscount')} value={-discount} colors={colors} />
          <View style={[styles.totalsDivider, { backgroundColor: colors.border }]} />
          <TotalsRow label={t('reception.ciGrandTotal')} value={grandTotal} colors={colors} emphasize />
        </View>

        {/* Record payment (not shown when editing — payments are managed from
            the statement screen). */}
        {!isEditing ? (
          <View style={[styles.paymentToggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.paymentToggleLeft}>
              <CreditCard size={18} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.paymentToggleText, { color: colors.text }]}>{t('reception.ciRecordPayment')}</Text>
            </View>
            <Switch
              value={recordPayment}
              onValueChange={setRecordPayment}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        ) : null}

        {!isEditing && recordPayment ? (
          <View style={{ gap: 14, marginTop: 14 }}>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('reception.ciAmount')}</Text>
              <TextInput
                style={[styles.moneyInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={payAmountText}
                onChangeText={(v) => setPayAmountText(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder={String(grandTotal)}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <SelectRow
              icon={CreditCard}
              label={t('reception.ciPaymentMethod')}
              value={methodLabel(payMethod)}
              placeholder={methodLabel(payMethod)}
              onPress={() => setPicker('method')}
            />
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('reception.ciReference')}</Text>
              <TextInput
                style={[styles.moneyInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={payReference}
                onChangeText={setPayReference}
                placeholder={t('reception.ciReference')}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.9}
        >
          <LinearGradient colors={['#2D7DD2', '#15C2B0']} style={styles.primaryBtnGrad}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.confirmRow}>
                <Receipt size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.primaryBtnText}>{isEditing ? t('reception.ciSave') : t('reception.ciSubmit')}</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Pickers */}
      <Modal visible={!!picker} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <TouchableOpacity style={styles.pickerScrim} activeOpacity={1} onPress={() => setPicker(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerCard, { backgroundColor: colors.card }]}>
            <View style={[styles.pickerHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                {picker === 'doctor' ? t('reception.ciSelectDoctor')
                  : picker === 'patient' ? t('reception.ciSelectPatient')
                  : picker === 'clinic' ? t('reception.ciSelectClinic')
                  : picker === 'method' ? t('reception.ciPaymentMethod')
                  : t('reception.ciSelectItem')}
              </Text>
              <TouchableOpacity onPress={() => setPicker(null)} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {picker === 'patient' || picker === 'doctor' || picker === 'item' ? (
              <View style={[styles.searchWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <Search size={16} color={colors.textSecondary} strokeWidth={2} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder={picker === 'patient' ? t('reception.searchPatients') : picker === 'doctor' ? t('reception.ciSearchDoctor') : t('reception.ciSearchItem')}
                  placeholderTextColor={colors.textTertiary}
                  value={picker === 'patient' ? patientSearch : picker === 'doctor' ? doctorSearch : itemSearch}
                  onChangeText={picker === 'patient' ? setPatientSearch : picker === 'doctor' ? setDoctorSearch : setItemSearch}
                  autoCorrect={false}
                />
                {(picker === 'patient' ? patientSearch : picker === 'doctor' ? doctorSearch : itemSearch) ? (
                  <TouchableOpacity onPress={() => (picker === 'patient' ? setPatientSearch('') : picker === 'doctor' ? setDoctorSearch('') : setItemSearch(''))} hitSlop={8}>
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {picker === 'doctor' && (
                loadingDoctors ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} /> :
                filteredDoctors.length === 0 ? <Text style={[styles.pickerEmpty, { color: colors.textTertiary }]}>{t('reception.noDoctors')}</Text> :
                filteredDoctors.map((d) => (
                  <PickerRow key={d.id} label={`${d.first_name} ${d.last_name}`.trim()} sub={d.specialization} selected={doctor?.id === d.id} colors={colors} onPress={() => handleSelectDoctor(d)} />
                ))
              )}
              {picker === 'patient' && (
                loadingPatients ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} /> :
                filteredPatients.length === 0 ? <Text style={[styles.pickerEmpty, { color: colors.textTertiary }]}>{t('reception.noPatients')}</Text> :
                filteredPatients.map((p) => (
                  <PickerRow key={p.patient_id} label={p.full_name} sub={p.medical_id} selected={patient?.patient_id === p.patient_id} colors={colors} onPress={() => { setPatient(p); setPicker(null); }} />
                ))
              )}
              {picker === 'clinic' && doctor?.clinics.map((c) => (
                <PickerRow key={c.id} label={c.name} sub={c.address} selected={clinic?.id === c.id} colors={colors} onPress={() => { setClinic(c); setPicker(null); }} />
              ))}
              {picker === 'item' && (
                filteredResources.length === 0 ? <Text style={[styles.pickerEmpty, { color: colors.textTertiary }]}>{t('reception.ciNoResources')}</Text> :
                filteredResources.map((r) => (
                  <PickerRow key={r.id} label={r.name} sub={`$${round2(r.price || 0)}${r.unit ? ` · ${r.unit}` : ''}`} colors={colors} onPress={() => addItem(r)} />
                ))
              )}
              {picker === 'method' && PAYMENT_METHODS.map((m) => (
                <PickerRow key={m} label={methodLabel(m)} selected={payMethod === m} colors={colors} onPress={() => { setPayMethod(m); setPicker(null); }} />
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
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

function TotalsRow({ label, value, colors, emphasize }: { label: string; value: number; colors: any; emphasize?: boolean }) {
  return (
    <View style={totalsStyles.row}>
      <Text style={[emphasize ? totalsStyles.labelStrong : totalsStyles.label, { color: emphasize ? colors.text : colors.textSecondary }]}>{label}</Text>
      <Text style={[emphasize ? totalsStyles.valueStrong : totalsStyles.value, { color: emphasize ? colors.primary : colors.text }]}>
        ${Math.round((value + Number.EPSILON) * 100) / 100}
      </Text>
    </View>
  );
}

const pickerRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  text: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12.5, marginTop: 2 },
});

const totalsStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  label: { fontSize: 14 },
  labelStrong: { fontSize: 16, fontWeight: '800' },
  value: { fontSize: 14, fontWeight: '600' },
  valueStrong: { fontSize: 18, fontWeight: '800' },
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

    field: { marginBottom: 16 },
    fieldLabel: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
    selectBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14 },
    selectText: { flex: 1, fontSize: 15, fontWeight: '600' },

    segment: { flexDirection: 'row', gap: 8 },
    segmentItem: { flex: 1, height: 42, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    segmentText: { fontSize: 13.5, fontWeight: '700' },

    addItemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 12 },
    addItemText: { fontSize: 14.5, fontWeight: '800' },
    emptyItems: { fontSize: 13.5, fontStyle: 'italic', marginTop: 12, textAlign: 'center' },

    itemCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
    itemTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
    itemName: { flex: 1, fontSize: 15, fontWeight: '700' },
    itemRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    itemInputWrap: { flex: 1 },
    itemInputLabel: { fontSize: 11.5, fontWeight: '600', marginBottom: 5 },
    itemInput: { height: 44, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, fontSize: 15, fontWeight: '700' },
    itemLineTotal: { flex: 1, alignItems: 'flex-end' },
    itemLineTotalValue: { fontSize: 16, fontWeight: '800', paddingVertical: 11 },

    twoCol: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    col: { flex: 1 },
    moneyInput: { height: 52, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 16, fontWeight: '700' },

    totalsCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
    totalsDivider: { height: 1, marginVertical: 8 },

    paymentToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
    paymentToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    paymentToggleText: { fontSize: 15, fontWeight: '700' },

    primaryBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 22 },
    primaryBtnDisabled: { opacity: 0.5 },
    primaryBtnGrad: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    primaryBtnText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
    confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

    pickerScrim: { flex: 1, backgroundColor: 'rgba(2,6,23,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    pickerCard: { width: '100%', maxWidth: 420, borderRadius: 22, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16, maxHeight: '75%' },
    pickerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
    pickerTitle: { fontSize: 17, fontWeight: '800' },
    pickerList: { paddingTop: 4 },
    pickerEmpty: { fontSize: 14, textAlign: 'center', paddingVertical: 24 },

    searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1.5, marginTop: 12 },
    searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

    successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
    successIcon: { width: 104, height: 104, borderRadius: 52, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    successTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
    successText: { fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 360 },
    successActions: { alignSelf: 'stretch', marginTop: 18, gap: 12 },
    successPrimaryBtn: { borderRadius: 16, overflow: 'hidden' },
    successPrimaryGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
    successPrimaryText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
    successSecondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 16, borderWidth: 1.5 },
    successSecondaryText: { fontSize: 15, fontWeight: '800' },
  });

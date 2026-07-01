import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Hash,
  Mail,
  Phone,
  User,
  Calendar,
  Clock,
  Building2,
  Cake,
  Droplet,
  Map,
  Venus,
  ChevronRight,
  FileText,
  Receipt,
  Package,
  TriangleAlert,
  HeartPulse,
  Scissors,
  StickyNote,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPatientDetail,
  listPatientAppointments,
  getPatientOverview,
  getStatement,
  formatTime12,
  type ReceptionPatientDetail,
  type ReceptionAppointment,
  type PatientOverview,
  type PatientPackage,
  type StatementInvoice,
} from '@/utils/receptionApi';
import StatusBadge from '@/components/reception/StatusBadge';

const money = (n: number) => `$${Math.round((Number(n) + Number.EPSILON) * 100) / 100}`;

const PAID_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  paid: { bg: '#DCFCE7', fg: '#15803D' },
  partial: { bg: '#FEF3C7', fg: '#B45309' },
  unpaid: { bg: '#FEE2E2', fg: '#B91C1C' },
  overpaid: { bg: '#DBEAFE', fg: '#1D4ED8' },
};

// Reception "Patient details": tapping a patient opens THIS screen. It shows the
// patient's full profile, their medical records (read-only), purchased packages
// with remaining sessions, invoices, and appointment history. Every list item is
// collapsed by default and expands on tap to reveal its details.
export default function ReceptionPatientDetailScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId?: string }>();
  const patientId = params.patientId || '';

  const userId = session?.user?.realUserId || session?.user?.global_id || '';
  const companyId = session?.user?.company_id || null;

  const [patient, setPatient] = useState<ReceptionPatientDetail | null>(null);
  const [appointments, setAppointments] = useState<ReceptionAppointment[]>([]);
  const [overview, setOverview] = useState<PatientOverview | null>(null);
  const [invoices, setInvoices] = useState<StatementInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // One shared expand registry. Keys are namespaced ("appt:<id>", "inv:<id>",
  // "pkg:<id>", "med:<group>") so a single Set drives every collapsible item.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  const load = useCallback(async () => {
    if (!userId || !patientId) {
      setLoading(false);
      return;
    }
    setError('');
    try {
      const [detail, appts, ov, statement] = await Promise.all([
        getPatientDetail(userId, patientId, companyId),
        listPatientAppointments(userId, patientId, companyId).catch(() => [] as ReceptionAppointment[]),
        getPatientOverview(userId, patientId, companyId).catch(() => null),
        getStatement(userId, companyId, null, patientId).catch(() => null),
      ]);
      setPatient(detail);
      setAppointments(
        [...appts].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
      );
      setOverview(ov);
      setInvoices(statement?.invoices ?? []);
    } catch (e: any) {
      setError(e?.message || t('reception.errorGeneric'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, patientId, companyId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const initials = useMemo(() => {
    const name = patient?.full_name || '?';
    return name
      .split(' ')
      .map((n) => n[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [patient]);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const formatDate = (d?: string | null) => {
    if (!d) return '';
    const dt = new Date(`${String(d).slice(0, 10)}T00:00:00`);
    return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const age = useMemo(() => {
    if (!patient?.date_of_birth) return null;
    const dob = new Date(`${patient.date_of_birth}T00:00:00`);
    if (isNaN(dob.getTime())) return null;
    const now = new Date();
    let a = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a--;
    return a >= 0 && a < 150 ? a : null;
  }, [patient]);

  const med = overview?.medical_records;
  const packages = overview?.packages ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7} hitSlop={10}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('reception.patientDetailTitle', 'Patient details')}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 56 }} />
      ) : error ? (
        <View style={styles.center}>
          <User size={48} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity onPress={load} style={[styles.retry, { borderColor: colors.primary }]} activeOpacity={0.7}>
            <Text style={[styles.retryText, { color: colors.primary }]}>{t('reception.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* Identity header */}
          <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
              {patient?.full_name || t('reception.unknownPatient')}
            </Text>
            <View style={styles.idRow}>
              <Hash size={13} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.idText, { color: colors.textSecondary }]}>
                {patient?.medical_id || t('reception.detailNoMedicalId', 'No medical ID')}
              </Text>
            </View>
          </View>

          {/* Personal info */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('reception.detailProfile', 'Profile')}
          </Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <InfoRow icon={Cake} label={t('reception.dobLabel', 'Date of birth')}
              value={patient?.date_of_birth ? `${formatDate(patient.date_of_birth)}${age != null ? `  ·  ${age}` : ''}` : '—'} colors={colors} />
            <InfoRow icon={Venus} label={t('reception.genderLabel', 'Gender')} value={patient?.gender || '—'} colors={colors} />
            <InfoRow icon={Droplet} label={t('reception.bloodTypeLabel', 'Blood type')} value={patient?.blood_type || '—'} colors={colors} />
            <InfoRow icon={Map} label={t('reception.addressLabel', 'Address')} value={patient?.address || '—'} colors={colors} last />
          </View>

          {/* Contact */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('reception.detailContact', 'Contact')}
          </Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <InfoRow icon={Mail} label={t('reception.emailLabel', 'Email')} value={patient?.email || '—'} colors={colors} />
            <InfoRow icon={Phone} label={t('reception.phoneLabel', 'Phone number')} value={patient?.phone || '—'} colors={colors} />
            <InfoRow icon={Building2} label={t('reception.companyLabel', 'Clinic')} value={patient?.company_name || '—'} colors={colors} last />
          </View>

          {/* Medical records (read-only) */}
          <SectionHeader
            title={t('reception.detailMedicalRecords', 'Medical records')}
            count={med ? med.allergies.length + med.emergency_contacts.length + med.conditions.length + med.surgeries.length : 0}
            colors={colors}
          />
          <View style={styles.groupList}>
            <MedicalGroup
              icon={TriangleAlert}
              tint="#F59E0B"
              title={t('reception.detailAllergies', 'Allergies')}
              count={med?.allergies.length ?? 0}
              expanded={expanded.has('med:allergies')}
              onToggle={() => toggle('med:allergies')}
              emptyText={t('reception.detailNoAllergies', 'No allergies recorded.')}
              colors={colors}
            >
              {(med?.allergies ?? []).map((a) => (
                <RecordRow
                  key={a.id}
                  title={a.allergen || '—'}
                  sub={[a.type, a.severity].filter(Boolean).join(' · ')}
                  note={a.reaction}
                  colors={colors}
                />
              ))}
            </MedicalGroup>

            <MedicalGroup
              icon={Phone}
              tint="#15C2B0"
              title={t('reception.detailEmergencyContacts', 'Emergency contacts')}
              count={med?.emergency_contacts.length ?? 0}
              expanded={expanded.has('med:contacts')}
              onToggle={() => toggle('med:contacts')}
              emptyText={t('reception.detailNoEmergencyContacts', 'No emergency contacts recorded.')}
              colors={colors}
            >
              {(med?.emergency_contacts ?? []).map((c) => (
                <RecordRow
                  key={c.id}
                  title={`${c.name || '—'}${c.is_primary ? ' ★' : ''}`}
                  sub={c.relationship}
                  note={c.phone}
                  colors={colors}
                />
              ))}
            </MedicalGroup>

            <MedicalGroup
              icon={HeartPulse}
              tint="#2D7DD2"
              title={t('reception.detailConditions', 'Conditions')}
              count={med?.conditions.length ?? 0}
              expanded={expanded.has('med:conditions')}
              onToggle={() => toggle('med:conditions')}
              emptyText={t('reception.detailNoConditions', 'No conditions recorded.')}
              colors={colors}
            >
              {(med?.conditions ?? []).map((c) => (
                <RecordRow
                  key={c.id}
                  title={c.condition || '—'}
                  sub={c.diagnosed_on ? `${t('reception.detailDiagnosed', 'Diagnosed')}: ${formatDate(c.diagnosed_on)}` : ''}
                  note={c.notes}
                  colors={colors}
                />
              ))}
            </MedicalGroup>

            <MedicalGroup
              icon={Scissors}
              tint="#7C3AED"
              title={t('reception.detailSurgeries', 'Surgeries')}
              count={med?.surgeries.length ?? 0}
              expanded={expanded.has('med:surgeries')}
              onToggle={() => toggle('med:surgeries')}
              emptyText={t('reception.detailNoSurgeries', 'No surgeries recorded.')}
              colors={colors}
            >
              {(med?.surgeries ?? []).map((s) => (
                <RecordRow
                  key={s.id}
                  title={s.procedure || '—'}
                  sub={s.performed_on ? `${t('reception.detailPerformed', 'Performed')}: ${formatDate(s.performed_on)}` : ''}
                  note={s.notes}
                  colors={colors}
                />
              ))}
            </MedicalGroup>
          </View>
          <Text style={[styles.readOnlyNote, { color: colors.textTertiary }]}>
            {t('reception.detailMedicalReadOnly', 'Read-only. Patients manage this data from the mobile app.')}
          </Text>

          {/* Packages */}
          <SectionHeader
            title={t('reception.detailPackages', 'Packages')}
            count={packages.length}
            colors={colors}
          />
          {packages.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Package size={36} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('reception.detailNoPackages', 'No packages purchased.')}
              </Text>
            </View>
          ) : (
            <View style={styles.groupList}>
              {packages.map((p) => (
                <PackageCard
                  key={p.patient_package_id}
                  pkg={p}
                  expanded={expanded.has(`pkg:${p.patient_package_id}`)}
                  onToggle={() => toggle(`pkg:${p.patient_package_id}`)}
                  formatDate={formatDate}
                  colors={colors}
                  t={t}
                />
              ))}
            </View>
          )}

          {/* Invoices */}
          <SectionHeader
            title={t('reception.detailInvoices', 'Invoices')}
            count={invoices.length}
            colors={colors}
          />
          {invoices.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Receipt size={36} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('reception.detailNoInvoices', 'No invoices yet.')}
              </Text>
            </View>
          ) : (
            <View style={styles.groupList}>
              {invoices.map((inv) => (
                <InvoiceRow
                  key={inv.id}
                  invoice={inv}
                  expanded={expanded.has(`inv:${inv.id}`)}
                  onToggle={() => toggle(`inv:${inv.id}`)}
                  formatDate={formatDate}
                  colors={colors}
                  t={t}
                />
              ))}
            </View>
          )}

          {/* Appointments */}
          <SectionHeader
            title={t('reception.detailAppointments', 'Appointments')}
            count={appointments.length}
            colors={colors}
          />
          {appointments.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Calendar size={40} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('reception.detailNoAppointments', 'No appointments yet.')}
              </Text>
            </View>
          ) : (
            <View style={styles.groupList}>
              {appointments.map((a) => (
                <AppointmentRow
                  key={String(a.id)}
                  appt={a}
                  expanded={expanded.has(`appt:${a.id}`)}
                  onToggle={() => toggle(`appt:${a.id}`)}
                  formatDate={formatDate}
                  colors={colors}
                  t={t}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function SectionHeader({ title, count, colors }: { title: string; count: number; colors: any }) {
  return (
    <View style={headerStyles.row}>
      <Text style={[headerStyles.title, { color: colors.text }]}>{title}</Text>
      {count > 0 ? (
        <View style={[headerStyles.badge, { backgroundColor: colors.primaryLight || '#EAF3FC' }]}>
          <Text style={[headerStyles.badgeText, { color: colors.primary }]}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

function MedicalGroup({
  icon: Icon,
  tint,
  title,
  count,
  expanded,
  onToggle,
  emptyText,
  colors,
  children,
}: {
  icon: any;
  tint: string;
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  emptyText: string;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <View style={[collapStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={collapStyles.head} onPress={onToggle} activeOpacity={0.7}>
        <View style={[collapStyles.iconWrap, { backgroundColor: tint + '22' }]}>
          <Icon size={16} color={tint} strokeWidth={2.2} />
        </View>
        <Text style={[collapStyles.headTitle, { color: colors.text }]}>{title}</Text>
        <View style={[collapStyles.countPill, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[collapStyles.countText, { color: colors.textSecondary }]}>{count}</Text>
        </View>
        <ChevronRight
          size={18}
          color={colors.textSecondary}
          strokeWidth={2.5}
          style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
        />
      </TouchableOpacity>
      {expanded ? (
        <View style={[collapStyles.body, { borderTopColor: colors.border }]}>
          {count === 0 ? (
            <Text style={[collapStyles.emptyText, { color: colors.textTertiary }]}>{emptyText}</Text>
          ) : (
            children
          )}
        </View>
      ) : null}
    </View>
  );
}

function RecordRow({ title, sub, note, colors }: { title: string; sub?: string | null; note?: string | null; colors: any }) {
  return (
    <View style={recordStyles.row}>
      <Text style={[recordStyles.title, { color: colors.text }]}>{title}</Text>
      {sub ? <Text style={[recordStyles.sub, { color: colors.textSecondary }]}>{sub}</Text> : null}
      {note ? (
        <View style={recordStyles.noteRow}>
          <StickyNote size={12} color={colors.textTertiary} strokeWidth={2} />
          <Text style={[recordStyles.note, { color: colors.textTertiary }]}>{note}</Text>
        </View>
      ) : null}
    </View>
  );
}

function PackageCard({
  pkg,
  expanded,
  onToggle,
  formatDate,
  colors,
  t,
}: {
  pkg: PatientPackage;
  expanded: boolean;
  onToggle: () => void;
  formatDate: (d?: string | null) => string;
  colors: any;
  t: any;
}) {
  const allUsed = pkg.total_sessions > 0 && pkg.remaining_sessions <= 0;
  return (
    <View style={[collapStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={collapStyles.head} onPress={onToggle} activeOpacity={0.7}>
        <View style={[collapStyles.iconWrap, { backgroundColor: '#15C2B022' }]}>
          <Package size={16} color="#15C2B0" strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[collapStyles.headTitle, { color: colors.text }]} numberOfLines={1}>{pkg.package_name || '—'}</Text>
          {pkg.buy_date ? (
            <Text style={[pkgStyles.date, { color: colors.textTertiary }]}>{formatDate(pkg.buy_date)}</Text>
          ) : null}
        </View>
        <View style={[pkgStyles.remainBadge, { backgroundColor: allUsed ? '#FEE2E2' : '#DCFCE7' }]}>
          <Text style={[pkgStyles.remainText, { color: allUsed ? '#B91C1C' : '#15803D' }]}>
            {pkg.remaining_sessions}/{pkg.total_sessions} {t('reception.detailSessionsLeft', 'left')}
          </Text>
        </View>
        <ChevronRight
          size={18}
          color={colors.textSecondary}
          strokeWidth={2.5}
          style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
        />
      </TouchableOpacity>
      {expanded ? (
        <View style={[collapStyles.body, { borderTopColor: colors.border }]}>
          {pkg.services.length === 0 ? (
            <Text style={[collapStyles.emptyText, { color: colors.textTertiary }]}>
              {t('reception.detailNoPackageServices', 'No services in this package.')}
            </Text>
          ) : (
            pkg.services.map((s) => {
              const done = s.total_sessions > 0 && s.remaining_sessions <= 0;
              return (
                <View key={s.service_id || s.service_name} style={pkgStyles.svcRow}>
                  <Text style={[pkgStyles.svcName, { color: colors.text }]} numberOfLines={1}>{s.service_name || '—'}</Text>
                  <Text style={[pkgStyles.svcUsage, { color: colors.textSecondary }]}>
                    {t('reception.detailUsed', 'Used')} {s.used_sessions}/{s.total_sessions}
                  </Text>
                  <View style={[pkgStyles.svcPill, { backgroundColor: done ? '#FEE2E2' : '#DCFCE7' }]}>
                    <Text style={[pkgStyles.svcPillText, { color: done ? '#B91C1C' : '#15803D' }]}>{s.remaining_sessions}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}

function InvoiceRow({
  invoice,
  expanded,
  onToggle,
  formatDate,
  colors,
  t,
}: {
  invoice: StatementInvoice;
  expanded: boolean;
  onToggle: () => void;
  formatDate: (d?: string | null) => string;
  colors: any;
  t: any;
}) {
  const sc = PAID_STATUS_COLORS[invoice.payment_status] || { bg: colors.backgroundSecondary, fg: colors.textSecondary };
  const payments = invoice.payments || [];
  return (
    <View style={[collapStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={collapStyles.head} onPress={onToggle} activeOpacity={0.7}>
        <View style={[collapStyles.iconWrap, { backgroundColor: '#2D7DD222' }]}>
          <FileText size={16} color="#2D7DD2" strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[collapStyles.headTitle, { color: colors.text }]} numberOfLines={1}>#{invoice.invoice_number}</Text>
          <Text style={[pkgStyles.date, { color: colors.textTertiary }]} numberOfLines={1}>
            {formatDate(invoice.invoice_date)}{invoice.doctor_name ? ` · ${invoice.doctor_name}` : ''}
          </Text>
        </View>
        <View style={invStyles.right}>
          <Text style={[invStyles.total, { color: colors.text }]}>{money(invoice.total_amount)}</Text>
          <View style={[invStyles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[invStyles.badgeText, { color: sc.fg }]}>{t(`reception.ps_${invoice.payment_status}`, invoice.payment_status)}</Text>
          </View>
        </View>
        <ChevronRight
          size={18}
          color={colors.textSecondary}
          strokeWidth={2.5}
          style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
        />
      </TouchableOpacity>
      {expanded ? (
        <View style={[collapStyles.body, { borderTopColor: colors.border }]}>
          <View style={invStyles.amountsRow}>
            <AmountChip label={t('reception.stmPaid', 'Paid')} value={money(invoice.paid_amount)} colors={colors} />
            <AmountChip label={t('reception.stmBalance', 'Balance')} value={money(invoice.balance_due)} colors={colors} />
          </View>

          {invoice.items.length === 0 ? (
            <Text style={[collapStyles.emptyText, { color: colors.textTertiary, marginTop: 10 }]}>{t('reception.stmNoItems', 'No line items.')}</Text>
          ) : (
            invoice.items.map((it, idx) => (
              <View key={idx} style={invStyles.itemRow}>
                <Text style={[invStyles.itemName, { color: colors.text }]} numberOfLines={1}>{it.name}</Text>
                <Text style={[invStyles.itemQty, { color: colors.textSecondary }]}>×{it.quantity}</Text>
                <Text style={[invStyles.itemTotal, { color: colors.text }]}>{money(it.line_total)}</Text>
              </View>
            ))
          )}

          {payments.length > 0 ? (
            <>
              <Text style={[invStyles.paymentsTitle, { color: colors.textSecondary, borderTopColor: colors.border }]}>
                {t('reception.stmPayments', 'Payments')}
              </Text>
              {payments.map((p) => (
                <View key={p.id} style={invStyles.itemRow}>
                  <Text style={[invStyles.itemName, { color: colors.text }]} numberOfLines={1}>
                    {t(`reception.pm_${p.payment_method}`, p.payment_method)} · {formatDate(p.payment_date)}
                  </Text>
                  <Text style={[invStyles.itemTotal, { color: '#15803D' }]}>{money(p.amount)}</Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function AppointmentRow({
  appt,
  expanded,
  onToggle,
  formatDate,
  colors,
  t,
}: {
  appt: ReceptionAppointment;
  expanded: boolean;
  onToggle: () => void;
  formatDate: (d?: string | null) => string;
  colors: any;
  t: any;
}) {
  return (
    <View style={[collapStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={collapStyles.head} onPress={onToggle} activeOpacity={0.7}>
        <View style={[collapStyles.iconWrap, { backgroundColor: '#7C3AED22' }]}>
          <Calendar size={16} color="#7C3AED" strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[collapStyles.headTitle, { color: colors.text }]}>{formatDate(appt.date)}</Text>
          <View style={apptStyles.timeRow}>
            <Clock size={12} color={colors.textTertiary} strokeWidth={2} />
            <Text style={[pkgStyles.date, { color: colors.textTertiary }]}>{formatTime12(appt.time)}</Text>
          </View>
        </View>
        <StatusBadge status={appt.status} />
        <ChevronRight
          size={18}
          color={colors.textSecondary}
          strokeWidth={2.5}
          style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }], marginLeft: 6 }}
        />
      </TouchableOpacity>
      {expanded ? (
        <View style={[collapStyles.body, { borderTopColor: colors.border }]}>
          {appt.doctorName ? (
            <View style={apptStyles.metaRow}>
              <User size={13} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[apptStyles.meta, { color: colors.textSecondary }]} numberOfLines={1}>{appt.doctorName}</Text>
            </View>
          ) : null}
          {appt.clinicName ? (
            <View style={apptStyles.metaRow}>
              <Building2 size={13} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[apptStyles.meta, { color: colors.textSecondary }]} numberOfLines={1}>{appt.clinicName}</Text>
            </View>
          ) : null}
          {appt.clinicAddress ? (
            <View style={apptStyles.metaRow}>
              <Map size={13} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[apptStyles.meta, { color: colors.textSecondary }]} numberOfLines={2}>{appt.clinicAddress}</Text>
            </View>
          ) : null}
          {appt.notes ? (
            <View style={apptStyles.metaRow}>
              <StickyNote size={13} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[apptStyles.meta, { color: colors.textSecondary }]}>{appt.notes}</Text>
            </View>
          ) : null}
          {!appt.doctorName && !appt.clinicName && !appt.clinicAddress && !appt.notes ? (
            <Text style={[collapStyles.emptyText, { color: colors.textTertiary }]}>
              {t('reception.detailNoApptDetails', 'No additional details.')}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function AmountChip({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View>
      <Text style={[invStyles.chipLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[invStyles.chipValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  colors,
  last,
}: {
  icon: any;
  label: string;
  value: string;
  colors: any;
  last?: boolean;
}) {
  return (
    <View style={[infoRowStyles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <Icon size={17} color={colors.primary} strokeWidth={2} />
      <Text style={[infoRowStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[infoRowStyles.value, { color: colors.text }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  label: { fontSize: 13.5, fontWeight: '600', width: 96 },
  value: { fontSize: 14.5, fontWeight: '700', flex: 1, textAlign: 'right' },
});

const headerStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '800' },
  badge: { paddingHorizontal: 9, paddingVertical: 2, borderRadius: 999, minWidth: 22, alignItems: 'center' },
  badgeText: { fontSize: 12.5, fontWeight: '800' },
});

const collapStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  iconWrap: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  headTitle: { fontSize: 14.5, fontWeight: '700' },
  countPill: { paddingHorizontal: 9, paddingVertical: 2, borderRadius: 999, minWidth: 22, alignItems: 'center' },
  countText: { fontSize: 12.5, fontWeight: '700' },
  body: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, gap: 10 },
  emptyText: { fontSize: 13, fontStyle: 'italic' },
});

const recordStyles = StyleSheet.create({
  row: { gap: 3 },
  title: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 12.5, fontWeight: '600' },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  note: { fontSize: 12.5, flex: 1 },
});

const pkgStyles = StyleSheet.create({
  date: { fontSize: 12, marginTop: 2 },
  remainBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  remainText: { fontSize: 11.5, fontWeight: '800' },
  svcRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  svcName: { flex: 1, fontSize: 13.5, fontWeight: '600' },
  svcUsage: { fontSize: 12.5, fontWeight: '600' },
  svcPill: { minWidth: 28, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignItems: 'center' },
  svcPillText: { fontSize: 12.5, fontWeight: '800' },
});

const invStyles = StyleSheet.create({
  right: { alignItems: 'flex-end', gap: 5 },
  total: { fontSize: 14.5, fontWeight: '800' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 10.5, fontWeight: '800', textTransform: 'capitalize' },
  amountsRow: { flexDirection: 'row', gap: 24 },
  chipLabel: { fontSize: 11, fontWeight: '600' },
  chipValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemName: { flex: 1, fontSize: 13.5, fontWeight: '600' },
  itemQty: { fontSize: 13, fontWeight: '600' },
  itemTotal: { fontSize: 13.5, fontWeight: '700', minWidth: 60, textAlign: 'right' },
  paymentsTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 4, paddingTop: 10, borderTopWidth: 1 },
});

const apptStyles = StyleSheet.create({
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
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
    headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },

    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },

    profileCard: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 22 },
    avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
    name: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    idRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    idText: { fontSize: 13.5, fontWeight: '600' },

    sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
    infoCard: { borderRadius: 16, paddingHorizontal: 16, marginBottom: 22 },

    groupList: { gap: 12, marginBottom: 10 },
    readOnlyNote: { fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginBottom: 22, marginTop: 2 },

    emptyCard: { borderRadius: 18, padding: 28, alignItems: 'center', gap: 12, marginBottom: 22 },
    emptyText: { fontSize: 14.5, fontWeight: '600', textAlign: 'center' },
    retry: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5 },
    retryText: { fontSize: 14, fontWeight: '700' },
  });

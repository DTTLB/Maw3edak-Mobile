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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Users,
  Search,
  Calendar,
  Phone,
  Mail,
  X,
  CalendarDays,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/utils/config';
import BackButton from '@/components/BackButton';
import { useTranslation } from 'react-i18next';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';

interface Patient {
  patient_id: string;
  medical_id: string;
  full_name: string;
  email: string;
  phone: string;
  company_id: string;
  company_name: string;
  appointment_count: number;
  last_appointment_date: string;
}

interface GroupedPatient {
  medical_id: string;
  full_name: string;
  email: string;
  phone: string;
  companies: { id: string; name: string }[];
  total_appointments: number;
  last_appointment_date: string;
}

export default function DoctorPatientsScreen() {
  const { isDark } = useTheme();
  const { session } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);

  const [, setPatients] = useState<Patient[]>([]);
  const [groupedPatients, setGroupedPatients] = useState<GroupedPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<GroupedPatient[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const groupPatientsByMedicalId = useCallback((patientsList: Patient[]): GroupedPatient[] => {
    const grouped = new Map<string, GroupedPatient>();
    patientsList.forEach(patient => {
      const medicalId = patient.medical_id || 'unknown';
      if (grouped.has(medicalId)) {
        const existing = grouped.get(medicalId)!;
        const companyExists = existing.companies.some(c => c.id === patient.company_id);
        if (!companyExists) {
          existing.companies.push({ id: patient.company_id, name: patient.company_name });
        }
        existing.total_appointments += patient.appointment_count;
        if (new Date(patient.last_appointment_date) > new Date(existing.last_appointment_date)) {
          existing.last_appointment_date = patient.last_appointment_date;
        }
      } else {
        grouped.set(medicalId, {
          medical_id: medicalId,
          full_name: patient.full_name,
          email: patient.email,
          phone: patient.phone,
          companies: [{ id: patient.company_id, name: patient.company_name }],
          total_appointments: patient.appointment_count,
          last_appointment_date: patient.last_appointment_date,
        });
      }
    });
    return Array.from(grouped.values());
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;
      if (!globalId) { setLoading(false); setRefreshing(false); return; }
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-patients?global_id=${globalId}${companyId ? `&company_id=${companyId}` : ''}`,
        { headers: { Authorization: `Bearer ${config.supabaseAnonKey}`, 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (data.patients) {
        // Hide deleted/anonymized patients (name "Deleted User",
        // email deleted-…@deleted.invalid, phone deleted-…) so accounts removed
        // via in-app account deletion never appear in the doctor's list.
        const visiblePatients = (data.patients as Patient[]).filter((p) => {
          const email = p.email?.toLowerCase() ?? '';
          const name = p.full_name?.trim().toLowerCase() ?? '';
          const phone = p.phone ?? '';
          return !(email.endsWith('@deleted.invalid') || name === 'deleted user' || phone.startsWith('deleted-'));
        });
        setPatients(visiblePatients);
        const grouped = groupPatientsByMedicalId(visiblePatients);
        setGroupedPatients(grouped);
        setFilteredPatients(grouped);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.global_id, session?.user?.company_id, groupPatientsByMedicalId]);

  useEffect(() => {
    if (session?.user?.global_id) fetchPatients();
  }, [session?.user?.global_id, fetchPatients]);

  useEffect(() => {
    if (session?.user?.company_id) { setSearchQuery(''); fetchPatients(); }
  }, [session?.user?.company_id, fetchPatients]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPatients(groupedPatients);
    } else {
      const query = searchQuery.toLowerCase().trim();
      setFilteredPatients(
        groupedPatients.filter(p =>
          p.full_name.toLowerCase().includes(query) ||
          p.medical_id.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.phone?.toLowerCase().includes(query) ||
          p.companies.some(c => c.name.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, groupedPatients]);

  const onRefresh = () => { setRefreshing(true); fetchPatients(); };

  const openPatientAppointments = (patient: GroupedPatient) => {
    router.push({
      pathname: '/(doctor-tabs)/patient-appointments',
      params: { medical_id: patient.medical_id, patient_name: patient.full_name },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: P.pageBg }]}>
        <View style={[styles.header, { backgroundColor: P.cardBg, borderBottomColor: P.border }]}>
          <BackButton color={P.text} />
          <Text style={[styles.headerTitle, { color: P.text }]}>{t('patients.title')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={P.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.pageBg }]}>
      <View style={[styles.header, { backgroundColor: P.cardBg, borderBottomColor: P.border }]}>
        <BackButton color={P.text} />
        <Text style={[styles.headerTitle, { color: P.text }]}>{t('patients.title')}</Text>
        <View style={[styles.countBadge, { backgroundColor: P.lightBlue }]}>
          <Text style={styles.countBadgeText}>{filteredPatients.length}</Text>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: P.cardBg, borderBottomColor: P.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: P.inputBg, borderColor: P.inputBorder }]}>
          <Search size={18} color={P.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: P.text }]}
            placeholder={t('patients.searchPlaceholder')}
            placeholderTextColor={P.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={P.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={P.primary} />}
      >
        <View style={styles.content}>
          {filteredPatients.length === 0 ? (
            <View style={[styles.emptyStateCard, { backgroundColor: P.cardBg }]}>
              <Users size={56} color={P.placeholder} strokeWidth={1.5} />
              <Text style={[styles.emptyStateTitle, { color: P.text }]}>{t('patients.noPatientsTitle')}</Text>
              <Text style={[styles.emptyStateText, { color: P.textSecondary }]}>
                {searchQuery.trim() ? t('patients.noPatientsSearch') : t('patients.noPatientsText')}
              </Text>
            </View>
          ) : (
            filteredPatients.map((patient) => (
              <View key={patient.medical_id} style={[styles.patientCard, { backgroundColor: P.cardBg }]}>
                <View style={styles.patientHeader}>
                  <View style={styles.patientInfo}>
                    <Text style={[styles.patientName, { color: P.text }]}>{patient.full_name}</Text>
                    <Text style={[styles.medicalId, { color: P.textSecondary }]}>
                      {patient.medical_id || t('patients.noMedicalId')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.scheduleBtn}
                    onPress={() => openPatientAppointments(patient)}
                    activeOpacity={0.75}
                  >
                    <CalendarDays size={15} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.scheduleBtnText}>{t('patients.visits')}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.companiesContainer}>
                  {patient.companies.map((company) => (
                    <View key={company.id} style={[styles.companyBadge, { backgroundColor: P.rowBg }]}>
                      <Text style={[styles.companyText, { color: P.text }]} numberOfLines={1}>
                        {company.name}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.patientDetails}>
                  {patient.phone ? (
                    <View style={styles.detailRow}>
                      <Phone size={14} color={P.textSecondary} />
                      <Text style={[styles.detailText, { color: P.textSecondary }]}>{patient.phone}</Text>
                    </View>
                  ) : null}
                  {patient.email ? (
                    <View style={styles.detailRow}>
                      <Mail size={14} color={P.textSecondary} />
                      <Text style={[styles.detailText, { color: P.textSecondary }]} numberOfLines={1}>{patient.email}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Calendar size={14} color={P.textSecondary} />
                    <Text style={[styles.detailText, { color: P.textSecondary }]}>
                      {patient.total_appointments === 1
                        ? t('patients.appointmentCountOne', { count: patient.total_appointments })
                        : t('patients.appointmentCountOther', { count: patient.total_appointments })}
                      {patient.last_appointment_date ? t('patients.lastVisit', { date: new Date(patient.last_appointment_date).toLocaleDateString() }) : ''}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (P: DoctorPalette) => StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 26, fontWeight: '700' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countBadgeText: { fontSize: 13, fontWeight: '700', color: P.primary },

  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },

  scrollView: { flex: 1 },
  content: { padding: 16, gap: 12 },

  patientCard: {
    borderRadius: 14,
    padding: 16,
    shadowColor: P.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  patientInfo: { flex: 1, paddingRight: 8 },
  patientName: { fontSize: 17, fontWeight: '600', marginBottom: 3 },
  medicalId: { fontSize: 13 },

  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: P.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  scheduleBtnText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },

  companiesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  companyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  companyText: { fontSize: 12, fontWeight: '500' },

  patientDetails: { gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, flex: 1 },

  emptyStateCard: {
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyStateTitle: { fontSize: 20, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 14, textAlign: 'center' },
});

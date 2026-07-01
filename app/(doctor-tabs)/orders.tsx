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
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Package, Search, Calendar, User, Users, FileText, X, ChevronRight, ChevronDown, Check, Filter, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/utils/config';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';

interface OrderFile {
  id: string;
  file_path: string;
  file_name: string;
}

interface Order {
  id: string;
  order_type: string;
  doctor_notes: string;
  file_path: string | null;
  files: OrderFile[];
  created_at: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialization: string;
  patient_name: string;
  patient_medical_id: string;
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

export default function DoctorOrdersScreen() {
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const { t } = useTranslation();
  const P = useMemo(() => {
    const base = getDoctorPalette(isDark);
    // Brand color overlay (visual restyle only) — premium medical palette.
    return isDark
      ? {
          ...base,
          primary: '#4FA3E6', // brand Blue (lightened for dark)
          lightBlue: '#16324E',
          avatarBg: '#16324E',
          iconCardBorder: '#1E3A5F',
          dashed: '#2D5C8A',
          success: '#2BD4C2', // brand Turquoise (lightened)
          successBg: 'rgba(21,194,176,0.18)',
          danger: '#FF8475', // brand Coral (lightened)
          dangerBg: 'rgba(255,111,97,0.18)',
        }
      : {
          ...base,
          primary: '#2D7DD2', // brand Blue
          lightBlue: '#EAF3FC',
          avatarBg: '#EAF3FC',
          iconCardBorder: '#DCEBFA',
          dashed: '#BFD9F5',
          success: '#15C2B0', // brand Turquoise
          successBg: '#E4F8F4',
          danger: '#FF6F61', // brand Coral
          dangerBg: '#FFEDEB',
        };
  }, [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

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
      Alert.alert(t('common.error'), t('doctorOrders.failedToLoadDoctors'));
    } finally {
      setLoading(false);
    }
  }, [session?.user?.global_id, session?.user?.company_id, t]);

  const loadInitialData = useCallback(async () => {
    await loadDoctorsList();
  }, [loadDoctorsList]);

  const loadOrders = useCallback(async (doctorId: string, patientMedicalId: string) => {
    if (!doctorId || !patientMedicalId) return;
    try {
      setLoading(true);

      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;
      if (!globalId) {
        console.error('No global_id found in session');
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-orders?global_id=${globalId}${companyId ? `&company_id=${companyId}` : ''}&doctor_id=${doctorId}&patient_medical_id=${patientMedicalId}`,
        {
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      const loadedOrders = data.orders || [];
      setOrders(loadedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert(t('common.error'), t('doctorOrders.failedToLoadOrders'));
    } finally {
      setLoading(false);
    }
  }, [session?.user?.global_id, session?.user?.company_id, t]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const applyDateFilter = useCallback(() => {
    let filtered = [...orders];

    if (selectedDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);

        switch (selectedDateFilter) {
          case 'today':
            return orderDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orderDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return orderDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
  }, [orders, selectedDateFilter]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (session?.user?.company_id) {
      setSelectedDoctor(null);
      setSelectedPatient(null);
      setOrders([]);
      setPatients([]);
      setPatientSearchQuery('');
      loadInitialData();
    }
  }, [session?.user?.company_id, loadInitialData]);

  useEffect(() => {
    setSelectedPatient(null);
    setOrders([]);
    setFilteredOrders([]);
    setPatients([]);
    setPatientSearchQuery('');
    if (selectedDoctor) {
      loadPatients(selectedDoctor.id);
    }
  }, [selectedDoctor, loadPatients]);

  useEffect(() => {
    if (selectedDoctor && selectedPatient?.medical_id) {
      loadOrders(selectedDoctor.id, selectedPatient.medical_id);
    } else {
      setOrders([]);
      setFilteredOrders([]);
    }
  }, [selectedPatient, selectedDoctor, loadOrders]);

  useEffect(() => {
    applyDateFilter();
  }, [applyDateFilter]);

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(
      expandedOrder === orderId ? null : orderId
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && doctors.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: P.pageBg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={P.primary} />
          <Text style={[styles.loadingText, { color: P.textSecondary }]}>
            {t('doctorOrders.loadingOrders')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.pageBg }]}>
      {/* Clean white professional header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(doctor-tabs)')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={P.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={styles.headerIconCard}>
            <Package size={26} color={P.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>{t('doctorOrders.title')}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{t('doctorOrders.subtitle')}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowDateModal(true)}
          activeOpacity={0.7}
        >
          <Filter size={20} color={P.primary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={P.primary}
          />
        }
      >
        {/* Select order context card */}
        <View style={styles.contextCard}>
          <View style={styles.contextHeader}>
            <View style={styles.contextIconBubble}>
              <Users size={22} color={P.primary} strokeWidth={2} />
            </View>
            <View style={styles.contextHeaderText}>
              <Text style={styles.contextTitle}>{t('doctorOrders.contextTitle')}</Text>
              <Text style={styles.contextSubtitle}>{t('doctorOrders.contextSubtitle')}</Text>
            </View>
          </View>

          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('doctorOrders.selectDoctor')}</Text>
              <TouchableOpacity
                style={styles.select}
                onPress={() => setShowDoctorModal(true)}
                activeOpacity={0.7}
              >
                <User size={18} color={P.textSecondary} />
                <Text
                  style={[styles.selectText, { color: selectedDoctor ? P.text : P.placeholder }]}
                  numberOfLines={1}
                >
                  {selectedDoctor ? selectedDoctor.name : t('doctorOrders.chooseDoctor')}
                </Text>
                <ChevronDown size={18} color={P.chevron} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('doctorOrders.selectPatient')}</Text>
              <TouchableOpacity
                style={[styles.select, !selectedDoctor && styles.selectDisabled]}
                onPress={() => selectedDoctor && setShowPatientModal(true)}
                disabled={!selectedDoctor}
                activeOpacity={0.7}
              >
                <User size={18} color={!selectedDoctor ? P.placeholder : P.textSecondary} />
                <Text
                  style={[styles.selectText, { color: selectedPatient ? P.text : P.placeholder }]}
                  numberOfLines={1}
                >
                  {selectedPatient ? selectedPatient.full_name : t('doctorOrders.choosePatient')}
                </Text>
                <ChevronDown size={18} color={!selectedDoctor ? P.placeholder : P.chevron} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {filteredOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyDashed}>
              <View style={styles.emptyIconCircle}>
                <Package size={48} color={P.primary} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle}>
                {!selectedDoctor || !selectedPatient
                  ? t('doctorOrders.emptyTitle')
                  : selectedDateFilter !== 'all'
                  ? t('doctorOrders.noOrdersForDateRange')
                  : t('doctorOrders.noOrdersYet')}
              </Text>
              {(!selectedDoctor || !selectedPatient) && (
                <Text style={styles.emptyDesc}>{t('doctorOrders.emptyDescription')}</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => toggleOrderExpansion(order.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderLeft}>
                      <View style={styles.iconContainer}>
                        <Package size={20} color={P.primary} />
                      </View>
                      <View style={styles.orderHeaderText}>
                        <Text style={styles.orderType}>
                          {order.order_type}
                        </Text>
                        <Text style={styles.patientName}>
                          {order.patient_name}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight
                      size={20}
                      color={P.placeholder}
                      style={{
                        transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                      }}
                    />
                  </View>

                  <View style={styles.doctorInfo}>
                    <User size={14} color={P.textSecondary} />
                    <Text style={styles.doctorText}>
                      {t('doctorOrders.doctorPrefix', { name: order.doctor_name })}
                    </Text>
                  </View>

                  <View style={styles.orderMeta}>
                    <View style={styles.metaItem}>
                      <Calendar size={14} color={P.textSecondary} />
                      <Text style={styles.metaText}>
                        {formatDate(order.created_at)}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <User size={14} color={P.textSecondary} />
                      <Text style={styles.metaText}>
                        {t('doctorOrders.idLabel', { id: order.patient_medical_id })}
                      </Text>
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={styles.orderDetails}>
                      <View style={styles.divider} />

                      {order.doctor_notes && (
                        <View style={styles.notesContainer}>
                          <View style={styles.notesHeader}>
                            <FileText size={16} color={P.textSecondary} />
                            <Text style={styles.notesLabel}>
                              {t('doctorOrders.doctorNotes')}
                            </Text>
                          </View>
                          <Text style={styles.notesText}>
                            {order.doctor_notes}
                          </Text>
                        </View>
                      )}

                      {order.files && order.files.length > 0 ? (
                        <View style={styles.fileContainer}>
                          {order.files.map((file) => (
                            <TouchableOpacity
                              key={file.id}
                              style={styles.fileButton}
                              onPress={() => {
                                const url = `${config.supabaseUrl}/storage/v1/object/public/doctor-order-files/${file.file_path}`;
                                Linking.openURL(url);
                              }}
                              activeOpacity={0.7}
                            >
                              <FileText size={16} color={P.primary} />
                              <Text style={styles.fileLabel} numberOfLines={1}>
                                {file.file_name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : order.file_path ? (
                        <TouchableOpacity
                          style={styles.fileButton}
                          onPress={() => {
                            const url = `${config.supabaseUrl}/storage/v1/object/public/doctor-order-files/${order.file_path}`;
                            Linking.openURL(url);
                          }}
                          activeOpacity={0.7}
                        >
                          <FileText size={16} color={P.primary} />
                          <Text style={styles.fileLabel}>
                            {t('doctorOrders.openFile', { type: order.order_type })}
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>
                          {t('doctorOrders.orderInformation')}
                        </Text>
                        <View style={styles.infoItem}>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>
                              {t('doctorOrders.doctorLabel')}
                            </Text>
                            <Text style={styles.infoValue}>
                              {t('doctorOrders.doctorPrefix', { name: order.doctor_name })}
                            </Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>
                              {t('doctorOrders.specializationLabel')}
                            </Text>
                            <Text style={styles.infoValue}>
                              {order.doctor_specialization}
                            </Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>
                              {t('doctorOrders.patientLabel')}
                            </Text>
                            <Text style={styles.infoValue}>
                              {order.patient_name}
                            </Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>
                              {t('doctorOrders.medicalIdLabel')}
                            </Text>
                            <Text style={styles.infoValue}>
                              {order.patient_medical_id}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

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
              style={[styles.modalContent, { backgroundColor: colors.card }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('doctorOrders.selectDoctor')}
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowDoctorModal(false);
                  setDoctorSearchQuery('');
                }}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.modalSearchContainer, { backgroundColor: colors.background }]}>
                <Search size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.modalSearchInput, { color: colors.text }]}
                  placeholder={t('doctorOrders.searchDoctors')}
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
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                {loadingDoctors ? (
                  <View style={styles.modalLoading}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : filteredDoctors.length === 0 ? (
                  <View style={styles.modalLoading}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      {doctorSearchQuery ? t('doctorOrders.noMatchingDoctors') : t('doctorOrders.noDoctorsFound')}
                    </Text>
                  </View>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <TouchableOpacity
                      key={doctor.id}
                      style={[styles.modalOption, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setSelectedDoctor(doctor);
                        setShowDoctorModal(false);
                        setDoctorSearchQuery('');
                      }}
                    >
                      <View style={styles.modalOptionContent}>
                        <Text style={[styles.modalOptionText, { color: colors.text }]}>
                          {doctor.name}
                        </Text>
                        <Text style={[styles.modalOptionSubtext, { color: colors.textSecondary }]}>
                          {doctor.specialization}
                        </Text>
                      </View>
                      {selectedDoctor?.id === doctor.id && (
                        <Check size={20} color={colors.primary} />
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
              style={[styles.modalContent, { backgroundColor: colors.card }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('doctorOrders.selectPatient')}
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowPatientModal(false);
                  setPatientSearchQuery('');
                }}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.modalSearchContainer, { backgroundColor: colors.background }]}>
                <Search size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.modalSearchInput, { color: colors.text }]}
                  placeholder={t('doctorOrders.searchPatients')}
                  placeholderTextColor={colors.textTertiary}
                  value={patientSearchQuery}
                  onChangeText={setPatientSearchQuery}
                />
                {patientSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
                    <X size={16} color={colors.textTertiary} />
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
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : filteredPatients.length === 0 ? (
                <View style={styles.modalLoading}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {patientSearchQuery ? t('doctorOrders.noMatchingPatients') : t('doctorOrders.noPatientsForDoctor')}
                  </Text>
                </View>
              ) : (
                filteredPatients.map((patient) => (
                  <TouchableOpacity
                    key={patient.medical_id}
                    style={[styles.modalOption, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setSelectedPatient(patient);
                      setShowPatientModal(false);
                      setPatientSearchQuery('');
                    }}
                  >
                    <View style={styles.modalOptionContent}>
                      <Text style={[styles.modalOptionText, { color: colors.text }]}>
                        {patient.full_name}
                      </Text>
                      <Text style={[styles.modalOptionSubtext, { color: colors.textSecondary }]}>
                        {t('doctorOrders.idLabel', { id: patient.medical_id })}
                      </Text>
                    </View>
                    {selectedPatient?.medical_id === patient.medical_id && (
                      <Check size={20} color={colors.primary} />
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
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('doctorOrders.dateRange')}
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {[
                { value: 'all', label: t('doctorOrders.allTime') },
                { value: 'today', label: t('doctorOrders.today') },
                { value: 'week', label: t('doctorOrders.last7Days') },
                { value: 'month', label: t('doctorOrders.lastMonth') },
                { value: 'year', label: t('doctorOrders.lastYear') }
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.modalOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedDateFilter(option.value as DateFilter);
                    setShowDateModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>
                    {option.label}
                  </Text>
                  {selectedDateFilter === option.value && (
                    <Check size={20} color={colors.primary} />
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: P.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 16,
  },
  headerIconCard: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.lightBlue,
    borderWidth: 1,
    borderColor: P.iconCardBorder,
    borderRadius: 16,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: P.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: P.textSecondary,
    marginTop: 2,
  },
  filterButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.lightBlue,
    borderWidth: 1,
    borderColor: P.iconCardBorder,
    borderRadius: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 28,
  },

  // Select order context card
  contextCard: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.softBorder,
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 3,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  contextIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: P.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  contextTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.text,
  },
  contextSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: P.textSecondary,
    marginTop: 2,
  },
  fields: {
    gap: 18,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: P.text,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: P.inputBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 16,
  },
  selectDisabled: {
    backgroundColor: P.pageBg,
    borderColor: P.border,
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  // Empty state card
  emptyCard: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.softBorder,
    borderRadius: 22,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 3,
  },
  emptyDashed: {
    backgroundColor: P.cardBg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: P.dashed,
    borderRadius: 18,
    minHeight: 360,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: P.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: P.text,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 15,
    fontWeight: '500',
    color: P.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  ordersContainer: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 22,
    padding: 18,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: P.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderHeaderText: {
    flex: 1,
  },
  orderType: {
    fontSize: 16,
    fontWeight: '800',
    color: P.text,
  },
  patientName: {
    fontSize: 13,
    marginTop: 2,
    color: P.textSecondary,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctorText: {
    fontSize: 13,
    fontWeight: '500',
    color: P.textSecondary,
  },
  orderMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: P.textSecondary,
  },
  orderDetails: {
    gap: 16,
  },
  divider: {
    height: 1,
    marginTop: 4,
    backgroundColor: P.softBorder,
  },
  notesContainer: {
    gap: 8,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: P.textSecondary,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    color: P.text,
  },
  fileContainer: {
    gap: 8,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: P.lightBlue,
    borderColor: P.iconCardBorder,
  },
  fileLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: P.primary,
  },
  infoSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: P.text,
  },
  infoItem: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    backgroundColor: P.pageBg,
    borderWidth: 1,
    borderColor: P.softBorder,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    width: 110,
    color: P.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
    color: P.text,
  },
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
    fontWeight: 'bold',
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
  },
  modalOptionContent: {
    flex: 1,
    gap: 4,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOptionSubtext: {
    fontSize: 13,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Modal, RefreshControl, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { SUPABASE_URL } from '@/utils/supabase';
import { config } from '@/utils/config';
import { getSession } from '@/utils/auth';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText, Filter, ChevronDown, Search, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  company_name: string;
}

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
  company_name: string;
}

interface GroupedOrders {
  [doctorId: string]: {
    doctor: Doctor;
    orders: Order[];
  };
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export default function OrdersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [medicalId, setMedicalId] = useState<string>('');

  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'doctor' | 'date' | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');

  const loadUserData = async () => {
    try {
      const session = await getSession();
      console.log('Session data:', session);

      if (session) {
        console.log('Parsed session:', session);

        if (session.patient?.medical_id) {
          console.log('Medical ID found:', session.patient.medical_id);
          setMedicalId(session.patient.medical_id);
        } else {
          console.error('No medical_id in session');
        }
      } else {
        console.error('No session found');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchAllData = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('Fetching all data for medical_id:', medicalId);

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-orders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ medicalId }),
        }
      );

      const result = await response.json();
      console.log('Orders API response:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch orders');
      }

      setDoctors(result.doctors || []);
      const formattedOrders = result.orders.map((order: any) => ({
        id: order.id,
        order_type: order.order_type,
        doctor_notes: order.doctor_notes,
        file_path: order.file_path,
        files: order.files || [],
        created_at: order.created_at,
        doctor_id: order.doctor_id,
        doctor_name: order.doctor_name,
        company_name: order.company_name
      })) || [];

      console.log('Formatted orders:', formattedOrders);
      setAllOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medicalId]);

  const onRefresh = () => {
    if (medicalId) {
      fetchAllData(true);
    }
  };

  const applyFilters = useCallback(() => {
    setFilterLoading(true);

    setTimeout(() => {
      let filtered = [...allOrders];

      if (selectedDoctorFilter !== 'all') {
        filtered = filtered.filter(order => order.doctor_id === selectedDoctorFilter);
      }

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
      setFilterLoading(false);
    }, 300);
  }, [allOrders, selectedDoctorFilter, selectedDateFilter]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (medicalId) {
      fetchAllData();
    }
  }, [medicalId, fetchAllData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const groupOrdersByDoctor = (): GroupedOrders => {
    const grouped: GroupedOrders = {};

    filteredOrders.forEach(order => {
      if (!grouped[order.doctor_id]) {
        const doctor = doctors.find(d => d.id === order.doctor_id);
        if (doctor) {
          grouped[order.doctor_id] = {
            doctor,
            orders: []
          };
        }
      }
      if (grouped[order.doctor_id]) {
        grouped[order.doctor_id].orders.push(order);
      }
    });

    return grouped;
  };

  const openAttachment = (filePath: string) => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/doctor-order-files/${filePath}`;
    Linking.openURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDoctorFilterLabel = () => {
    if (selectedDoctorFilter === 'all') return t('patientOrders.allDoctors');
    const doctor = doctors.find(d => d.id === selectedDoctorFilter);
    return doctor ? t('patientOrders.doctorPrefix', { name: doctor.name }) : t('patientOrders.allDoctors');
  };

  const getDateFilterLabel = () => {
    switch (selectedDateFilter) {
      case 'today': return t('patientOrders.today');
      case 'week': return t('patientOrders.last7Days');
      case 'month': return t('patientOrders.lastMonth');
      case 'year': return t('patientOrders.lastYear');
      default: return t('patientOrders.allTime');
    }
  };

  const groupedOrders = groupOrdersByDoctor();
  const styles = createStyles(colors);

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
        <Text style={styles.headerTitle}>{t('patientOrders.title')}</Text>
        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <Filter size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('patientOrders.loadingOrders')}</Text>
        </View>
      ) : filterLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : doctors.length === 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <FileText size={64} color={colors.primary} />
          <Text style={styles.emptyTitle}>{t('patientOrders.noDoctorsTitle')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('patientOrders.noDoctorsSubtitle')}
          </Text>
        </ScrollView>
      ) : filteredOrders.length === 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <FileText size={64} color={colors.primary} />
          <Text style={styles.emptyTitle}>{t('patientOrders.noOrdersTitle')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('patientOrders.noOrdersSubtitle')}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {Object.entries(groupedOrders).map(([doctorId, group]) => (
            <View key={doctorId} style={styles.doctorGroup}>
              <View style={styles.doctorGroupHeader}>
                <View>
                  <Text style={styles.doctorGroupName}>{t('patientOrders.doctorPrefix', { name: group.doctor.name })}</Text>
                  <Text style={styles.doctorGroupSpecialization}>
                    {t('patientOrders.doctorSpecializationCompany', { specialization: group.doctor.specialization, company: group.doctor.company_name })}
                  </Text>
                </View>
                <View style={styles.orderCountBadge}>
                  <Text style={styles.orderCountText}>{group.orders.length}</Text>
                </View>
              </View>

              {group.orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <Text style={styles.orderTitle}>{order.order_type}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>

                  {order.doctor_notes && (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesLabel}>{t('patientOrders.notesLabel')}</Text>
                      <Text style={styles.notesText}>{order.doctor_notes}</Text>
                    </View>
                  )}

                  {order.files && order.files.length > 0 ? (
                    <View style={styles.filesContainer}>
                      {order.files.map((file, idx) => (
                        <TouchableOpacity
                          key={file.id}
                          style={styles.actionButton}
                          activeOpacity={0.7}
                          onPress={() => openAttachment(file.file_path)}
                        >
                          <LinearGradient colors={['#2D7DD2', '#15C2B0', '#FF6F61']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                          <FileText size={18} color="#FFFFFF" />
                          <Text style={styles.actionButtonText} numberOfLines={1}>
                            {file.file_name || t('patientOrders.fileFallback', { number: idx + 1 })}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : order.file_path ? (
                    <TouchableOpacity
                      style={styles.actionButton}
                      activeOpacity={0.7}
                      onPress={() => openAttachment(order.file_path!)}
                    >
                      <LinearGradient colors={['#2D7DD2', '#15C2B0', '#FF6F61']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                      <FileText size={18} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>{order.order_type}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

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
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('patientOrders.filtersTitle')}</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDoctorFilter('all');
                    setSelectedDateFilter('all');
                    setOpenDropdown(null);
                    setDoctorSearch('');
                  }}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>{t('patientOrders.clearAll')}</Text>
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
              <Text style={styles.filterSectionTitle}>{t('patientOrders.doctorSectionTitle')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, openDropdown === 'doctor' && styles.dropdownTriggerOpen]}
                onPress={() => {
                  if (openDropdown === 'doctor') {
                    setOpenDropdown(null);
                    setDoctorSearch('');
                  } else {
                    setOpenDropdown('doctor');
                    setDoctorSearch('');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{getDoctorFilterLabel()}</Text>
                <ChevronDown
                  size={18}
                  color={colors.textSecondary}
                  style={{ transform: [{ rotate: openDropdown === 'doctor' ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
              {openDropdown === 'doctor' && (() => {
                const doctorItems = [{ id: 'all', name: t('patientOrders.allDoctors'), specialization: '' }, ...doctors.map(d => ({ id: d.id, name: t('patientOrders.doctorPrefix', { name: d.name }), specialization: d.specialization }))]
                  .filter(item => item.id === 'all' || item.name.toLowerCase().includes(doctorSearch.toLowerCase()) || item.specialization.toLowerCase().includes(doctorSearch.toLowerCase()));
                return (
                  <View style={styles.dropdownList}>
                    <View style={styles.dropdownSearchRow}>
                      <Search size={15} color={colors.textSecondary} />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder={t('patientOrders.searchDoctors')}
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
                          key={item.id}
                          style={[
                            styles.dropdownItem,
                            selectedDoctorFilter === item.id && styles.dropdownItemSelected,
                            index === doctorItems.length - 1 && styles.dropdownItemLast,
                          ]}
                          onPress={() => {
                            setSelectedDoctorFilter(item.id);
                            setOpenDropdown(null);
                            setDoctorSearch('');
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.dropdownItemContent}>
                            <Text style={[styles.dropdownItemText, selectedDoctorFilter === item.id && styles.dropdownItemTextSelected]}>
                              {item.name}
                            </Text>
                            {item.specialization ? (
                              <Text style={styles.dropdownItemSubtext}>{item.specialization}</Text>
                            ) : null}
                          </View>
                          {selectedDoctorFilter === item.id && (
                            <View style={styles.dropdownItemCheck} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              })()}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('patientOrders.dateRangeSectionTitle')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, openDropdown === 'date' && styles.dropdownTriggerOpen]}
                onPress={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{getDateFilterLabel()}</Text>
                <ChevronDown
                  size={18}
                  color={colors.textSecondary}
                  style={{ transform: [{ rotate: openDropdown === 'date' ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
              {openDropdown === 'date' && (
                <View style={styles.dropdownList}>
                  {[
                    { value: 'all', label: t('patientOrders.allTime') },
                    { value: 'today', label: t('patientOrders.today') },
                    { value: 'week', label: t('patientOrders.last7Days') },
                    { value: 'month', label: t('patientOrders.lastMonth') },
                    { value: 'year', label: t('patientOrders.lastYear') },
                  ].map((option, idx, arr) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownItem,
                        selectedDateFilter === option.value && styles.dropdownItemSelected,
                        idx === arr.length - 1 && styles.dropdownItemLast,
                      ]}
                      onPress={() => {
                        setSelectedDateFilter(option.value as DateFilter);
                        setOpenDropdown(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dropdownItemText, selectedDateFilter === option.value && styles.dropdownItemTextSelected]}>
                        {option.label}
                      </Text>
                      {selectedDateFilter === option.value && (
                        <View style={styles.dropdownItemCheck} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setOpenDropdown(null);
                  setShowFilterModal(false);
                }}
                activeOpacity={0.9}
              >
                <LinearGradient colors={['#56C6C8', '#69C7F0']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={styles.applyButtonText}>{t('patientOrders.applyFilters')}</Text>
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
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: 'rgba(15, 23, 42, 0.05)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45,125,210,0.12)',
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    minHeight: '100%',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  doctorGroup: {
    marginBottom: 24,
  },
  doctorGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  doctorGroupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  doctorGroupSpecialization: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  orderCountBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  orderCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: 'rgba(15, 23, 42, 0.06)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 6,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  notesBox: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  filesContainer: {
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    minHeight: 52,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    overflow: 'hidden',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  modalTitle: {
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
    minHeight: 52,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundTertiary,
  },
  dropdownTriggerOpen: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
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
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
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
  dropdownItemContent: {
    flex: 1,
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
  dropdownItemSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
    minHeight: 52,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

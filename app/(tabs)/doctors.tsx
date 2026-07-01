import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, RefreshControl, Linking, Alert, Platform, TextInput, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Stethoscope, MapPin, Phone, Filter, MessageCircle, ChevronDown, ChevronUp, Search, X } from 'lucide-react-native';
import { config } from '@/utils/config';
import { useTheme } from '@/contexts/ThemeContext';

interface Specialization {
  id: string;
  name: string;
}

interface Clinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

interface Doctor {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  specialization: string;
  specialization_id?: string;
  image?: string;
  phone?: string;
  whatsapp_number?: string;
  allow_whatsapp_chat?: boolean;
  email?: string;
  clinics: Clinic[];
}

export default function DoctorsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [specializationQuery, setSpecializationQuery] = useState('');
  const [expandedDoctors, setExpandedDoctors] = useState<Set<string>>(new Set());

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  const loadDoctors = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const apiUrl = `${config.supabaseUrl}/functions/v1/mobile-get-all-doctors`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ specializationId: selectedSpecialization })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('doctors.failedToLoad'));
      }

      if (data.success) {
        setDoctors(data.doctors || []);
        if (data.specializations) {
          setSpecializations(data.specializations);
        }
      }
    } catch (err) {
      console.error('Error loading doctors:', err);
      setError(err instanceof Error ? err.message : t('doctors.failedToLoad'));
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [selectedSpecialization, t]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const onRefresh = () => {
    loadDoctors(true);
  };

  const handleSelectSpecialization = (id: string) => {
    setSelectedSpecialization(id);
    setShowDropdown(false);
    setSpecializationQuery('');
  };

  const closeDropdown = () => {
    setShowDropdown(false);
    setSpecializationQuery('');
  };

  const toggleDoctor = (doctorId: string) => {
    setExpandedDoctors(prev => {
      const next = new Set(prev);
      if (next.has(doctorId)) {
        next.delete(doctorId);
      } else {
        next.add(doctorId);
      }
      return next;
    });
  };

  const handlePhoneCall = (phoneNumber: string) => {
    Alert.alert(
      t('doctors.callDoctor'),
      t('doctors.callConfirm', { phoneNumber }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('doctors.call'),
          onPress: async () => {
            try {
              const phoneUrl = `tel:${phoneNumber}`;
              if (Platform.OS === 'web') {
                window.open(phoneUrl, '_blank');
              } else {
                const canOpen = await Linking.canOpenURL(phoneUrl);
                if (canOpen) {
                  await Linking.openURL(phoneUrl);
                } else {
                  Alert.alert(t('common.error'), t('doctors.cannotCallDevice'));
                }
              }
            } catch {
              Alert.alert(t('common.error'), t('doctors.cannotCall'));
            }
          },
        },
      ]
    );
  };

  const handleWhatsApp = (whatsappNumber: string) => {
    Alert.alert(
      t('doctors.openWhatsApp'),
      t('doctors.openWhatsAppConfirm', { whatsappNumber }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('doctors.openWhatsApp'),
          onPress: async () => {
            try {
              const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
              if (Platform.OS === 'web') {
                window.open(`https://wa.me/${cleanNumber}`, '_blank');
              } else {
                const whatsappUrls = [
                  `whatsapp://send?phone=${cleanNumber}`,
                  `https://wa.me/${cleanNumber}`,
                  `https://api.whatsapp.com/send?phone=${cleanNumber}`
                ];
                let opened = false;
                for (const url of whatsappUrls) {
                  try {
                    const canOpen = await Linking.canOpenURL(url);
                    if (canOpen) {
                      await Linking.openURL(url);
                      opened = true;
                      break;
                    }
                  } catch {
                    continue;
                  }
                }
                if (!opened) {
                  Alert.alert(t('common.error'), t('doctors.whatsappNotInstalled'));
                }
              }
            } catch {
              Alert.alert(t('common.error'), t('doctors.cannotOpenWhatsApp'));
            }
          },
        },
      ]
    );
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredDoctors = query
    ? doctors.filter((doctor) =>
        doctor.name.toLowerCase().includes(query) ||
        (doctor.specialization || '').toLowerCase().includes(query)
      )
    : doctors;

  const specQuery = specializationQuery.trim().toLowerCase();
  const filteredSpecializations = specQuery
    ? specializations.filter((spec) =>
        (spec.name || '').toLowerCase().includes(specQuery)
      )
    : specializations;

  const styles = createStyles(colors);

  return (
    <Container style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('doctors.title')}</Text>
        {!loading && specializations.length > 0 ? (
          <TouchableOpacity onPress={() => setShowDropdown(true)} style={styles.filterButton}>
            <Filter size={22} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {!loading && !error && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={colors.textSecondary} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('doctors.searchPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <X size={18} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          <TouchableOpacity style={styles.dropdownMenu} activeOpacity={1}>
            <View style={styles.dropdownSearchBar}>
              <Search size={18} color={colors.textSecondary} strokeWidth={2} />
              <TextInput
                style={styles.dropdownSearchInput}
                placeholder={t('doctors.searchSpecializationPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={specializationQuery}
                onChangeText={setSpecializationQuery}
                autoCorrect={false}
                returnKeyType="search"
              />
              {specializationQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSpecializationQuery('')} hitSlop={8}>
                  <X size={16} color={colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
              {specQuery.length === 0 && (
                <TouchableOpacity
                  style={[styles.dropdownItem, selectedSpecialization === 'all' && styles.dropdownItemActive]}
                  onPress={() => handleSelectSpecialization('all')}
                >
                  <Text style={[styles.dropdownItemText, selectedSpecialization === 'all' && styles.dropdownItemTextActive]}>
                    {t('doctors.allSpecializations')}
                  </Text>
                </TouchableOpacity>
              )}
              {filteredSpecializations.length === 0 ? (
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.dropdownEmptyText}>{t('doctors.noSpecializationsFound')}</Text>
                </View>
              ) : (
                filteredSpecializations.map((spec) => (
                  <TouchableOpacity
                    key={spec.id}
                    style={[styles.dropdownItem, selectedSpecialization === spec.id && styles.dropdownItemActive]}
                    onPress={() => handleSelectSpecialization(spec.id)}
                  >
                    <Text style={[styles.dropdownItemText, selectedSpecialization === spec.id && styles.dropdownItemTextActive]}>
                      {spec.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadDoctors()}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : filteredDoctors.length === 0 ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Stethoscope size={48} color={colors.textSecondary} strokeWidth={2} />
          <Text style={styles.emptyText}>{t('doctors.noDoctorsFound')}</Text>
        </ScrollView>
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
          {filteredDoctors.map((doctor) => {
            const isExpanded = expandedDoctors.has(doctor.id);
            return (
              <View key={doctor.id} style={styles.doctorCard}>
                <TouchableOpacity
                  style={styles.doctorHeader}
                  onPress={() => toggleDoctor(doctor.id)}
                  activeOpacity={0.8}
                >
                  {doctor.image ? (
                    <Image source={{ uri: doctor.image }} style={styles.doctorImage} />
                  ) : (
                    <View style={styles.doctorImagePlaceholder}>
                      <Stethoscope size={26} color={colors.primary} strokeWidth={2} />
                    </View>
                  )}
                  <View style={styles.doctorHeaderInfo}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    <Text style={styles.doctorSpecialty}>{doctor.specialization}</Text>
                    {doctor.clinics && doctor.clinics.length > 0 && (
                      <Text style={styles.clinicCount}>
                        {doctor.clinics.length === 1
                          ? t('doctors.clinicCount_one', { count: doctor.clinics.length })
                          : t('doctors.clinicCount_other', { count: doctor.clinics.length })}
                      </Text>
                    )}
                  </View>
                  <View style={styles.chevronContainer}>
                    {isExpanded ? (
                      <ChevronUp size={20} color={colors.textSecondary} strokeWidth={2} />
                    ) : (
                      <ChevronDown size={20} color={colors.textSecondary} strokeWidth={2} />
                    )}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.doctorBody}>
                    {(doctor.phone || (doctor.whatsapp_number && doctor.allow_whatsapp_chat)) && (
                      <View style={styles.contactButtonsRow}>
                        {doctor.phone && (
                          <TouchableOpacity
                            style={styles.contactButton}
                            onPress={() => handlePhoneCall(doctor.phone!)}
                          >
                            <Phone size={15} color="#FFFFFF" strokeWidth={2} />
                            <Text style={styles.contactButtonText}>{t('doctors.call')}</Text>
                          </TouchableOpacity>
                        )}
                        {doctor.whatsapp_number && doctor.allow_whatsapp_chat && (
                          <TouchableOpacity
                            style={[styles.contactButton, styles.whatsappButton]}
                            onPress={() => handleWhatsApp(doctor.whatsapp_number!)}
                          >
                            <MessageCircle size={15} color="#FFFFFF" strokeWidth={2} />
                            <Text style={styles.contactButtonText}>{t('doctors.whatsapp')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {doctor.clinics && doctor.clinics.length > 0 && (
                      <View style={styles.clinicsContainer}>
                        <Text style={styles.clinicsLabel}>{t('doctors.clinics')}</Text>
                        {doctor.clinics.map((clinic) => (
                          <View key={clinic.id} style={styles.clinicItem}>
                            <View style={styles.clinicHeader}>
                              <MapPin size={14} color={colors.primary} strokeWidth={2} />
                              <Text style={styles.clinicName}>{clinic.name}</Text>
                            </View>
                            {clinic.address && (
                              <Text style={styles.clinicAddress}>{clinic.address}</Text>
                            )}
                            {clinic.phone && (
                              <TouchableOpacity
                                style={styles.clinicPhoneRow}
                                onPress={() => handlePhoneCall(clinic.phone!)}
                                activeOpacity={0.7}
                              >
                                <Phone size={12} color={colors.primary} strokeWidth={2} />
                                <Text style={styles.clinicPhone}>{clinic.phone}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </Container>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
    ...(Platform.OS === 'web' && {
      paddingTop: 20,
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  filterButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: colors.text,
    padding: 0,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    gap: 10,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: colors.text,
    padding: 0,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  dropdownScroll: {
    maxHeight: 400,
  },
  dropdownEmpty: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: {
    backgroundColor: colors.primaryLight,
  },
  dropdownItemText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  dropdownItemTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
  },
  centerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    minHeight: '100%',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
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
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  doctorCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  doctorImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
  },
  doctorImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  doctorHeaderInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    marginBottom: 3,
  },
  doctorSpecialty: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
    marginBottom: 3,
  },
  clinicCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  chevronContainer: {
    paddingLeft: 8,
  },
  doctorBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    backgroundColor: colors.card,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  whatsappButton: {
    backgroundColor: '#15C2B0',
  },
  contactButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  clinicsContainer: {
    gap: 8,
  },
  clinicsLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  clinicItem: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clinicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  clinicName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
  },
  clinicAddress: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginLeft: 20,
    marginBottom: 4,
  },
  clinicPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    paddingVertical: 4,
    gap: 6,
  },
  clinicPhone: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
  },
});

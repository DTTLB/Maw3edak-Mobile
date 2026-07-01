import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Package, CheckCircle2, Clock, Building2, Filter, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { config } from '@/utils/config';
import { useTheme } from '@/contexts/ThemeContext';
import { getSession } from '@/utils/auth';

interface Service {
  service_id: string;
  service_name: string;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
}

interface PurchasedPackage {
  patient_package_id: string;
  package_name: string;
  company_name: string;
  services: Service[];
  buy_date: string;
  price_paid: number;
  currency: {
    code: string;
    symbol: string;
  };
  payment_status: string;
}


export default function PackagesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [purchasedPackages, setPurchasedPackages] = useState<PurchasedPackage[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const loadPurchasedPackages = useCallback(async (medicalId: string) => {
    const apiUrl = `${config.supabaseUrl}/functions/v1/mobile-get-patient-packages`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.supabaseAnonKey}`,
      },
      body: JSON.stringify({ medicalId, type: 'purchased' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error || '';
      // A missing patient (or a 404) just means there are no packages to show,
      // so render the empty state instead of an error.
      if (response.status === 404 || /patient not found/i.test(message)) {
        setPurchasedPackages([]);
        return;
      }
      throw new Error(message || t('packages.failedToLoadPurchased'));
    }

    const data = await response.json();
    setPurchasedPackages(Array.isArray(data) ? data : []);
  }, [t]);

  const loadPackages = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const session = await getSession();
      if (!session) {
        setError(t('packages.loginToView'));
        return;
      }

      const medicalId = session.patient?.medical_id || (session as any).medical_id;

      await loadPurchasedPackages(medicalId);

    } catch (err) {
      console.error('Error loading packages:', err);
      setError(err instanceof Error ? err.message : t('packages.failedToLoad'));
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [t, loadPurchasedPackages]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const onRefresh = () => {
    loadPackages(true);
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const uniqueCompanies = Array.from(
    new Set(purchasedPackages.map(pkg => pkg.company_name))
  ).sort();

  const filteredPackages = selectedCompany
    ? purchasedPackages.filter(pkg => pkg.company_name === selectedCompany)
    : purchasedPackages;

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('packages.title')}</Text>
        <TouchableOpacity
          onPress={() => setShowFilterMenu(!showFilterMenu)}
          style={styles.filterButton}
        >
          <Filter size={20} color={colors.text} />
          {selectedCompany && <View style={styles.filterIndicator} />}
        </TouchableOpacity>
      </View>

      {showFilterMenu && (
        <View style={styles.filterMenu}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>{t('packages.filterByCompany')}</Text>
            <TouchableOpacity onPress={() => setShowFilterMenu(false)}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.filterOptions}>
            <TouchableOpacity
              style={[styles.filterOption, !selectedCompany && styles.filterOptionActive]}
              onPress={() => {
                setSelectedCompany(null);
                setShowFilterMenu(false);
              }}
            >
              <Text style={[styles.filterOptionText, !selectedCompany && styles.filterOptionTextActive]}>
                {t('packages.allCompanies')}
              </Text>
            </TouchableOpacity>
            {uniqueCompanies.map((company) => (
              <TouchableOpacity
                key={company}
                style={[styles.filterOption, selectedCompany === company && styles.filterOptionActive]}
                onPress={() => {
                  setSelectedCompany(company);
                  setShowFilterMenu(false);
                }}
              >
                <Text style={[styles.filterOptionText, selectedCompany === company && styles.filterOptionTextActive]}>
                  {company}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadPackages()}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
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
          {filteredPackages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Package size={48} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.emptyText}>
                {selectedCompany ? t('packages.noPackagesFrom', { company: selectedCompany }) : t('packages.noPackagesYet')}
              </Text>
            </View>
          ) : (
            filteredPackages.map((pkg) => (
              <TouchableOpacity
                key={pkg.patient_package_id}
                style={styles.packageCard}
                onPress={() => router.push(`/package-detail?id=${pkg.patient_package_id}`)}
              >
                <View style={styles.packageHeader}>
                  <Text style={styles.packageName}>{pkg.package_name}</Text>
                  <View style={[
                    styles.statusBadge,
                    pkg.payment_status === 'paid' ? styles.statusPaid : styles.statusPending
                  ]}>
                    <Text style={styles.statusText}>
                      {pkg.payment_status === 'paid' ? t('packages.statusPaid') : t('packages.statusPending')}
                    </Text>
                  </View>
                </View>

                <View style={styles.companyRow}>
                  <Building2 size={16} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.companyText}>{pkg.company_name}</Text>
                </View>

                <View style={styles.packageDetails}>
                  <View style={styles.detailRow}>
                    <Clock size={16} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.detailText}>
                      {t('packages.purchased', { date: formatDate(pkg.buy_date) })}
                    </Text>
                  </View>
                  <Text style={styles.priceText}>
                    {pkg.currency.symbol}{pkg.price_paid.toFixed(2)} {pkg.currency.code}
                  </Text>
                </View>

                <View style={styles.servicesContainer}>
                  <Text style={styles.servicesLabel}>{t('packages.servicesLabel')}</Text>
                  {pkg.services.map((service, idx) => (
                    <View key={idx} style={styles.serviceItem}>
                      <View style={styles.serviceHeader}>
                        <CheckCircle2 size={16} color={colors.primary} strokeWidth={2} />
                        <Text style={styles.serviceName}>{service.service_name}</Text>
                      </View>
                      <View style={styles.sessionProgress}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${(service.used_sessions / service.total_sessions) * 100}%` }
                            ]}
                          />
                        </View>
                        <Text style={styles.sessionText}>
                          {t('packages.sessionsUsed', { used: service.used_sessions, total: service.total_sessions })}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  filterButton: {
    padding: 8,
    position: 'relative',
  },
  filterIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  filterMenu: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 300,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
  },
  filterOptions: {
    maxHeight: 250,
  },
  filterOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
  filterOptionActive: {
    backgroundColor: colors.primaryLight,
  },
  filterOptionText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: colors.text,
  },
  filterOptionTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 16,
  },
  packageCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  packageName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPaid: {
    backgroundColor: '#E4F8F4',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#15C2B0',
  },
  packageDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  priceText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: colors.text,
  },
  servicesContainer: {
    marginTop: 8,
  },
  servicesLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  serviceItem: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    marginLeft: 8,
  },
  sessionProgress: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  sessionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
});

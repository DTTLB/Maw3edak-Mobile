import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Calendar, Building2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { config } from '@/utils/config';

interface UsageHistory {
  usage_date: string;
  used_sessions: number;
  notes?: string;
}

interface ServiceDetail {
  service_id: string;
  service_name: string;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  usage_history: UsageHistory[];
}

interface PackageDetail {
  patient_package_id: string;
  package_name: string;
  company_name: string;
  buy_date: string;
  price_paid: number;
  currency: {
    code: string;
    symbol: string;
  };
  payment_status: string;
  services: ServiceDetail[];
}

export default function PackageDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [packageDetail, setPackageDetail] = useState<PackageDetail | null>(null);

  const loadPackageDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const apiUrl = `${config.supabaseUrl}/functions/v1/mobile-get-package-detail`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.supabaseAnonKey}`,
        },
        body: JSON.stringify({ patientPackageId: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('packageDetail.failedToLoad'));
      }

      const data = await response.json();
      setPackageDetail(data);
    } catch (err) {
      console.error('Error loading package detail:', err);
      setError(err instanceof Error ? err.message : t('packageDetail.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (id) {
      loadPackageDetail();
    }
  }, [id, loadPackageDetail]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('packageDetail.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2D7DD2" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadPackageDetail()}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : packageDetail ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoCard}>
            <Text style={styles.packageName}>{packageDetail.package_name}</Text>

            <View style={styles.infoRow}>
              <Building2 size={16} color="#6b7280" strokeWidth={2} />
              <Text style={styles.infoText}>{packageDetail.company_name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Calendar size={16} color="#6b7280" strokeWidth={2} />
              <Text style={styles.infoText}>
                {t('packageDetail.purchased', { date: formatDate(packageDetail.buy_date) })}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('packageDetail.totalPaid')}</Text>
              <Text style={styles.priceText}>
                {packageDetail.currency.symbol}{packageDetail.price_paid.toFixed(2)} {packageDetail.currency.code}
              </Text>
            </View>
          </View>

          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>{t('packageDetail.servicesUsageHistory')}</Text>
            {packageDetail.services.map((service) => (
              <View key={service.service_id} style={styles.serviceCard}>
                <Text style={styles.serviceName}>{service.service_name}</Text>

                <View style={styles.sessionSummary}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${(service.used_sessions / service.total_sessions) * 100}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.sessionText}>
                    {t('packageDetail.sessionSummary', {
                      used: service.used_sessions,
                      total: service.total_sessions,
                      remaining: service.remaining_sessions,
                    })}
                  </Text>
                </View>

                {service.usage_history.length > 0 ? (
                  <View style={styles.historySection}>
                    <Text style={styles.historyTitle}>{t('packageDetail.usageHistory')}</Text>
                    {service.usage_history.map((usage, idx) => (
                      <View key={idx} style={styles.historyItem}>
                        <View style={styles.historyDot} />
                        <View style={styles.historyContent}>
                          <Text style={styles.historyDate}>{formatDate(usage.usage_date)}</Text>
                          <Text style={styles.historySessions}>
                            {t('packageDetail.sessionsUsedCount', { count: usage.used_sessions })}
                          </Text>
                          {usage.notes && (
                            <Text style={styles.historyNotes}>{usage.notes}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noHistoryText}>{t('packageDetail.noUsageHistory')}</Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FF6F61',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2D7DD2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  packageName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  priceText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  servicesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  sessionSummary: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#15C2B0',
    borderRadius: 4,
  },
  sessionText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  historySection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  historyTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D7DD2',
    marginTop: 6,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  historySessions: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  historyNotes: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  noHistoryText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
  },
});

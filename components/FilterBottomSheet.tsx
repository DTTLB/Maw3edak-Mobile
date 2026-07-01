import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';

export type SortOption = 'newest' | 'oldest';
export type DateRangeOption = 'all' | 'today' | '7days' | '30days' | 'custom';
export type StatusOption = 'all' | 'read' | 'unread';
export type CategoryOption = 'all' | 'Appointment' | 'Order' | 'Question' | 'Authorization' | 'Reminder';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export interface FilterOptions {
  sort: SortOption;
  dateRange: DateRangeOption;
  status: StatusOption;
  category: CategoryOption;
}

export function FilterBottomSheet({ visible, onClose, onApply, currentFilters }: FilterBottomSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [sort, setSort] = useState<SortOption>(currentFilters.sort);
  const [dateRange, setDateRange] = useState<DateRangeOption>(currentFilters.dateRange);
  const [status, setStatus] = useState<StatusOption>(currentFilters.status);
  const [category, setCategory] = useState<CategoryOption>(currentFilters.category);

  const handleApply = () => {
    onApply({ sort, dateRange, status, category });
    onClose();
  };

  const handleReset = () => {
    setSort('newest');
    setDateRange('all');
    setStatus('all');
    setCategory('all');
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('components.filterNotifications')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('components.sortBy')}</Text>
              <View style={styles.optionsGroup}>
                <TouchableOpacity
                  style={[
                    styles.option,
                    { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                    sort === 'newest' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }
                  ]}
                  onPress={() => setSort('newest')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, { color: colors.textSecondary }, sort === 'newest' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.newestFirst')}
                  </Text>
                  {sort === 'newest' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.option,
                    { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                    sort === 'oldest' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }
                  ]}
                  onPress={() => setSort('oldest')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, { color: colors.textSecondary }, sort === 'oldest' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.oldestFirst')}
                  </Text>
                  {sort === 'oldest' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('components.dateRange')}</Text>
              <View style={styles.optionsGroup}>
                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, dateRange === 'all' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setDateRange('all')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, dateRange === 'all' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.allTime')}
                  </Text>
                  {dateRange === 'all' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, dateRange === 'today' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setDateRange('today')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, dateRange === 'today' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.today')}
                  </Text>
                  {dateRange === 'today' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, dateRange === '7days' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setDateRange('7days')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, dateRange === '7days' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.last7Days')}
                  </Text>
                  {dateRange === '7days' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, dateRange === '30days' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setDateRange('30days')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, dateRange === '30days' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.last30Days')}
                  </Text>
                  {dateRange === '30days' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('components.status')}</Text>
              <View style={styles.optionsGroup}>
                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, status === 'all' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setStatus('all')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, status === 'all' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.allNotifications')}
                  </Text>
                  {status === 'all' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, status === 'unread' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setStatus('unread')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, status === 'unread' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.unreadOnly')}
                  </Text>
                  {status === 'unread' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, status === 'read' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setStatus('read')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, status === 'read' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.readOnly')}
                  </Text>
                  {status === 'read' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('components.category')}</Text>
              <View style={styles.optionsGroup}>
                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, category === 'all' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setCategory('all')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, category === 'all' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.allCategories')}
                  </Text>
                  {category === 'all' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, category === 'Appointment' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setCategory('Appointment')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, category === 'Appointment' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.appointments')}
                  </Text>
                  {category === 'Appointment' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, category === 'Order' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setCategory('Order')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, category === 'Order' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.orders')}
                  </Text>
                  {category === 'Order' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, category === 'Question' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setCategory('Question')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, category === 'Question' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.questions')}
                  </Text>
                  {category === 'Question' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, category === 'Authorization' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setCategory('Authorization')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, category === 'Authorization' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.authorizations')}
                  </Text>
                  {category === 'Authorization' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, category === 'Reminder' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setCategory('Reminder')}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, category === 'Reminder' && { color: colors.primary, fontWeight: '600' }]}>
                    {t('components.reminders')}
                  </Text>
                  {category === 'Reminder' && (
                    <Check size={20} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.resetButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} onPress={handleReset}>
            <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>{t('components.reset')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.applyButton, styles.applyButtonGradientWrap]} onPress={handleApply} activeOpacity={0.9}>
            <LinearGradient colors={['#56C6C8', '#69C7F0']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
            <Text style={[styles.applyButtonText, { color: '#FFFFFF' }]}>{t('components.applyFilters')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsGroup: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonGradientWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

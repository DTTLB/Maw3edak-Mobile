import { useCallback, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import {
  SECTIONS,
  SECTION_ORDER,
  severityStyle,
  type Translate,
} from '@/constants/medicalSections';
import {
  EMPTY_MEDICAL_DATA,
  fetchMedicalData,
  type MedicalData,
  type MedicalRecord,
  type MedicalTable,
} from '@/utils/medicalData';

// Enable LayoutAnimation on Android so expanding/collapsing cards animate smoothly.
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Short subtitle for each card: a one-line summary when populated, otherwise the
// trimmed empty message (everything before the " — tap + to add" hint).
function cardSubtitle(
  section: (typeof SECTIONS)[keyof typeof SECTIONS],
  items: MedicalRecord[],
  t: Translate
): string {
  if (items.length === 0) {
    return t(section.emptyMessageKey).split(' — ')[0];
  }
  const first = section.primary(items[0], t);
  return items.length > 1
    ? t('components.plusMore', { first, count: items.length - 1 })
    : first;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function MedicalInfoSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const [data, setData] = useState<MedicalData>(EMPTY_MEDICAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  // Which section cards are expanded inline. Empty = all collapsed.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const loadMedicalData = useCallback(async () => {
    try {
      const result = await fetchMedicalData();
      setData(result);
    } catch (error) {
      console.error('Error loading medical data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refetch on every focus so counts/previews stay current after editing in a sub-screen.
  useFocusEffect(
    useCallback(() => {
      loadMedicalData();
    }, [loadMedicalData])
  );

  const allExpanded = SECTION_ORDER.every((key) => expanded[key]);

  const toggleAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !allExpanded;
    setExpanded(
      next
        ? Object.fromEntries(SECTION_ORDER.map((key) => [key, true]))
        : {}
    );
  };

  const toggleOne = (key: MedicalTable) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headingRow}>
        <Text style={[styles.heading, { color: colors.textSecondary }]}>
          {t('components.medicalRecords')}
        </Text>
        {!isLoading && (
          <TouchableOpacity onPress={toggleAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.expandAll, { color: colors.primary }]}>
              {allExpanded ? t('components.collapseAll') : t('components.expandAll')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {SECTION_ORDER.map((key) => {
        const section = SECTIONS[key];
        const Icon = section.icon;
        const items = data[key] as MedicalRecord[];
        const isExpanded = !!expanded[key];

        return (
          <View
            key={key}
            style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
          >
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => toggleOne(key)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <Icon size={20} color={colors.primary} strokeWidth={2} />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{t(section.titleKey)}</Text>
                  {!isLoading && (
                    <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.badgeText, { color: colors.primary }]}>{items.length}</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[styles.subtitle, { color: colors.textTertiary }]}
                  numberOfLines={1}
                >
                  {isLoading ? t('common.loading') : cardSubtitle(section, items, t)}
                </Text>
              </View>

              {isExpanded ? (
                <ChevronDown size={20} color={colors.textTertiary} strokeWidth={2} />
              ) : (
                <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
              )}
            </TouchableOpacity>

            {isExpanded && (
              <View style={[styles.expandedBody, { borderTopColor: colors.border }]}>
                {items.length === 0 ? (
                  <Text style={[styles.emptyInline, { color: colors.textTertiary }]}>
                    {t(section.emptyMessageKey).split(' — ')[0]}
                  </Text>
                ) : (
                  items.map((item) => {
                    const secondary = section.secondary?.(item, t);
                    const sev = section.severityOf?.(item);
                    const sevStyle = severityStyle(sev);
                    return (
                      <TouchableOpacity
                        key={String(item.id)}
                        style={[styles.itemRow, { borderColor: colors.border }]}
                        onPress={() => router.push(`/medical-records/${key}`)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.itemContent}>
                          <View style={styles.itemPrimaryLine}>
                            <Text
                              style={[styles.itemPrimary, { color: colors.text }]}
                              numberOfLines={1}
                            >
                              {section.primary(item, t)}
                            </Text>
                            {sevStyle ? (
                              <View style={[styles.sevChip, { backgroundColor: sevStyle.bg }]}>
                                <Text style={[styles.sevChipText, { color: sevStyle.text }]}>
                                  {capitalize(sev as string)}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          {secondary ? (
                            <Text
                              style={[styles.itemSecondary, { color: colors.textSecondary }]}
                              numberOfLines={2}
                            >
                              {secondary}
                            </Text>
                          ) : null}
                        </View>
                        <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} />
                      </TouchableOpacity>
                    );
                  })
                )}

                <TouchableOpacity
                  style={styles.manageRow}
                  onPress={() => router.push(`/medical-records/${key}`)}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={colors.primary} strokeWidth={2.5} />
                  <Text style={[styles.manageText, { color: colors.primary }]}>
                    {t('components.manageRecords')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginHorizontal: 4,
  },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  expandAll: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
  },
  expandedBody: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  emptyInline: {
    fontSize: 13,
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
  },
  itemContent: {
    flex: 1,
  },
  itemPrimaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPrimary: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  itemSecondary: {
    fontSize: 12,
    marginTop: 2,
  },
  sevChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sevChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  manageText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

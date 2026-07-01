import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Plus, Pencil, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  SECTIONS,
  severityStyle,
  isMedicalTable,
} from '@/constants/medicalSections';
import {
  fetchMedicalData,
  mutateMedicalData,
  type MedicalRecord,
  type MedicalTable,
} from '@/utils/medicalData';
import MedicalRecordForm from '@/components/MedicalRecordForm';
import { Toast, useToast } from '@/components/Toast';

const SKELETON_ROWS = [0, 1, 2, 3];

export default function MedicalSectionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ section?: string }>();
  const sectionKey = params.section;
  const { toast, showToast } = useToast();

  const valid = isMedicalTable(sectionKey);
  const section = valid ? SECTIONS[sectionKey as MedicalTable] : null;

  const [items, setItems] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicalRecord | null>(null);
  const tempCounter = useRef(0);

  const load = useCallback(async () => {
    if (!section) return;
    try {
      const data = await fetchMedicalData();
      setItems(data[section.key]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('medicalRecords.failedToLoad');
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [section, showToast, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }, [load]);

  const openAdd = () => {
    setEditingItem(null);
    setFormVisible(true);
  };

  const openEdit = (item: MedicalRecord) => {
    setEditingItem(item);
    setFormVisible(true);
  };

  const handleSubmit = async (payload: Record<string, any>) => {
    if (!section) return;
    setIsSaving(true);

    const noun = t(section.nounKey);

    if (editingItem) {
      // Optimistic update: merge new values, revert to snapshot on failure.
      const snapshot = items;
      const targetId = editingItem.id;
      setItems((prev) =>
        prev.map((it) => (it.id === targetId ? { ...it, ...payload } : it))
      );
      try {
        const record = await mutateMedicalData(
          section.key,
          'update',
          payload,
          targetId
        );
        setItems((prev) =>
          prev.map((it) =>
            it.id === targetId ? (record ?? { ...it, ...payload }) : it
          )
        );
        setFormVisible(false);
        setEditingItem(null);
        showToast(t('medicalRecords.updatedMessage', { noun: capitalize(noun) }), 'success');
      } catch (error) {
        setItems(snapshot);
        const message =
          error instanceof Error ? error.message : t('medicalRecords.failedToUpdate');
        showToast(message, 'error');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Insert — optimistically prepend a temp row, swap for the server record on success.
    const tempId = `temp-${tempCounter.current++}`;
    const tempItem: MedicalRecord = { id: tempId, is_active: true, ...payload };
    setItems((prev) => [tempItem, ...prev]);
    try {
      const record = await mutateMedicalData(section.key, 'insert', payload);
      setItems((prev) =>
        prev.map((it) => (it.id === tempId ? record ?? it : it))
      );
      setFormVisible(false);
      showToast(t('medicalRecords.addedMessage', { noun: capitalize(noun) }), 'success');
    } catch (error) {
      setItems((prev) => prev.filter((it) => it.id !== tempId));
      const message =
        error instanceof Error ? error.message : t('medicalRecords.failedToAdd');
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item: MedicalRecord) => {
    if (!section) return;

    const noun = t(section.nounKey);

    const confirmDelete = async () => {
      const snapshot = items;
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      try {
        await mutateMedicalData(section.key, 'delete', null, item.id);
        showToast(t('medicalRecords.removedMessage', { noun: capitalize(noun) }), 'success');
      } catch (error) {
        setItems(snapshot);
        const message =
          error instanceof Error ? error.message : t('medicalRecords.failedToRemove');
        showToast(message, 'error');
      }
    };

    Alert.alert(
      t('medicalRecords.removeTitle', { noun }),
      t('medicalRecords.removeConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('medicalRecords.remove'), style: 'destructive', onPress: confirmDelete },
      ]
    );
  };

  const Header = ({ subtitle }: { subtitle?: string }) => (
    <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backButton, { backgroundColor: colors.backgroundTertiary }]}
      >
        <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
      </TouchableOpacity>
      <View style={styles.headerText}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {section ? t(section.titleKey) : t('medicalRecords.medicalRecordsTitle')}
        </Text>
        {subtitle ? (
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );

  if (!section) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
        <Header />
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            {t('medicalRecords.recordTypeNotFound')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const SectionIcon = section.icon;

  const renderRow = ({ item }: { item: MedicalRecord }) => {
    const secondary = section.secondary?.(item, t);
    const sev = section.severityOf?.(item);
    const sevStyle = severityStyle(sev);
    return (
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => openEdit(item)}
        activeOpacity={0.8}
      >
        <View style={styles.rowContent}>
          <View style={styles.rowPrimaryLine}>
            <Text style={[styles.rowPrimary, { color: colors.text }]} numberOfLines={1}>
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
            <Text style={[styles.rowSecondary, { color: colors.textSecondary }]} numberOfLines={2}>
              {secondary}
            </Text>
          ) : null}
        </View>
        <View style={styles.rowActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => openEdit(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Pencil size={18} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={18} color={colors.error} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <Header
        subtitle={
          isLoading
            ? undefined
            : items.length === 1
            ? t('medicalRecords.entryCountOne', { count: items.length })
            : t('medicalRecords.entryCountOther', { count: items.length })
        }
      />

      {isLoading ? (
        <View style={styles.listContent}>
          {SKELETON_ROWS.map((i) => (
            <View
              key={i}
              style={[styles.skeletonRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View
                style={[styles.skeletonLine, { width: '55%', backgroundColor: colors.backgroundTertiary }]}
              />
              <View
                style={[
                  styles.skeletonLine,
                  { width: '80%', marginTop: 10, backgroundColor: colors.backgroundTertiary },
                ]}
              />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRow}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
                <SectionIcon size={28} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                {t(section.emptyMessageKey)}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        onPress={openAdd}
        activeOpacity={0.85}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Plus size={26} color="#ffffff" strokeWidth={2.5} />
        )}
      </TouchableOpacity>

      <MedicalRecordForm
        visible={formVisible}
        section={section}
        item={editingItem}
        isSaving={isSaving}
        onClose={() => {
          if (isSaving) return;
          setFormVisible(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </SafeAreaView>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  rowContent: {
    flex: 1,
    paddingRight: 10,
  },
  rowPrimaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowPrimary: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  rowSecondary: {
    fontSize: 13,
    marginTop: 3,
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
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconButton: {
    padding: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  skeletonRow: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 10,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
});

import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import {
  severityStyle,
  isoToDisplayDate,
  type FieldConfig,
  type SectionConfig,
} from '@/constants/medicalSections';
import { formatBirthDate, isValidDate, convertToISODate } from '@/utils/dateFormat';
import type { MedicalRecord } from '@/utils/medicalData';

interface MedicalRecordFormProps {
  visible: boolean;
  section: SectionConfig;
  // When provided, the form is in edit mode and pre-filled from this record.
  item?: MedicalRecord | null;
  isSaving: boolean;
  onClose: () => void;
  // Receives the whitelisted payload (medical_id is never included).
  onSubmit: (payload: Record<string, any>) => void;
}

function buildInitialValues(section: SectionConfig, item?: MedicalRecord | null) {
  const values: Record<string, any> = {};
  section.fields.forEach((field) => {
    if (field.type === 'boolean') {
      values[field.key] = item ? !!item[field.key] : false;
    } else if (field.type === 'segmented') {
      values[field.key] = item?.[field.key] ?? field.options?.[0] ?? '';
    } else if (field.type === 'date') {
      values[field.key] = item ? isoToDisplayDate(item[field.key]) : '';
    } else {
      values[field.key] = item?.[field.key] ?? '';
    }
  });
  return values;
}

export default function MedicalRecordForm({
  visible,
  section,
  item,
  isSaving,
  onClose,
  onSubmit,
}: MedicalRecordFormProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!item;

  // Reset the form whenever it opens for a new section/record.
  useEffect(() => {
    if (visible) {
      setValues(buildInitialValues(section, item));
      setErrors({});
    }
  }, [visible, section, item]);

  const setValue = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): { ok: boolean; payload: Record<string, any> } => {
    const nextErrors: Record<string, string> = {};
    const payload: Record<string, any> = {};

    section.fields.forEach((field) => {
      const raw = values[field.key];

      if (field.type === 'boolean') {
        payload[field.key] = !!raw;
        return;
      }

      if (field.type === 'date') {
        const trimmed = (raw ?? '').trim();
        if (!trimmed) {
          if (field.required) nextErrors[field.key] = t('components.fieldRequired', { field: t(field.labelKey) });
          payload[field.key] = null;
          return;
        }
        if (!isValidDate(trimmed)) {
          nextErrors[field.key] = t('components.enterValidDate');
          return;
        }
        payload[field.key] = convertToISODate(trimmed);
        return;
      }

      const value = typeof raw === 'string' ? raw.trim() : raw;
      if (field.required && !value) {
        nextErrors[field.key] = t('components.fieldRequired', { field: t(field.labelKey) });
      }
      payload[field.key] = value;
    });

    setErrors(nextErrors);
    return { ok: Object.keys(nextErrors).length === 0, payload };
  };

  const handleSubmit = () => {
    if (isSaving) return;
    const { ok, payload } = validate();
    if (!ok) return;
    onSubmit(payload);
  };

  const renderField = (field: FieldConfig) => {
    const error = errors[field.key];

    if (field.type === 'boolean') {
      return (
        <View style={styles.switchRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t(field.labelKey)}</Text>
          <Switch
            value={!!values[field.key]}
            onValueChange={(val) => setValue(field.key, val)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
      );
    }

    if (field.type === 'segmented') {
      return (
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t(field.labelKey)}</Text>
          <View style={styles.segmentRow}>
            {field.options?.map((option, index) => {
              const selected = values[field.key] === option;
              const sev = field.severityColored ? severityStyle(option) : null;
              const selectedBg = sev ? sev.bg : colors.primary;
              const selectedText = sev ? sev.text : '#ffffff';
              const optionLabel = field.optionLabelKeys?.[index]
                ? t(field.optionLabelKeys[index])
                : option.charAt(0).toUpperCase() + option.slice(1);
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.segment,
                    { backgroundColor: colors.inputBackground, borderColor: colors.border },
                    selected && { backgroundColor: selectedBg, borderColor: selectedBg },
                  ]}
                  onPress={() => setValue(field.key, option)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: colors.textSecondary },
                      selected && { color: selectedText },
                    ]}
                  >
                    {optionLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
        </View>
      );
    }

    const isMultiline = field.type === 'multiline';
    const isDate = field.type === 'date';
    const isPhone = field.type === 'phone';

    return (
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t(field.labelKey)}</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
            isMultiline && styles.textArea,
            error ? { borderColor: colors.error, borderWidth: 2 } : null,
          ]}
          value={String(values[field.key] ?? '')}
          onChangeText={(text) => {
            if (isDate) {
              setValue(field.key, formatBirthDate(text, values[field.key] ?? ''));
            } else {
              setValue(field.key, text);
            }
          }}
          placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
          placeholderTextColor={colors.textTertiary}
          multiline={isMultiline}
          numberOfLines={isMultiline ? 3 : 1}
          textAlignVertical={isMultiline ? 'top' : 'center'}
          keyboardType={isPhone ? 'phone-pad' : isDate ? 'number-pad' : 'default'}
          maxLength={isDate ? 10 : undefined}
        />
        {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.text }]}>
            {isEdit
              ? t('components.editNoun', { noun: t(section.nounKey) })
              : t('components.addNoun', { noun: t(section.nounKey) })}
          </Text>

          <ScrollView
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {section.fields.map((field) => (
              <View key={field.key}>{renderField(field)}</View>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                isSaving && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveText}>
                {isSaving ? t('components.saving') : isEdit ? t('components.saveChanges') : t('components.add')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  body: {
    flexGrow: 0,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
  },
  textArea: {
    height: 90,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segment: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  saveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

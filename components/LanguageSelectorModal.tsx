import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import * as Updates from 'expo-updates';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { LanguageCode } from '@/utils/i18n';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelectorModal({ visible, onClose }: LanguageSelectorModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language, languages, setLanguage } = useLanguage();

  const handleSelect = async (code: LanguageCode) => {
    if (code === language) {
      onClose();
      return;
    }
    const directionChanged = await setLanguage(code);
    onClose();
    if (directionChanged) {
      // Switching to/from a RTL language (e.g. Arabic) needs a reload to apply
      // the new text direction — do it silently, without prompting the user.
      try {
        await Updates.reloadAsync();
      } catch {
        // reloadAsync is unavailable in Expo Go / dev; the new direction will
        // take effect the next time the app is launched.
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('settings.selectLanguage')}
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <X size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {languages.map((lang) => {
              const selected = lang.code === language;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.option,
                    { borderColor: selected ? colors.primary : colors.border },
                    selected && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: selected ? colors.primary : colors.text },
                    ]}
                  >
                    {lang.label}
                  </Text>
                  {selected && <Check size={20} color={colors.primary} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});

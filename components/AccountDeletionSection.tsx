import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Trash2, ChevronRight, X, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { deleteAccountService } from '@/utils/deleteAccount';

const DESTRUCTIVE = '#DC2626';
const DESTRUCTIVE_SOFT = 'rgba(220, 38, 38, 0.10)';
const CONFIRM_WORD = 'DELETE';

interface Props {
  /** Card / row background colour (match the host Settings screen). */
  card: string;
  /** Row bottom border colour. */
  border: string;
  /** Subtitle / secondary text colour. */
  subtitleColor: string;
}

/**
 * Shared, theme-aware "Delete Account" row + confirmation modal used by BOTH
 * the patient and doctor Settings screens. Detects the account type from the
 * active session, so a single component serves both flows.
 */
export default function AccountDeletionSection({ card, border, subtitleColor }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { session, signOut } = useAuth();

  const [visible, setVisible] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canConfirm = confirmText.trim().toUpperCase() === CONFIRM_WORD && !loading;

  const close = () => {
    if (loading) return;
    setVisible(false);
    setConfirmText('');
    setError('');
  };

  const handleDelete = async () => {
    if (!canConfirm) return;
    setLoading(true);
    setError('');

    const result = await deleteAccountService(session);

    if (!result.success) {
      setLoading(false);
      setError(result.error || t('deleteAccount.genericError'));
      return;
    }

    // Success — clear the session/tokens and return to the login screen.
    try {
      await signOut();
    } catch {
      // signOut already clears local state best-effort; continue regardless.
    }
    setLoading(false);
    setVisible(false);
    if (Platform.OS === 'web') {
      window.location.replace('/login');
    } else {
      router.replace('/login');
    }
  };

  const bullets = [
    t('deleteAccount.bullet1'),
    t('deleteAccount.bullet2'),
    t('deleteAccount.bullet3'),
    t('deleteAccount.bullet4'),
    t('deleteAccount.bullet5'),
  ];

  return (
    <>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: card, borderBottomColor: border }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, { backgroundColor: DESTRUCTIVE_SOFT }]}>
          <Trash2 size={20} color={DESTRUCTIVE} strokeWidth={2} />
        </View>
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, { color: DESTRUCTIVE }]}>
            {t('deleteAccount.title')}
          </Text>
          <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>
            {t('deleteAccount.subtitle')}
          </Text>
        </View>
        <ChevronRight size={20} color={subtitleColor} strokeWidth={2} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.sheet, { backgroundColor: card }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleWrap}>
                <AlertTriangle size={22} color={DESTRUCTIVE} strokeWidth={2} />
                <Text style={[styles.sheetTitle, { color: DESTRUCTIVE }]}>
                  {t('deleteAccount.modalTitle')}
                </Text>
              </View>
              <TouchableOpacity onPress={close} disabled={loading} hitSlop={8}>
                <X size={22} color={subtitleColor} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.intro, { color: subtitleColor }]}>
                {t('deleteAccount.modalIntro')}
              </Text>

              {bullets.map((b, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={[styles.bulletText, { color: subtitleColor }]}>{b}</Text>
                </View>
              ))}

              <Text style={[styles.typePrompt, { color: subtitleColor }]}>
                {t('deleteAccount.typePrompt', { word: CONFIRM_WORD })}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: border, color: DESTRUCTIVE }]}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder={CONFIRM_WORD}
                placeholderTextColor={subtitleColor}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: border }]}
                onPress={close}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, { color: subtitleColor }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteBtn, !canConfirm && styles.deleteBtnDisabled]}
                onPress={handleDelete}
                disabled={!canConfirm}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteText}>{t('deleteAccount.confirm')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSubtitle: { fontSize: 13, marginTop: 2 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  body: { paddingHorizontal: 20 },
  bodyContent: { paddingBottom: 8 },
  intro: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DESTRUCTIVE,
    marginTop: 7,
  },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
  typePrompt: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  errorText: { color: DESTRUCTIVE, fontSize: 14, marginTop: 12, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: DESTRUCTIVE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

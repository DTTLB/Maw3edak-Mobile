import React, { useState, useEffect, useCallback } from 'react';
import { CardScannerModal } from '@/components/CardScannerModal';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/utils/config';
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  X,
  ShieldCheck,
  ScanLine,
} from 'lucide-react-native';

function MastercardLogo({ size = 48 }: { size?: number }) {
  const h = size * 0.6;
  return (
    <Svg width={size} height={h} viewBox="0 0 48 30">
      <Circle cx="18" cy="15" r="13" fill="#EB001B" />
      <Circle cx="30" cy="15" r="13" fill="#F79E1B" opacity={0.9} />
      <Path
        d="M24 4.8 A13 13 0 0 1 30 15 A13 13 0 0 1 24 25.2 A13 13 0 0 1 18 15 A13 13 0 0 1 24 4.8 Z"
        fill="#FF5F00"
      />
    </Svg>
  );
}

function VisaLogo({ size = 52 }: { size?: number }) {
  const h = size * 0.36;
  return (
    <Svg width={size} height={h} viewBox="0 0 52 19">
      <SvgText
        x="0"
        y="17"
        fontSize="20"
        fontWeight="bold"
        fill="#FFFFFF"
        fontStyle="italic"
        letterSpacing={-1}
      >
        VISA
      </SvgText>
    </Svg>
  );
}

function AmexLogo({ size = 52 }: { size?: number }) {
  const h = size * 0.5;
  return (
    <Svg width={size} height={h} viewBox="0 0 52 26">
      <Rect x="0" y="0" width="52" height="26" rx="4" fill="rgba(255,255,255,0.15)" />
      <SvgText
        x="5"
        y="19"
        fontSize="14"
        fontWeight="bold"
        fill="#FFFFFF"
        letterSpacing={1}
      >
        AMEX
      </SvgText>
    </Svg>
  );
}

function CardBrandLogo({ brand }: { brand: string }) {
  switch (brand) {
    case 'Mastercard':
      return <MastercardLogo size={52} />;
    case 'Visa':
      return <VisaLogo size={52} />;
    case 'American Express':
      return <AmexLogo size={52} />;
    default:
      return null;
  }
}

interface PaymentCard {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
  is_default: boolean;
  holder_name: string;
}

const CARD_BRAND_COLORS: Record<string, { bg: string; text: string }> = {
  Visa: { bg: '#1A1F71', text: '#FFFFFF' },
  Mastercard: { bg: '#EB001B', text: '#FFFFFF' },
  'American Express': { bg: '#007B5E', text: '#FFFFFF' },
  Other: { bg: '#374151', text: '#FFFFFF' },
};

export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { session } = useAuth();
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [addingCard, setAddingCard] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const medicalId = session?.patient?.medical_id;

  const callFunction = useCallback(async (functionName: string, body: object) => {
    const response = await fetch(
      `${config.supabaseUrl}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    return response.json();
  }, []);

  const loadCards = useCallback(async () => {
    if (!medicalId) { setLoading(false); return; }
    try {
      setLoading(true);
      const result = await callFunction('mobile-get-payment-methods', { medicalId });
      if (result.success) setCards(result.cards || []);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  }, [medicalId, callFunction]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const luhnCheck = (num: string): boolean => {
    let sum = 0;
    let alternate = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let n = parseInt(num[i], 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  };

  const isExpiryValid = (exp: string): boolean => {
    if (exp.length !== 5) return false;
    const [monthStr, yearStr] = exp.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt('20' + yearStr, 10);
    if (isNaN(month) || isNaN(year)) return false;
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const cardExpiry = new Date(year, month, 0);
    return cardExpiry >= now;
  };

  const handleSetDefault = async (id: string) => {
    if (!medicalId) return;
    try {
      const result = await callFunction('mobile-manage-payment-method', {
        action: 'set_default',
        medicalId,
        cardId: id,
      });
      if (result.success) {
        setCards(prev => prev.map(c => ({ ...c, is_default: c.id === id })));
      } else {
        Alert.alert(t('common.error'), result.error || t('paymentMethods.failedToUpdateDefault'));
      }
    } catch {
      Alert.alert(t('common.error'), t('paymentMethods.failedToUpdateDefault'));
    }
  };

  const handleDelete = (id: string) => {
    const doDelete = async () => {
      try {
        const result = await callFunction('mobile-manage-payment-method', {
          action: 'delete',
          medicalId,
          cardId: id,
        });
        if (result.success) {
          setCards(prev => prev.filter(c => c.id !== id));
        } else {
          Alert.alert(t('common.error'), result.error || t('paymentMethods.failedToRemove'));
        }
      } catch {
        Alert.alert(t('common.error'), t('paymentMethods.failedToRemove'));
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(t('paymentMethods.removeCardConfirmShort'))) doDelete();
    } else {
      Alert.alert(t('paymentMethods.removeCardTitle'), t('paymentMethods.removeCardConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('paymentMethods.remove'), style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleAddCard = async () => {
    setFormError(null);
    console.log('[PaymentMethods] handleAddCard called');
    console.log('[PaymentMethods] session:', JSON.stringify(session));
    console.log('[PaymentMethods] medicalId:', medicalId);

    const digits = cardNumber.replace(/\s/g, '');
    console.log('[PaymentMethods] digits:', digits.length);

    if (digits.length < 16) {
      setFormError(t('paymentMethods.errorInvalidCardNumber'));
      return;
    }
    if (!luhnCheck(digits)) {
      setFormError(t('paymentMethods.errorInvalidCardNumberLuhn'));
      return;
    }
    if (!cardHolder.trim()) {
      setFormError(t('paymentMethods.errorMissingCardholder'));
      return;
    }
    if (!isExpiryValid(expiry)) {
      setFormError(t('paymentMethods.errorInvalidExpiry'));
      return;
    }
    if (cvv.length < 3) {
      setFormError(t('paymentMethods.errorInvalidCvv'));
      return;
    }
    if (!medicalId) {
      setFormError(t('paymentMethods.errorSessionMedicalId'));
      console.error('[PaymentMethods] medicalId missing from session. session.patient:', session?.patient);
      return;
    }

    setAddingCard(true);
    try {
      const brand = digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : digits.startsWith('3') ? 'American Express' : 'Other';
      console.log('[PaymentMethods] calling edge function with brand:', brand);

      const result = await callFunction('mobile-manage-payment-method', {
        action: 'add',
        medicalId,
        brand,
        last4: digits.slice(-4),
        holderName: cardHolder.trim(),
        expiry,
      });

      console.log('[PaymentMethods] result:', JSON.stringify(result));

      if (result.success) {
        setCards(prev => [...prev, result.card]);
        resetForm();
        Alert.alert(t('paymentMethods.cardAddedTitle'), t('paymentMethods.cardAddedMessage'));
      } else {
        setFormError(result.error || t('paymentMethods.failedToAdd'));
      }
    } catch (error) {
      console.error('[PaymentMethods] catch error:', error);
      setFormError(t('paymentMethods.networkError'));
    } finally {
      setAddingCard(false);
    }
  };

  const handleCardScanned = useCallback((data: { cardNumber: string; expiry: string; holderName: string; brand: string }) => {
    const digits = data.cardNumber.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, '$1 ').trim());
    if (data.expiry) setExpiry(data.expiry);
    if (data.holderName) setCardHolder(data.holderName);
    setShowScanner(false);
    setShowAddModal(true);
  }, []);

  const resetForm = () => {
    setCardNumber('');
    setCardHolder('');
    setExpiry('');
    setCvv('');
    setFormError(null);
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('paymentMethods.title')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('paymentMethods.title')}</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
        >
          <Plus size={20} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.primaryLight }]}>
              <CreditCard size={40} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('paymentMethods.emptyTitle')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {t('paymentMethods.emptySubtitle')}
            </Text>
            <TouchableOpacity
              style={[styles.emptyAddButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.emptyAddButtonText}>{t('paymentMethods.addPaymentMethod')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('paymentMethods.savedCards')}</Text>

            {cards.map((card, index) => {
              const brandStyle = CARD_BRAND_COLORS[card.brand] || CARD_BRAND_COLORS.Other;
              return (
                <View
                  key={card.id}
                  style={[
                    styles.cardWrapper,
                    { shadowColor: '#000' },
                    index < cards.length - 1 && { marginBottom: 16 },
                  ]}
                >
                  <View style={[styles.cardVisual, { backgroundColor: brandStyle.bg }]}>
                    <View style={styles.cardVisualTop}>
                      <CardBrandLogo brand={card.brand} />
                      {card.is_default && (
                        <View style={styles.defaultBadge}>
                          <CheckCircle size={12} color="#FFFFFF" strokeWidth={2.5} />
                          <Text style={styles.defaultBadgeText}>{t('paymentMethods.default')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.cardNumberMasked, { color: brandStyle.text }]}>
                      •••• •••• •••• {card.last4}
                    </Text>
                    <View style={styles.cardVisualBottom}>
                      <View>
                        <Text style={[styles.cardInfoLabel, { color: brandStyle.text, opacity: 0.6 }]}>{t('paymentMethods.cardholder')}</Text>
                        <Text style={[styles.cardInfoValue, { color: brandStyle.text }]}>{card.holder_name}</Text>
                      </View>
                      <View>
                        <Text style={[styles.cardInfoLabel, { color: brandStyle.text, opacity: 0.6 }]}>{t('paymentMethods.expires')}</Text>
                        <Text style={[styles.cardInfoValue, { color: brandStyle.text }]}>{card.expiry}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.cardActions, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    {!card.is_default ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderRightColor: colors.borderLight }]}
                        onPress={() => handleSetDefault(card.id)}
                        activeOpacity={0.7}
                      >
                        <CheckCircle size={16} color={colors.primary} strokeWidth={2} />
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>{t('paymentMethods.setDefault')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.actionBtn, { borderRightColor: colors.borderLight }]}>
                        <CheckCircle size={16} color={colors.success} strokeWidth={2} />
                        <Text style={[styles.actionBtnText, { color: colors.success }]}>{t('paymentMethods.defaultCard')}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDelete(card.id)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={16} color={colors.error} strokeWidth={2} />
                      <Text style={[styles.actionBtnText, { color: colors.error }]}>{t('paymentMethods.remove')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity
              style={[styles.addNewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.addNewCardIcon, { backgroundColor: colors.primaryLight }]}>
                <Plus size={20} color={colors.primary} strokeWidth={2.5} />
              </View>
              <Text style={[styles.addNewCardText, { color: colors.primary }]}>{t('paymentMethods.addNewCard')}</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={[styles.securityNote, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <ShieldCheck size={20} color={colors.success} strokeWidth={2} />
          <Text style={[styles.securityNoteText, { color: colors.textSecondary }]}>
            {t('paymentMethods.securityNote')}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <CardScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onCardScanned={handleCardScanned}
      />

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={resetForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); resetForm(); }}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('paymentMethods.addNewCard')}</Text>
                <View style={styles.modalHeaderActions}>
                  <TouchableOpacity
                    style={[styles.scanIconBtn, { backgroundColor: colors.primaryLight }]}
                    onPress={() => { setShowAddModal(false); setShowScanner(true); }}
                    activeOpacity={0.7}
                  >
                    <ScanLine size={20} color={colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={resetForm} activeOpacity={0.7}>
                    <X size={24} color={colors.text} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('paymentMethods.cardNumberLabel')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder={t('paymentMethods.cardNumberPlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    value={cardNumber}
                    onChangeText={v => setCardNumber(formatCardNumber(v))}
                    keyboardType="numeric"
                    maxLength={19}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('paymentMethods.cardholderNameLabel')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder={t('paymentMethods.cardholderNamePlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    value={cardHolder}
                    onChangeText={setCardHolder}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t('paymentMethods.expiryDateLabel')}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.textTertiary}
                      value={expiry}
                      onChangeText={v => setExpiry(formatExpiry(v))}
                      keyboardType="numeric"
                      maxLength={5}
                      returnKeyType="next"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>{t('paymentMethods.cvvLabel')}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholder="•••"
                      placeholderTextColor={colors.textTertiary}
                      value={cvv}
                      onChangeText={v => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      returnKeyType="done"
                      onSubmitEditing={handleAddCard}
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                {formError && (
                  <Text style={[styles.formErrorText, { color: colors.error }]}>{formError}</Text>
                )}
                <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={resetForm}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.primary }, addingCard && { opacity: 0.7 }]}
                  onPress={handleAddCard}
                  disabled={addingCard}
                  activeOpacity={0.8}
                >
                  {addingCard ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>{t('paymentMethods.addCard')}</Text>
                  )}
                </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  cardVisual: {
    padding: 20,
    paddingBottom: 24,
  },
  cardVisualTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardNumberMasked: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 3,
    marginBottom: 20,
  },
  cardVisualBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardInfoLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardInfoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRightWidth: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  addNewCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewCardText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scanIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  formErrorText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

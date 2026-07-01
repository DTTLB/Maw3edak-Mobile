import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  Search,
  X,
  Users,
  UserPlus,
  Copy,
  Check,
  CheckCircle2,
  ChevronDown,
  Droplet,
  Phone,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getPatients, createPatient, type ReceptionPatient } from '@/utils/receptionApi';
import PatientCard from '@/components/reception/PatientCard';
import { countries, type Country } from '@/types/countries';
import { validateEmail, validatePhoneNumber } from '@/utils/validation';
import { config } from '@/utils/config';

interface NewPatientResult {
  medicalId: string;
  password: string;
  reactivated: boolean;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const GENDERS = ['Male', 'Female'] as const;

// Flag emojis don't render on every platform (Windows shows the raw country
// letters), so we use flagcdn's PNG flags keyed off the ISO country code.
const flagUri = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

// Mask arbitrary text into a DD-MM-YYYY string, auto-inserting the dashes as
// the user types (e.g. "0412" -> "04-12-") so day rolls into month rolls into
// year without the user typing separators.
function formatDob(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean);
  return parts.join('-');
}

// Convert a DD-MM-YYYY display value into the YYYY-MM-DD the DB date column
// expects. Returns null when the value is empty/incomplete or not a real date.
function dobToIso(display: string): string | null {
  const m = display.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  const dd = +m[1];
  const mm = +m[2];
  const yyyy = +m[3];
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// All patients accessible to this receptionist (via their assigned doctors'
// patient_doctor_access). Searchable directory; tapping a patient starts a
// booking for them. Receptionists can also register a new walk-in patient from
// here — see the AddPatientModal below.
export default function ReceptionPatientsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();

  const userId = session?.user?.realUserId || session?.user?.global_id || '';
  const companyId = session?.user?.company_id || null;

  const [patients, setPatients] = useState<ReceptionPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [result, setResult] = useState<NewPatientResult | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setError('');
    try {
      const data = await getPatients(userId, companyId);
      setPatients(data);
    } catch (e: any) {
      setError(e?.message || t('reception.errorLoadPatients'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, companyId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.medical_id?.toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q)
    );
  }, [patients, search]);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  // When a patient is created, close the form, surface the credentials, and
  // refresh the list so the new patient appears.
  const handleCreated = (r: NewPatientResult) => {
    setShowForm(false);
    setResult(r);
    load();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('reception.patientsTitle')}</Text>
        <View style={styles.headerRight}>
          {!loading ? (
            <View style={[styles.countBadge, { backgroundColor: colors.primaryLight || '#EAF3FC' }]}>
              <Text style={[styles.countText, { color: colors.primary }]}>{patients.length}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowForm(true)}
            activeOpacity={0.85}
          >
            <UserPlus size={20} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.textSecondary} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('reception.searchPatients')}
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
        ) : error ? (
          <View style={styles.empty}>
            <Users size={48} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity onPress={load} style={[styles.retry, { borderColor: colors.primary }]} activeOpacity={0.7}>
              <Text style={[styles.retryText, { color: colors.primary }]}>{t('reception.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Users size={48} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('reception.noPatients')}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((p) => (
              <PatientCard
                key={p.patient_id}
                patient={p}
                onPress={() =>
                  router.push({
                    pathname: '/(reception-tabs)/patient-detail',
                    params: { patientId: p.patient_id },
                  } as any)
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AddPatientModal
        visible={showForm}
        userId={userId}
        colors={colors}
        onClose={() => setShowForm(false)}
        onCreated={handleCreated}
      />

      <CredentialsModal result={result} colors={colors} onClose={() => setResult(null)} />
    </SafeAreaView>
  );
}

// =============================================================================
// AddPatientModal — register a new patient (reuses the sign-up logic server-side
// but skips OTP / human-verification; the server generates the password).
// =============================================================================
function AddPatientModal({
  visible,
  userId,
  colors,
  onClose,
  onCreated,
}: {
  visible: boolean;
  userId: string;
  colors: any;
  onClose: () => void;
  onCreated: (r: NewPatientResult) => void;
}) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // Phone is captured the same way as the patient self-registration screen:
  // a country picker (provides the dialing code) plus a digits-only local
  // number. The two are concatenated into the full number on submit.
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find((c) => c.code === 'LB') || countries[0]
  );
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [dob, setDob] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showBloodPicker, setShowBloodPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const reset = () => {
    setFirstName('');
    setLastName('');
    setSelectedCountry(countries.find((c) => c.code === 'LB') || countries[0]);
    setMobileNumber('');
    setEmail('');
    setGender('');
    setDob('');
    setBloodType('');
    setAddress('');
    setFormError('');
    setPhoneError('');
    setEmailError('');
    setIsCheckingPhone(false);
    setIsCheckingEmail(false);
    setSubmitting(false);
    setShowBloodPicker(false);
    setShowGenderPicker(false);
    setShowCountryPicker(false);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  // ---- Phone: digits-only input + live "already registered" check ----------
  const checkPhoneAvailability = async (phoneToCheck: string) => {
    if (!validatePhoneNumber(selectedCountry.phoneCode, phoneToCheck)) return;

    setIsCheckingPhone(true);
    try {
      const fullPhoneNumber = selectedCountry.phoneCode + phoneToCheck;
      const response = await fetch(`${config.supabaseUrl}/functions/v1/mobile-check-phone`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: fullPhoneNumber }),
      });
      const data = await response.json();
      if (data.exists) {
        setPhoneError(t('reception.errorPhoneExists'));
      }
    } catch (error) {
      console.error('Error checking phone:', error);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleMobileChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    setMobileNumber(digitsOnly);
    if (digitsOnly && !validatePhoneNumber(selectedCountry.phoneCode, digitsOnly)) {
      setPhoneError(t('reception.errorInvalidPhone'));
    } else {
      setPhoneError('');
    }
  };

  const handleMobileBlur = () => {
    if (mobileNumber && validatePhoneNumber(selectedCountry.phoneCode, mobileNumber)) {
      checkPhoneAvailability(mobileNumber);
    }
  };

  // ---- Email: format validation + live "already registered" check ----------
  const checkEmailAvailability = async (emailToCheck: string) => {
    if (!validateEmail(emailToCheck)) return;

    setIsCheckingEmail(true);
    try {
      const response = await fetch(`${config.supabaseUrl}/functions/v1/mobile-check-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToCheck }),
      });
      const data = await response.json();
      if (data.exists) {
        setEmailError(t('reception.errorEmailExists'));
      }
    } catch (error) {
      console.error('Error checking email:', error);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text && !validateEmail(text)) {
      setEmailError(t('reception.errorInvalidEmail'));
    } else {
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    if (email && validateEmail(email)) {
      checkEmailAvailability(email);
    }
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!firstName.trim() || !lastName.trim()) {
      setFormError(t('reception.requiredFields'));
      return;
    }
    if (!mobileNumber.trim() && !email.trim()) {
      setFormError(t('reception.contactRequired'));
      return;
    }
    // A phone number, when provided, must be a valid local number for the
    // selected country and not already taken.
    if (mobileNumber.trim()) {
      if (!validatePhoneNumber(selectedCountry.phoneCode, mobileNumber)) {
        setPhoneError(t('reception.errorInvalidPhone'));
        return;
      }
      if (phoneError) return;
    }
    if (email.trim()) {
      if (!validateEmail(email)) {
        setEmailError(t('reception.errorInvalidEmail'));
        return;
      }
      if (emailError) return;
    }
    let dobIso: string | null = null;
    if (dob.trim()) {
      dobIso = dobToIso(dob.trim());
      if (!dobIso) {
        setFormError(t('reception.invalidDob'));
        return;
      }
    }
    const fullPhone = mobileNumber.trim() ? selectedCountry.phoneCode + mobileNumber.trim() : null;
    setSubmitting(true);
    try {
      const res = await createPatient({
        userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: fullPhone,
        email: email.trim() || null,
        gender: gender || null,
        dateOfBirth: dobIso,
        bloodType: bloodType.trim() || null,
        address: address.trim() || null,
      });
      reset();
      onCreated({ medicalId: res.medicalId, password: res.password, reactivated: res.reactivated });
    } catch (e: any) {
      setFormError(e?.message || t('reception.errorGeneric'));
      setSubmitting(false);
    }
  };

  const optional = ` (${t('reception.optional')})`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.sheetHead, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('reception.addPatientTitle')}</Text>
              <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>{t('reception.addPatientSubtitle')}</Text>
            </View>
            <TouchableOpacity onPress={close} hitSlop={10} disabled={submitting}>
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Field label={t('reception.firstName')} colors={colors}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('reception.firstName')}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
              />
            </Field>

            <Field label={t('reception.lastName')} colors={colors}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('reception.lastName')}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
              />
            </Field>

            <Field label={t('reception.countryLabel')} colors={colors}>
              <TouchableOpacity
                style={[styles.input, styles.selectInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={() => setShowCountryPicker(true)}
                activeOpacity={0.75}
              >
                <View style={styles.optionRowLeft}>
                  <Image source={{ uri: flagUri(selectedCountry.code) }} style={styles.flagImg} />
                  <Text style={[styles.selectText, { color: colors.text }]} numberOfLines={1}>
                    {selectedCountry.name} (+{selectedCountry.phoneCode})
                  </Text>
                </View>
                <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2.2} />
              </TouchableOpacity>
            </Field>

            <Field label={t('reception.phoneLabel')} colors={colors}>
              <View style={styles.phoneRow}>
                <View style={[styles.phoneCodeBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <Text style={[styles.phoneCodeText, { color: colors.text }]}>+{selectedCountry.phoneCode}</Text>
                </View>
                <View
                  style={[
                    styles.input,
                    styles.phoneInputWrap,
                    { backgroundColor: colors.backgroundSecondary, borderColor: phoneError ? '#EF4444' : colors.border },
                  ]}
                >
                  <Phone size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.phoneInputText, { color: colors.text }]}
                    value={mobileNumber}
                    onChangeText={handleMobileChange}
                    onBlur={handleMobileBlur}
                    placeholder={t('reception.localNumberPlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                  {isCheckingPhone ? <Text style={styles.checkingText}>{t('reception.checking')}</Text> : null}
                </View>
              </View>
              {phoneError ? <Text style={styles.fieldError}>{phoneError}</Text> : null}
            </Field>

            <Field label={t('reception.emailLabel') + optional} colors={colors}>
              <View
                style={[
                  styles.input,
                  styles.phoneInputWrap,
                  { backgroundColor: colors.backgroundSecondary, borderColor: emailError ? '#EF4444' : colors.border },
                ]}
              >
                <TextInput
                  style={[styles.phoneInputText, { color: colors.text }]}
                  value={email}
                  onChangeText={handleEmailChange}
                  onBlur={handleEmailBlur}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isCheckingEmail ? <Text style={styles.checkingText}>{t('reception.checking')}</Text> : null}
              </View>
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
            </Field>

            <Field label={t('reception.genderLabel') + optional} colors={colors}>
              <TouchableOpacity
                style={[styles.input, styles.selectInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={() => setShowGenderPicker(true)}
                activeOpacity={0.75}
              >
                <Text
                  style={[styles.selectText, { color: gender ? colors.text : colors.textTertiary }]}
                  numberOfLines={1}
                >
                  {gender
                    ? gender === 'Male'
                      ? t('reception.genderMale')
                      : t('reception.genderFemale')
                    : t('reception.selectGender')}
                </Text>
                <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2.2} />
              </TouchableOpacity>
            </Field>

            <View style={styles.row2}>
              <Field label={t('reception.dobLabel') + optional} colors={colors} style={{ flex: 1 }}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                  value={dob}
                  onChangeText={(v) => setDob(formatDob(v))}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={10}
                  autoCapitalize="none"
                />
              </Field>
              <Field label={t('reception.bloodTypeLabel') + optional} colors={colors} style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[styles.input, styles.selectInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                  onPress={() => setShowBloodPicker(true)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.selectText, { color: bloodType ? colors.text : colors.textTertiary }]}
                    numberOfLines={1}
                  >
                    {bloodType || t('reception.selectBloodType')}
                  </Text>
                  <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2.2} />
                </TouchableOpacity>
              </Field>
            </View>

            <Field label={t('reception.addressLabel') + optional} colors={colors}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                value={address}
                onChangeText={setAddress}
                placeholder={t('reception.addressLabel')}
                placeholderTextColor={colors.textTertiary}
              />
            </Field>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryBtn, (submitting || isCheckingPhone || isCheckingEmail || !!phoneError || !!emailError) && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting || isCheckingPhone || isCheckingEmail || !!phoneError || !!emailError}
              activeOpacity={0.9}
            >
              <LinearGradient colors={['#2D7DD2', '#15C2B0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnGrad}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.btnRow}>
                    <UserPlus size={20} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.primaryBtnText}>{t('reception.createPatient')}</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Gender picker */}
      <Modal visible={showGenderPicker} transparent animationType="fade" onRequestClose={() => setShowGenderPicker(false)}>
        <TouchableOpacity style={styles.pickerScrim} activeOpacity={1} onPress={() => setShowGenderPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerCard, { backgroundColor: colors.card }]}>
            <View style={[styles.pickerHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('reception.genderLabel')}</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.optionList}>
              {GENDERS.map((g) => {
                const active = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: active ? colors.primary : colors.backgroundSecondary,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setGender(active ? '' : g);
                      setShowGenderPicker(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.optionText, { color: active ? '#FFFFFF' : colors.text }]}>
                      {g === 'Male' ? t('reception.genderMale') : t('reception.genderFemale')}
                    </Text>
                    {active ? <Check size={18} color="#FFFFFF" strokeWidth={2.6} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Blood type picker */}
      <Modal visible={showBloodPicker} transparent animationType="fade" onRequestClose={() => setShowBloodPicker(false)}>
        <TouchableOpacity style={styles.pickerScrim} activeOpacity={1} onPress={() => setShowBloodPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerCard, { backgroundColor: colors.card }]}>
            <View style={[styles.pickerHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('reception.bloodTypeLabel')}</Text>
              <TouchableOpacity onPress={() => setShowBloodPicker(false)} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionScroll} contentContainerStyle={styles.optionList}>
              {BLOOD_TYPES.map((bt) => {
                const active = bloodType === bt;
                return (
                  <TouchableOpacity
                    key={bt}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: active ? colors.primary : colors.backgroundSecondary,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setBloodType(active ? '' : bt);
                      setShowBloodPicker(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionRowLeft}>
                      <Droplet
                        size={16}
                        color={active ? '#FFFFFF' : colors.primary}
                        fill={active ? '#FFFFFF' : 'transparent'}
                        strokeWidth={2}
                      />
                      <Text style={[styles.optionText, { color: active ? '#FFFFFF' : colors.text }]}>{bt}</Text>
                    </View>
                    {active ? <Check size={18} color="#FFFFFF" strokeWidth={2.6} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Country picker */}
      <Modal visible={showCountryPicker} transparent animationType="fade" onRequestClose={() => setShowCountryPicker(false)}>
        <TouchableOpacity style={styles.pickerScrim} activeOpacity={1} onPress={() => setShowCountryPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerCard, { backgroundColor: colors.card }]}>
            <View style={[styles.pickerHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('reception.countryLabel')}</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionScroll} contentContainerStyle={styles.optionList}>
              {countries.map((c) => {
                const active = selectedCountry.code === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: active ? colors.primary : colors.backgroundSecondary,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedCountry(c);
                      setShowCountryPicker(false);
                      // Re-validate the current number against the newly selected
                      // country's expected length.
                      if (mobileNumber && !validatePhoneNumber(c.phoneCode, mobileNumber)) {
                        setPhoneError(t('reception.errorInvalidPhone'));
                      } else {
                        setPhoneError('');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionRowLeft}>
                      <Image source={{ uri: flagUri(c.code) }} style={styles.flagImg} />
                      <Text style={[styles.optionText, { color: active ? '#FFFFFF' : colors.text }]}>
                        {c.name} (+{c.phoneCode})
                      </Text>
                    </View>
                    {active ? <Check size={18} color="#FFFFFF" strokeWidth={2.6} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

// =============================================================================
// CredentialsModal — shows the new patient's medical_id + generated password
// once, each copyable to the clipboard so the receptionist can share them.
// =============================================================================
function CredentialsModal({
  result,
  colors,
  onClose,
}: {
  result: NewPatientResult | null;
  colors: any;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [copied, setCopied] = useState<'id' | 'pw' | null>(null);

  const copy = async (value: string, key: 'id' | 'pw') => {
    await Clipboard.setStringAsync(value);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  };

  const close = () => {
    setCopied(null);
    onClose();
  };

  return (
    <Modal visible={!!result} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.centerScrim}>
        <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
          <View style={[styles.successIcon, { backgroundColor: colors.primaryLight || '#EAF3FC' }]}>
            <CheckCircle2 size={36} color={colors.primary} strokeWidth={2.2} />
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {result?.reactivated ? t('reception.patientReactivatedTitle') : t('reception.patientCreatedTitle')}
          </Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary }]}>{t('reception.patientCreatedSubtitle')}</Text>

          <CredentialRow
            label={t('reception.medicalIdLabel')}
            value={result?.medicalId || ''}
            copied={copied === 'id'}
            onCopy={() => result && copy(result.medicalId, 'id')}
            colors={colors}
            styles={styles}
            copyLabel={t('reception.copy')}
            copiedLabel={t('reception.copied')}
          />
          <CredentialRow
            label={t('reception.passwordLabel')}
            value={result?.password || ''}
            copied={copied === 'pw'}
            onCopy={() => result && copy(result.password, 'pw')}
            colors={colors}
            styles={styles}
            copyLabel={t('reception.copy')}
            copiedLabel={t('reception.copied')}
          />

          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={close} activeOpacity={0.9}>
            <Text style={styles.doneBtnText}>{t('reception.done')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function CredentialRow({
  label,
  value,
  copied,
  onCopy,
  colors,
  styles,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  colors: any;
  styles: any;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <View style={[styles.credRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.credLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.credValue, { color: colors.text }]} selectable numberOfLines={1}>
          {value}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.copyBtn, { borderColor: copied ? '#15C2B0' : colors.primary }]}
        onPress={onCopy}
        activeOpacity={0.8}
      >
        {copied ? <Check size={16} color="#15C2B0" strokeWidth={2.6} /> : <Copy size={16} color={colors.primary} strokeWidth={2.2} />}
        <Text style={[styles.copyText, { color: copied ? '#15C2B0' : colors.primary }]}>{copied ? copiedLabel : copyLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function Field({
  label,
  colors,
  children,
  style,
}: {
  label: string;
  colors: any;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 6, color: colors.textSecondary }}>{label}</Text>
      {children}
    </View>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      gap: 8,
    },
    headerBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '800' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    addBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    countBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
    countText: { fontSize: 14, fontWeight: '800' },

    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 40 },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      height: 50,
      borderRadius: 14,
      borderWidth: 1.5,
      marginBottom: 16,
    },
    searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
    list: { gap: 12 },
    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, gap: 12 },
    emptyText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
    retry: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5 },
    retryText: { fontSize: 14, fontWeight: '700' },

    // --- Add patient sheet ---
    modalRoot: { flex: 1, justifyContent: 'center', paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
      borderRadius: 24,
      maxHeight: '88%',
      paddingBottom: 8,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
    },
    sheetHead: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
    },
    sheetTitle: { fontSize: 19, fontWeight: '800' },
    sheetSub: { fontSize: 13, marginTop: 3 },
    formScroll: { paddingHorizontal: 20 },
    formContent: { paddingTop: 16, paddingBottom: 24 },
    input: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1.5,
      paddingHorizontal: 14,
      fontSize: 15,
    },
    selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    selectText: { fontSize: 15, flex: 1 },
    flagImg: { width: 26, height: 18, borderRadius: 3, backgroundColor: '#e5e7eb' },
    phoneRow: { flexDirection: 'row', gap: 10 },
    phoneCodeBox: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1.5,
      paddingHorizontal: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    phoneCodeText: { fontSize: 15, fontWeight: '700' },
    phoneInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    phoneInputText: { flex: 1, fontSize: 15, paddingVertical: 0 },
    checkingText: { fontSize: 12, color: '#15C2B0', marginLeft: 8, fontWeight: '600' },
    fieldError: { color: '#EF4444', fontSize: 12.5, fontWeight: '600', marginTop: 6 },
    row2: { flexDirection: 'row', gap: 12 },
    segmentRow: { flexDirection: 'row', gap: 10 },
    segment: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentText: { fontSize: 15, fontWeight: '700' },
    formError: { color: '#EF4444', fontSize: 13.5, fontWeight: '600', marginBottom: 12, marginTop: 2 },
    primaryBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
    primaryBtnGrad: { height: 54, alignItems: 'center', justifyContent: 'center' },
    btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

    // --- Credentials result ---
    centerScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 },
    resultCard: { borderRadius: 22, padding: 22, alignItems: 'center' },
    successIcon: { width: 64, height: 64, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    resultTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
    resultSub: { fontSize: 13.5, textAlign: 'center', marginTop: 6, marginBottom: 18, lineHeight: 19 },
    credRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      borderRadius: 14,
      borderWidth: 1.5,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    credLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    credValue: { fontSize: 17, fontWeight: '800', marginTop: 3 },
    copyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1.5,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    copyText: { fontSize: 13, fontWeight: '700' },
    doneBtn: { width: '100%', height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
    doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

    // --- Blood type picker ---
    pickerScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 28 },
    pickerCard: { borderRadius: 20, width: '100%', maxWidth: 420, alignSelf: 'center', paddingBottom: 18 },
    pickerHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    pickerTitle: { fontSize: 17, fontWeight: '800' },
    bloodGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      paddingHorizontal: 18,
      paddingTop: 16,
    },
    bloodChip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      width: '22%',
      minWidth: 64,
      flexGrow: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1.5,
    },
    bloodChipText: { fontSize: 15, fontWeight: '800' },

    // --- Generic option picker (gender / blood type) ---
    optionScroll: { maxHeight: 340 },
    optionList: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4, gap: 10 },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 52,
      borderRadius: 12,
      borderWidth: 1.5,
      paddingHorizontal: 16,
    },
    optionRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    optionText: { fontSize: 15.5, fontWeight: '700' },
  });

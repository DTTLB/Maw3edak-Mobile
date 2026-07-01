import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, User, Calendar, Droplet, Mail, MapPin, Lock, ChevronDown, Phone, ShieldCheck } from 'lucide-react-native';
import ImageCaptcha from '@/components/ImageCaptcha';
import { countries, Country } from '@/types/countries';
import { validateEmail, validatePhoneNumber, validatePassword } from '@/utils/validation';
import { formatBirthDate, isValidDate, convertToISODate } from '@/utils/dateFormat';
import { config } from '@/utils/config';
import { supabase } from '@/utils/supabase';

// registration_settings row "Enable OTP Register Patient Mobile".
const OTP_SETTINGS_ID = '27fc08d5-4355-4007-a167-6401544c11d9';

export default function PatientRegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find(c => c.code === 'LB') || countries[0]
  );
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showBloodTypeModal, setShowBloodTypeModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [birthDateError, setBirthDateError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  // Whether OTP-on-registration is enabled. Drives the button label only —
  // the server is the source of truth and re-checks this on submit.
  const [otpEnabled, setOtpEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('registration_settings')
        .select('is_active')
        .eq('id', OTP_SETTINGS_ID)
        .maybeSingle();
      if (!cancelled && !error && data) {
        setOtpEnabled(data.is_active === true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const genders = ['Male', 'Female'];
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleBirthDateChange = (text: string) => {
    const formatted = formatBirthDate(text, birthDate);
    setBirthDate(formatted);

    if (formatted.length === 10) {
      if (!isValidDate(formatted)) {
        setBirthDateError(t('authRegister.errorInvalidDate'));
      } else {
        setBirthDateError('');
      }
    } else {
      setBirthDateError('');
    }
  };

  const checkEmailAvailability = async (emailToCheck: string) => {
    if (!validateEmail(emailToCheck)) return;

    setIsCheckingEmail(true);
    setEmailError('');

    try {
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-check-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: emailToCheck }),
        }
      );

      const data = await response.json();

      if (data.exists) {
        setEmailError(t('authRegister.errorEmailRegistered'));
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
      setEmailError(t('authRegister.errorInvalidEmail'));
    } else {
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    if (email && validateEmail(email)) {
      checkEmailAvailability(email);
    }
  };

  const checkPhoneAvailability = async (phoneToCheck: string) => {
    if (!validatePhoneNumber(selectedCountry.phoneCode, phoneToCheck)) return;

    setIsCheckingPhone(true);
    setPhoneError('');

    try {
      const fullPhoneNumber = selectedCountry.phoneCode + phoneToCheck;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-check-phone`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: fullPhoneNumber }),
        }
      );

      const data = await response.json();

      if (data.exists) {
        setPhoneError(t('authRegister.errorPhoneRegistered'));
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
      setPhoneError(t('authRegister.errorInvalidMobile'));
    } else {
      setPhoneError('');
    }
  };

  const handleMobileBlur = () => {
    if (mobileNumber && validatePhoneNumber(selectedCountry.phoneCode, mobileNumber)) {
      checkPhoneAvailability(mobileNumber);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    const validation = validatePassword(text);
    if (text && !validation.isValid) {
      setPasswordError(t('authRegister.errorPasswordRequirements'));
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (text && text !== password) {
      setConfirmPasswordError(t('authRegister.errorPasswordMismatch'));
    } else {
      setConfirmPasswordError('');
    }
  };

  const passwordStrength = validatePassword(password);

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.label) {
      case 'Weak':
        return '#FF6F61';
      case 'Medium':
        return '#f59e0b';
      case 'Strong':
        return '#15C2B0';
      default:
        return '#e5e7eb';
    }
  };

  const handleCaptchaVerify = () => {
    setCaptchaVerified(true);
  };

  const handleVerifyCaptcha = () => {
    setShowCaptcha(true);
  };

  const handleRegister = async () => {
    if (emailError || phoneError || passwordError || confirmPasswordError || birthDateError) {
      return;
    }

    if (!passwordStrength.isValid) {
      return;
    }

    if (!captchaVerified) {
      return;
    }

    if (!isValidDate(birthDate)) {
      setBirthDateError(t('authRegister.errorInvalidDate'));
      return;
    }

    if (!firstName || !lastName || !email || !mobileNumber || !password) {
      setRegistrationError(t('authRegister.errorRequiredFields'));
      return;
    }

    setIsRegistering(true);
    setRegistrationError('');

    try {
      const fullPhone = selectedCountry.phoneCode + mobileNumber;
      const isoDate = birthDate ? convertToISODate(birthDate) : null;

      console.log('Sending registration request...', {
        mobile: fullPhone,
        email: email,
        firstName: firstName,
        lastName: lastName,
      });

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile_otp`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'send',
            mobile: fullPhone,
            email: email,
            firstName: firstName,
            lastName: lastName,
            password: password,
            dateOfBirth: isoDate,
            gender: gender,
            bloodType: bloodType,
            address: address,
          }),
        }
      );

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        setRegistrationError(t('authRegister.errorInvalidResponse'));
        return;
      }

      if (data.success) {
        if (data.otpRequired === false) {
          // OTP disabled in registration_settings — the account was created
          // server-side, so go straight to the success screen.
          router.replace({
            pathname: '/(auth)/registration-success',
            params: {
              medicalId: data.medicalId,
              fullName: data.fullName,
              welcomeBack: data.welcomeBack ? '1' : '',
            },
          });
        } else {
          router.push({
            pathname: '/(auth)/otp-verify',
            params: {
              mobile: fullPhone,
              email: email,
            },
          });
        }
      } else {
        console.error('Registration failed:', data);
        setRegistrationError(data.error || t('authRegister.errorRegistrationFailed'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      setRegistrationError(t('authRegister.errorNetwork', { message: (error instanceof Error ? error.message : '') || t('authRegister.errorUnableToConnect') }));
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Heart size={40} color="#15C2B0" strokeWidth={2} />
            </View>
            <Text style={styles.title}>{t('authRegister.title')}</Text>
            <Text style={styles.subtitle}>{t('authRegister.subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.sectionTitle}>{t('authRegister.sectionPersonalInfo')}</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('authRegister.labelFirstName')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('authRegister.placeholderFirstName')}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('authRegister.labelLastName')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('authRegister.placeholderLastName')}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('authRegister.labelBirthDate')}</Text>
              <View style={[styles.inputContainer, birthDateError && styles.inputError]}>
                <Calendar size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  value={birthDate}
                  onChangeText={handleBirthDateChange}
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <Text style={styles.helperText}>{t('authRegister.helperBirthDateExample')}</Text>
              {birthDateError ? <Text style={styles.errorText}>{birthDateError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('authRegister.labelGender')}</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowGenderModal(true)}
              >
                <User size={20} color="#6b7280" style={styles.inputIcon} />
                <Text style={[styles.input, styles.selectText, !gender && styles.placeholder]}>
                  {gender ? t(`authRegister.gender${gender}`) : t('authRegister.placeholderGender')}
                </Text>
                <ChevronDown size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('authRegister.labelBloodType')}</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowBloodTypeModal(true)}
              >
                <Droplet size={20} color="#6b7280" style={styles.inputIcon} />
                <Text style={[styles.input, styles.selectText, !bloodType && styles.placeholder]}>
                  {bloodType || t('authRegister.placeholderBloodType')}
                </Text>
                <ChevronDown size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>{t('authRegister.sectionContactDetails')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('authRegister.labelCountry')}</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowCountryModal(true)}
              >
                <Text style={styles.flag}>{selectedCountry.flag}</Text>
                <Text style={styles.countryText}>
                  {selectedCountry.name} (+{selectedCountry.phoneCode})
                </Text>
                <ChevronDown size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('authRegister.labelMobileNumber')}</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.phoneCodeBox}>
                  <Text style={styles.phoneCodeText}>+{selectedCountry.phoneCode}</Text>
                </View>
                <View style={[styles.inputContainer, styles.phoneInput]}>
                  <Phone size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('authRegister.placeholderLocalNumber')}
                    value={mobileNumber}
                    onChangeText={handleMobileChange}
                    onBlur={handleMobileBlur}
                    keyboardType="phone-pad"
                    placeholderTextColor="#9ca3af"
                  />
                  {isCheckingPhone && (
                    <Text style={styles.checkingText}>{t('authRegister.checking')}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.helperText}>{t('authRegister.helperMobileNumber')}</Text>
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('authRegister.labelEmail')}</Text>
              <View style={[styles.inputContainer, emailError && styles.inputError]}>
                <Mail size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('authRegister.placeholderEmail')}
                  value={email}
                  onChangeText={handleEmailChange}
                  onBlur={handleEmailBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9ca3af"
                />
                {isCheckingEmail && (
                  <Text style={styles.checkingText}>{t('authRegister.checking')}</Text>
                )}
              </View>
              <Text style={styles.helperText}>{t('authRegister.helperEmail')}</Text>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('authRegister.labelAddress')}</Text>
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('authRegister.placeholderAddress')}
                  value={address}
                  onChangeText={setAddress}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('authRegister.sectionSecurity')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('authRegister.labelPassword')}</Text>
              <View style={[styles.inputContainer, passwordError && styles.inputError]}>
                <Lock size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('authRegister.placeholderPassword')}
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <Text style={styles.helperText}>
                {t('authRegister.helperPassword')}
              </Text>
              {password ? (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${(passwordStrength.score / 3) * 100}%`,
                          backgroundColor: getPasswordStrengthColor(),
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: getPasswordStrengthColor() }]}>
                    {passwordStrength.label ? t(`authRegister.strength${passwordStrength.label}`) : ''}
                  </Text>
                </View>
              ) : null}
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('authRegister.labelConfirmPassword')}</Text>
              <View style={[styles.inputContainer, confirmPasswordError && styles.inputError]}>
                <Lock size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('authRegister.placeholderConfirmPassword')}
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
            </View>

            <View style={styles.captchaSection}>
              <Text style={styles.sectionTitle}>{t('authRegister.sectionSecurityVerification')}</Text>

              {!captchaVerified ? (
                <TouchableOpacity
                  style={styles.captchaButton}
                  onPress={handleVerifyCaptcha}
                  activeOpacity={0.8}
                >
                  <ShieldCheck size={24} color="#15C2B0" strokeWidth={2} />
                  <Text style={styles.captchaButtonText}>{t('authRegister.captchaVerifyButton')}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.captchaVerified}>
                  <ShieldCheck size={24} color="#15C2B0" strokeWidth={2} />
                  <Text style={styles.captchaVerifiedText}>{t('authRegister.captchaVerifiedText')}</Text>
                </View>
              )}
            </View>

            {registrationError ? (
              <Text style={styles.errorText}>{registrationError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.registerButton, (!passwordStrength.isValid || emailError || phoneError || confirmPasswordError || birthDateError || !captchaVerified || isCheckingEmail || isCheckingPhone || isRegistering) && styles.disabledButton]}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={!passwordStrength.isValid || !!emailError || !!phoneError || !!confirmPasswordError || !!birthDateError || !captchaVerified || isCheckingEmail || isCheckingPhone || isRegistering}
            >
              <LinearGradient
                colors={['#56C6C8', '#69C7F0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.registerGradient}
              >
                <Text style={styles.registerText}>{isRegistering ? (otpEnabled ? t('authRegister.buttonSendingOtp') : t('authRegister.buttonCreatingAccount')) : t('authRegister.buttonRegister')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>{t('authRegister.alreadyHaveAccount')} </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLink}>{t('authRegister.signIn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('authRegister.modalSelectGender')}</Text>
            {genders.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.modalItem}
                onPress={() => {
                  setGender(item);
                  setShowGenderModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{t(`authRegister.gender${item}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showBloodTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBloodTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBloodTypeModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('authRegister.modalSelectBloodType')}</Text>
            {bloodTypes.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.modalItem}
                onPress={() => {
                  setBloodType(item);
                  setShowBloodTypeModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showCountryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('authRegister.modalSelectCountry')}</Text>
            <ScrollView style={styles.modalScroll}>
              {countries.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={styles.modalItemText}>
                    {item.name} (+{item.phoneCode})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <ImageCaptcha
        visible={showCaptcha}
        onVerify={handleCaptchaVerify}
        onClose={() => setShowCaptcha(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#E4F8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputError: {
    borderColor: '#FF6F61',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  selectText: {
    paddingVertical: 16,
  },
  placeholder: {
    color: '#9ca3af',
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  phoneCodeBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  phoneCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  phoneInput: {
    flex: 1,
  },
  helperText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#FF6F61',
    marginTop: 6,
  },
  strengthContainer: {
    marginTop: 12,
  },
  strengthBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  registerButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#15C2B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  registerGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 15,
    color: '#6b7280',
  },
  loginLink: {
    fontSize: 15,
    color: '#15C2B0',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
  },
  captchaSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  captchaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4F8F4',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#15C2B0',
    paddingVertical: 16,
    gap: 12,
  },
  captchaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15C2B0',
  },
  captchaVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4F8F4',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#15C2B0',
    paddingVertical: 16,
    gap: 12,
  },
  captchaVerifiedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15C2B0',
  },
  checkingText: {
    fontSize: 12,
    color: '#15C2B0',
    marginLeft: 8,
  },
});

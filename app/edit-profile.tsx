import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/utils/supabase';
import { config } from '@/utils/config';
import { validateEmail, validatePhone } from '@/utils/validation';
import { getSession, saveSession, handleTokenExpiration } from '@/utils/auth';
import MedicalInfoSection from '@/components/MedicalInfoSection';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Mail,
  Phone,
  Calendar,
  ChevronDown,
  ChevronRight,
  Droplet,
  MapPin,
  ChevronLeft,
  Camera,
  CreditCard,
} from 'lucide-react-native';

// Enable LayoutAnimation on Android so the collapsible card animates smoothly.
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['Male', 'Female', 'Other'];

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [address, setAddress] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showBloodTypeModal, setShowBloodTypeModal] = useState(false);
  const [personalExpanded, setPersonalExpanded] = useState(false);

  const togglePersonal = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPersonalExpanded((prev) => !prev);
  };
  const [selectedImageFile, setSelectedImageFile] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const loadProfile = useCallback(async () => {
    if (!session?.patient?.id || !session?.access_token) {
      console.error('No patient ID or access token in session');
      return;
    }

    try {
      setLoading(true);
      console.log('Loading profile for patient:', session.patient.id);

      const response = await fetch(`${config.supabaseUrl}/functions/v1/mobile-get-patient-profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      console.log('Profile data:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load profile');
      }

      const data = result.patient;

      if (data) {
        console.log('Setting profile data fields...');
        setProfile(data);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');

        // Convert YYYY-MM-DD to DD/MM/YYYY for display
        let displayBirthDate = data.date_of_birth || '';
        if (displayBirthDate && displayBirthDate.includes('-')) {
          const parts = displayBirthDate.split('-');
          if (parts.length === 3) {
            displayBirthDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // YYYY-MM-DD to DD/MM/YYYY
          }
        }
        setBirthDate(displayBirthDate);

        setGender(data.gender || '');
        setBloodType(data.blood_type || '');
        setAddress(data.address || '');

        console.log('Profile fields set:', {
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.date_of_birth,
        });

        if (data.profile_image) {
          console.log('Found profile_image in database:', data.profile_image);
          const { data: imageData } = supabase.storage
            .from('patient-profiles')
            .getPublicUrl(data.profile_image);
          console.log('Generated public URL:', imageData.publicUrl);
          setProfileImage(imageData.publicUrl);
        } else {
          console.log('No profile_image found in database');
        }
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);

      const wasTokenExpired = await handleTokenExpiration(error, router);
      if (!wasTokenExpired) {
        Alert.alert(t('common.error'), t('editProfile.failedToLoadProfile', { message: error.message || error }));
      }
    } finally {
      setLoading(false);
    }
  }, [session, router, t]);

  useEffect(() => {
    console.log('=== EDIT PROFILE MOUNT ===');
    console.log('Session state:', {
      hasSession: !!session,
      hasPatient: !!session?.patient,
      patientId: session?.patient?.id,
      hasAccessToken: !!session?.access_token,
      accessTokenLength: session?.access_token?.length || 0,
      accessTokenValue: session?.access_token || 'UNDEFINED',
    });
    loadProfile();
  }, [loadProfile, session]);

  const formatBirthDate = (text: string, prevText: string): string => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  };

  const getInitials = (): string => {
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  const handleTakePhoto = async () => {
    try {
      console.log('[Camera] Requesting camera permissions...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('[Camera] Permission status:', status);

      if (status !== 'granted') {
        Alert.alert(t('editProfile.permissionNeeded'), t('editProfile.cameraPermissionRequired'));
        return;
      }

      console.log('[Camera] Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('[Camera] Result:', {
        canceled: result.canceled,
        hasAssets: !!result.assets,
        assetsLength: result.assets?.length || 0,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('[Camera] Image selected:', result.assets[0].uri);
        setSelectedImageFile(result.assets[0]);
        setProfileImage(result.assets[0].uri);
        setHasChanges(true);
      } else {
        console.log('[Camera] No image selected or cancelled');
      }
    } catch (error) {
      console.error('[Camera] Error:', error);
      Alert.alert(t('common.error'), t('editProfile.failedToOpenCamera'));
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      console.log('[Gallery] Requesting media library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[Gallery] Permission status:', status);

      if (status !== 'granted') {
        Alert.alert(t('editProfile.permissionNeeded'), t('editProfile.photoLibraryPermissionRequired'));
        return;
      }

      console.log('[Gallery] Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('[Gallery] Result:', {
        canceled: result.canceled,
        hasAssets: !!result.assets,
        assetsLength: result.assets?.length || 0,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('[Gallery] Image selected:', result.assets[0].uri);
        setSelectedImageFile(result.assets[0]);
        setProfileImage(result.assets[0].uri);
        setHasChanges(true);
      } else {
        console.log('[Gallery] No image selected or cancelled');
      }
    } catch (error) {
      console.error('[Gallery] Error:', error);
      Alert.alert(t('common.error'), t('editProfile.failedToOpenGallery'));
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      t('editProfile.profilePhoto'),
      t('editProfile.chooseAnOption'),
      [
        {
          text: t('editProfile.takePhoto'),
          onPress: handleTakePhoto,
        },
        {
          text: t('editProfile.chooseFromGallery'),
          onPress: handleChooseFromGallery,
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const uploadProfileImage = async (patientId: string): Promise<string | null> => {
    if (!selectedImageFile) return null;

    try {
      console.log('Starting image upload...');
      console.log('Image URI:', selectedImageFile.uri);
      console.log('Session at upload time:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        tokenLength: session?.access_token?.length || 0,
        tokenValue: session?.access_token || 'UNDEFINED',
        tokenType: typeof session?.access_token,
      });

      if (!profile?.medical_id) {
        console.error('❌ CRITICAL: No medical ID in profile');
        Alert.alert(t('common.error'), t('editProfile.profileNotLoaded'));
        return null;
      }

      const fileExt = selectedImageFile.uri.split('.').pop()?.toLowerCase() || 'jpg';
      console.log('File extension:', fileExt);

      const formData = new FormData();
      formData.append('file', {
        uri: selectedImageFile.uri,
        type: `image/${fileExt}`,
        name: `image.${fileExt}`,
      } as any);
      formData.append('fileExt', fileExt);
      formData.append('medicalId', profile.medical_id);

      console.log('FormData prepared with file URI:', selectedImageFile.uri);

      console.log('Sending upload request with medical ID:', profile.medical_id);
      const uploadResponse = await fetch(`${config.supabaseUrl}/functions/v1/mobile-upload-profile-image`, {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', uploadResponse.status);
      const responseText = await uploadResponse.text();
      console.log('Upload response text:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid server response: ${responseText}`);
      }

      if (!uploadResponse.ok || !result.success) {
        console.error('Upload failed:', result);
        const errorMessage = result.details
          ? `${result.error}: ${result.details}`
          : result.error || 'Failed to upload image';
        throw new Error(errorMessage);
      }

      console.log('Upload successful:', result);
      return result.fileName;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      console.error('Error stack:', error.stack);

      const wasTokenExpired = await handleTokenExpiration(error, router);
      if (wasTokenExpired) {
        return null;
      }

      throw error;
    }
  };

  const handleSaveProfile = async () => {
    if (emailError || phoneError) {
      Alert.alert(t('editProfile.validationError'), t('editProfile.fixErrorsBeforeSaving'));
      return;
    }

    if (!session?.patient?.id || !session?.access_token) {
      Alert.alert(t('common.error'), t('editProfile.noSessionFound'));
      return;
    }

    try {
      setIsSaving(true);
      console.log('Saving profile for patient:', session.patient.id);

      let uploadedFileName = null;
      if (selectedImageFile) {
        uploadedFileName = await uploadProfileImage(session.patient.id);
      }

      // Convert DD/MM/YYYY to YYYY-MM-DD for database
      let formattedBirthDate = birthDate;
      if (birthDate && birthDate.includes('/')) {
        const parts = birthDate.split('/');
        if (parts.length === 3) {
          formattedBirthDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // DD/MM/YYYY to YYYY-MM-DD
        }
      }

      const updatePayload: any = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        dateOfBirth: formattedBirthDate || null,
        gender: gender,
        bloodType: bloodType,
        address: address,
      };

      if (uploadedFileName) {
        updatePayload.profileImage = uploadedFileName;
      }

      console.log('Sending update request...');
      const updateResponse = await fetch(`${config.supabaseUrl}/functions/v1/mobile-update-patient-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      console.log('Update response status:', updateResponse.status);
      const responseText = await updateResponse.text();
      console.log('Update response text:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid server response: ${responseText}`);
      }

      if (!updateResponse.ok || !result.success) {
        console.error('Update failed:', result);
        const errorMessage = result.details
          ? `${result.error}: ${result.details}`
          : result.error || 'Failed to update profile';
        throw new Error(errorMessage);
      }

      if (uploadedFileName) {
        const { data: imageData } = supabase.storage
          .from('patient-profiles')
          .getPublicUrl(uploadedFileName);
        setProfileImage(imageData.publicUrl);
      }

      setSelectedImageFile(null);
      setHasChanges(false);

      await loadProfile();

      // Keep the cached session in sync so the home screen and other tabs
      // reflect the new profile immediately (without needing a re-login).
      try {
        const current = await getSession();
        if (current?.patient) {
          await saveSession({
            ...current,
            patient: {
              ...current.patient,
              first_name: firstName,
              last_name: lastName,
              email,
              phone,
              date_of_birth: formattedBirthDate || null,
              gender,
              blood_type: bloodType,
              address,
              ...(uploadedFileName ? { profile_image: uploadedFileName } : {}),
            },
          });
        }
      } catch (cacheError) {
        console.error('Failed to update cached session after profile save:', cacheError);
      }

      Alert.alert(t('common.success'), t('editProfile.profileUpdatedSuccessfully'));
    } catch (error: any) {
      console.error('Error saving profile:', error);

      const wasTokenExpired = await handleTokenExpiration(error, router);
      if (!wasTokenExpired) {
        Alert.alert(t('common.error'), t('editProfile.failedToSaveProfile', { message: error.message || error }));
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card }]}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('editProfile.headerTitle')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t('editProfile.headerSubtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.initialsText}>{getInitials()}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.changePhotoButton, { backgroundColor: colors.card, borderColor: colors.primary }]} onPress={handleImagePicker}>
            <Camera size={20} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>{t('editProfile.changePhoto')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.cardHeaderRow, personalExpanded && styles.cardHeaderRowExpanded]}
            onPress={togglePersonal}
            activeOpacity={0.7}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('editProfile.personalInformation')}</Text>
            {personalExpanded ? (
              <ChevronDown size={22} color={colors.textSecondary} strokeWidth={2} />
            ) : (
              <ChevronRight size={22} color={colors.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>

          {personalExpanded && (
          <>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('editProfile.medicalId')}</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <CreditCard size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <TextInput
                style={[styles.input, styles.readOnlyInput, { color: colors.textSecondary }]}
                value={profile?.medical_id || ''}
                editable={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('editProfile.firstName')}</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <User size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('editProfile.enterFirstName')}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  setHasChanges(true);
                }}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('editProfile.lastName')}</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <User size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('editProfile.enterLastName')}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  setHasChanges(true);
                }}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('editProfile.email')}</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: emailError ? colors.error : colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <Mail size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('editProfile.enterEmail')}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError(text && !validateEmail(text) ? t('editProfile.invalidEmail') : '');
                  setHasChanges(true);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            {emailError ? <Text style={[styles.errorText, { color: colors.error }]}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('editProfile.mobile')}</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: phoneError ? colors.error : colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <Phone size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('editProfile.enterMobileNumber')}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setPhoneError(text && !validatePhone(text) ? t('editProfile.invalidPhone') : '');
                  setHasChanges(true);
                }}
                keyboardType="phone-pad"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            {phoneError ? <Text style={[styles.errorText, { color: colors.error }]}>{phoneError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('editProfile.dateOfBirth')}</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <Calendar size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="DD/MM/YYYY"
                value={birthDate}
                onChangeText={(text) => {
                  setBirthDate(formatBirthDate(text, birthDate));
                  setHasChanges(true);
                }}
                keyboardType="number-pad"
                maxLength={10}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('editProfile.gender')}</Text>
            <TouchableOpacity
              style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => setShowGenderModal(true)}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <User size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.input, styles.dropdownText, { color: gender ? colors.text : colors.textTertiary }]}>
                {gender ? t(`editProfile.genderOptions.${gender}`) : t('editProfile.selectGender')}
              </Text>
              <ChevronDown size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('editProfile.bloodType')}</Text>
            <TouchableOpacity
              style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => setShowBloodTypeModal(true)}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <Droplet size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.input, styles.dropdownText, { color: bloodType ? colors.text : colors.textTertiary }]}>
                {bloodType || t('editProfile.selectBloodType')}
              </Text>
              <ChevronDown size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('editProfile.address')}</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { alignSelf: 'flex-start', marginTop: 8, backgroundColor: colors.primaryLight }]}>
                <MapPin size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text }]}
                placeholder={t('editProfile.enterYourAddress')}
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  setHasChanges(true);
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>
          </>
          )}
        </View>

        <MedicalInfoSection />

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.bottomContainer, { backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, (!hasChanges || isSaving || emailError || phoneError) && styles.disabledButton]}
          onPress={handleSaveProfile}
          disabled={!hasChanges || isSaving || !!emailError || !!phoneError}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? t('editProfile.saving') : t('editProfile.saveChanges')}
          </Text>
        </TouchableOpacity>
      </View>

      {showGenderModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('editProfile.selectGender')}</Text>
            {genders.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.modalOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setGender(g);
                  setShowGenderModal(false);
                  setHasChanges(true);
                }}
              >
                <Text style={[styles.modalOptionText, { color: colors.text }]}>{t(`editProfile.genderOptions.${g}`)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowGenderModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.error }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showBloodTypeModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('editProfile.selectBloodType')}</Text>
            {bloodTypes.map((bt) => (
              <TouchableOpacity
                key={bt}
                style={[styles.modalOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setBloodType(bt);
                  setShowBloodTypeModal(false);
                  setHasChanges(true);
                }}
              >
                <Text style={[styles.modalOptionText, { color: colors.text }]}>{bt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowBloodTypeModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.error }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 140,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2D7DD2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#2D7DD2',
    gap: 8,
    shadowColor: '#2D7DD2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  changePhotoText: {
    fontSize: 15,
    color: '#2D7DD2',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderRowExpanded: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF3FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    paddingVertical: 12,
  },
  readOnlyInput: {
    color: '#64748B',
  },
  dropdownText: {
    color: '#0F172A',
  },
  textAreaContainer: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  textArea: {
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF6F61',
  },
  errorText: {
    fontSize: 13,
    color: '#FF6F61',
    marginTop: 4,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#2D7DD2',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D7DD2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#BFD9F5',
    opacity: 0.6,
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'center',
  },
  modalCancel: {
    paddingVertical: 16,
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#FF6F61',
    textAlign: 'center',
    fontWeight: '600',
  },
});

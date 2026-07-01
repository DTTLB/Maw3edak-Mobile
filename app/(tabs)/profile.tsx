import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { User, ChevronRight, LogOut } from 'lucide-react-native';
import BackButton from '@/components/BackButton';
import { getSession, saveSession } from '@/utils/auth';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { config } from '@/utils/config';
import MedicalInfoSection from '@/components/MedicalInfoSection';

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

interface ProfileSummary {
  first_name: string;
  last_name: string;
  email: string;
  profile_image: string | null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { colors } = useTheme();
  const [summary, setSummary] = useState<ProfileSummary>({
    first_name: '',
    last_name: '',
    email: '',
    profile_image: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const buildSummary = useCallback((patientData: any): ProfileSummary => {
    let profileImageUrl: string | null = null;
    if (patientData?.profile_image) {
      const { data } = supabase.storage
        .from('patient-profiles')
        .getPublicUrl(patientData.profile_image);
      // Cache-bust so a freshly uploaded photo shows immediately.
      profileImageUrl = `${data.publicUrl}?t=${Date.now()}`;
    }
    return {
      first_name: patientData?.first_name || '',
      last_name: patientData?.last_name || '',
      email: patientData?.email || '',
      profile_image: profileImageUrl,
    };
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const session = await getSession();
      if (!session || !session.patient) {
        Alert.alert(t('common.error'), t('profile.pleaseLogInAgain'));
        return;
      }
      setSummary(buildSummary(session.patient));
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert(t('common.error'), t('profile.failedToLoadProfile'));
    } finally {
      setIsLoading(false);
    }
  }, [t, buildSummary]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const fetchFreshProfile = useCallback(async () => {
    try {
      const session = await getSession();
      if (!session || !session.access_token) {
        Alert.alert(t('common.error'), t('profile.pleaseLogInAgain'));
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-patient-profile`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.success && result.patient) {
        await saveSession({ ...session, patient: result.patient });
        setSummary(buildSummary(result.patient));
      } else {
        throw new Error(result.error || t('profile.failedToFetchProfile'));
      }
    } catch (error) {
      console.error('Error fetching fresh profile:', error);
      const errorMsg = error instanceof Error ? error.message : t('profile.failedToRefreshProfile');
      Alert.alert(t('common.error'), errorMsg);
    }
  }, [t, buildSummary]);

  // Re-fetch from the backend whenever the tab regains focus (e.g. after
  // editing the profile) so changes appear immediately without a re-login.
  useFocusEffect(
    useCallback(() => {
      fetchFreshProfile();
    }, [fetchFreshProfile])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFreshProfile();
    setIsRefreshing(false);
  };

  const getInitials = (): string => {
    const firstInitial = summary.first_name.charAt(0).toUpperCase();
    const lastInitial = summary.last_name.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}` || '?';
  };

  const fullName = `${summary.first_name} ${summary.last_name}`.trim();

  const handleLogout = async () => {
    const confirmLogout = async () => {
      try {
        await signOut();
        if (Platform.OS === 'web') {
          window.location.replace('/login');
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error during logout:', error);
        if (Platform.OS === 'web') {
          window.location.replace('/login');
        } else {
          Alert.alert(t('common.error'), t('profile.failedToLogout'));
        }
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(t('profile.logoutConfirm'))) {
        await confirmLogout();
      }
    } else {
      Alert.alert(t('common.logout'), t('profile.logoutConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.logout'), style: 'destructive', onPress: confirmLogout },
      ]);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('profile.loadingProfile')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <BackButton color={colors.text} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>{t('profile.title')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('profile.subtitle')}
            </Text>
          </View>
        </View>

        <View style={[styles.avatarSection, { backgroundColor: colors.card }]}>
          {summary.profile_image ? (
            <Image
              source={{ uri: summary.profile_image }}
              style={[styles.avatar, { borderColor: colors.primary }]}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.initialsText}>{getInitials()}</Text>
            </View>
          )}
          {fullName ? (
            <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
          ) : null}
          {summary.email ? (
            <Text style={[styles.email, { color: colors.textSecondary }]}>{summary.email}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <User size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('profile.personalInformation')}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
                {t('profile.personalInformationSubtitle')}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <MedicalInfoSection />

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.error }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={20} color={colors.error} strokeWidth={2} />
          <Text style={[styles.logoutText, { color: colors.error }]}>{t('common.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

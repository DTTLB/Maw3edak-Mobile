import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  FileText,
  LifeBuoy,
  ChevronRight,
} from 'lucide-react-native';
import AccountDeletionSection from '@/components/AccountDeletionSection';
import {
  openExternalUrl,
  PRIVACY_POLICY_URL,
  TERMS_URL,
  SUPPORT_EMAIL,
  SUPPORT_PHONES,
} from '@/utils/links';

interface HelpSection {
  heading: string;
  paragraphs?: string[];
  bulletsIntro?: string;
  bullets?: string[];
}

const PATIENT_SECTIONS: HelpSection[] = [
  {
    heading: 'Help with booking and managing your appointments',
    paragraphs: [
      'Maw3edak helps you book and manage your medical appointments easily from your phone.',
    ],
    bulletsIntro: 'You can use the app to:',
    bullets: [
      'Request an appointment with a doctor without calling.',
      'View your upcoming and previous appointments.',
      'Receive appointment confirmations and reminders.',
      'Upload patient documents when needed.',
      'View prescriptions, orders, and medical information shared by your doctor.',
      'Check visit payment records, invoices, or payment status when available.',
      'Update your profile and account information.',
      'Manage your privacy and account settings.',
    ],
  },
  {
    heading: 'Documents and medical information',
    paragraphs: [
      'You may upload documents only when needed for your appointment, verification, or medical follow-up. Uploaded documents are used to support your care and appointment management.',
    ],
  },
  {
    heading: 'Notifications',
    paragraphs: [
      'Maw3edak may send notifications for appointment confirmations, reminders, schedule changes, doctor updates, visit payment updates, security alerts, and important account updates.',
    ],
  },
  {
    heading: 'Account and privacy',
    paragraphs: [
      'You can view the Privacy Policy from Settings → Terms & Privacy.',
      'You can request account deletion from Settings → Account → Delete Account. Some appointment, medical, payment, or legal records may be retained where required by law or healthcare regulations.',
    ],
  },
];

const DOCTOR_SECTIONS: HelpSection[] = [
  {
    heading: 'Help with managing your clinic and appointments',
    paragraphs: [
      'Maw3edak helps doctors and clinics manage appointments, schedules, patient data, services, orders, prescriptions, documents, and visit payment records digitally.',
    ],
    bulletsIntro: 'You can use the app to:',
    bullets: [
      'Manage your doctor profile.',
      'Manage your clinic or business information, where available.',
      'Set and update your schedule and availability.',
      'Receive appointment requests from patients without phone calls.',
      'View and manage upcoming and previous appointments.',
      'Manage services offered to patients.',
      'Manage patient orders and prescriptions.',
      'View and manage patient medical data and uploaded documents.',
      'Track visit payment records, invoices, or payment status when available.',
      'Update account, privacy, and notification settings.',
    ],
  },
  {
    heading: 'Patient documents and medical data',
    paragraphs: [
      'Patient documents and medical-related data should be accessed and used only for appointment, care, clinic management, legal, or support purposes.',
    ],
  },
  {
    heading: 'Notifications',
    paragraphs: [
      'Maw3edak may send notifications for appointment requests, confirmations, reminders, schedule changes, patient updates, visit payment updates, security alerts, and important account updates.',
    ],
  },
  {
    heading: 'Account and privacy',
    paragraphs: [
      'You can view the Privacy Policy from Settings → Terms & Privacy.',
      'You can request account deletion from Settings → Account → Delete Account. Some appointment, medical, prescription, order, payment, audit, or legal records may be retained where required by law or healthcare regulations.',
    ],
  },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { session } = useAuth();

  const isDoctor = session?.user_type === 'doctor';
  const sections = isDoctor ? DOCTOR_SECTIONS : PATIENT_SECTIONS;
  const styles = createStyles(colors);

  const openLink = (url: string) =>
    Linking.openURL(url).catch(() =>
      Alert.alert(t('settings.linkErrorTitle'), t('settings.linkErrorMessage'))
    );

  const openPrivacy = () =>
    openExternalUrl(PRIVACY_POLICY_URL, {
      errorTitle: t('settings.linkErrorTitle'),
      errorMessage: t('settings.linkErrorMessage'),
    });

  const openTerms = () =>
    openExternalUrl(TERMS_URL, {
      errorTitle: t('settings.linkErrorTitle'),
      errorMessage: t('settings.linkErrorMessage'),
    });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('helpCenter.title')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            {section.paragraphs?.map((p, i) => (
              <Text key={i} style={styles.paragraph}>{p}</Text>
            ))}
            {section.bulletsIntro ? (
              <Text style={[styles.paragraph, styles.bulletsIntro]}>{section.bulletsIntro}</Text>
            ) : null}
            {section.bullets?.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Need help? — direct contact */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Need help?</Text>
          <Text style={styles.paragraph}>For support, contact us:</Text>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`)}
            activeOpacity={0.7}
          >
            <Mail size={18} color={colors.primary} strokeWidth={2} />
            <Text style={styles.contactText}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>

          {SUPPORT_PHONES.map((p) => (
            <TouchableOpacity
              key={p.tel}
              style={styles.contactRow}
              onPress={() => openLink(`tel:${p.tel}`)}
              activeOpacity={0.7}
            >
              <Phone size={18} color={colors.primary} strokeWidth={2} />
              <Text style={styles.contactText}>{p.display}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={styles.quickActionsLabel}>{t('helpCenter.quickActions')}</Text>
        <View style={styles.quickActionsCard}>
          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: colors.border }]}
            onPress={() => openLink(`mailto:${SUPPORT_EMAIL}?subject=App%20Support`)}
            activeOpacity={0.7}
          >
            <LifeBuoy size={20} color={colors.primary} strokeWidth={2} />
            <Text style={styles.actionText}>{t('helpCenter.contactSupport')}</Text>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: colors.border }]}
            onPress={openPrivacy}
            activeOpacity={0.7}
          >
            <ShieldCheck size={20} color={colors.primary} strokeWidth={2} />
            <Text style={styles.actionText}>{t('settings.privacyPolicy')}</Text>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, styles.actionRowLast]}
            onPress={openTerms}
            activeOpacity={0.7}
          >
            <FileText size={20} color={colors.primary} strokeWidth={2} />
            <Text style={styles.actionText}>{t('helpCenter.termsConditions')}</Text>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Delete account (reuses the shared, role-aware deletion flow) */}
        <View style={styles.quickActionsCard}>
          <AccountDeletionSection
            card={colors.card}
            border="transparent"
            subtitleColor={colors.textSecondary}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    content: { flex: 1 },
    contentContainer: { padding: 20, paddingBottom: 40 },
    section: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },
    sectionHeading: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 10 },
    paragraph: { fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginBottom: 8 },
    bulletsIntro: { fontWeight: '600', color: colors.text, marginTop: 2 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 8,
    },
    bulletText: { flex: 1, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    contactText: { fontSize: 15, color: colors.primary, fontWeight: '500' },
    quickActionsLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      marginLeft: 4,
    },
    quickActionsCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 16,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    actionRowLast: { borderBottomWidth: 0 },
    actionText: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text },
  });

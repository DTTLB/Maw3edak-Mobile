import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  ShoppingBag,
  Calendar,
  FileText,
  Package,
  Bell,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Check,
  XIcon,
  Clock,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Maps a notification category enum to its translation key in the `components` namespace.
const CATEGORY_LABEL_KEYS: Record<string, string> = {
  order: 'components.notifCatOrder',
  appointment: 'components.notifCatAppointment',
  prescription: 'components.notifCatPrescription',
  package: 'components.notifCatPackage',
  invoice: 'components.notifCatInvoice',
  question: 'components.notifCatQuestion',
  authorization: 'components.notifCatAuthorization',
  reminder: 'components.notifCatReminder',
  general: 'components.notifCatGeneral',
};

interface NotificationDetailProps {
  visible: boolean;
  onClose: () => void;
  notification: {
    id: string;
    category: string;
    message_header: string;
    message_body: string;
    created_at: string;
    read: boolean;
    completed?: boolean;
    patient_id?: string;
  } | null;
  formatTime: (date: string) => string;
  onAuthorizationAction?: (notificationId: string, approved: boolean) => Promise<void>;
}

export function NotificationDetail({
  visible,
  onClose,
  notification,
  formatTime,
  onAuthorizationAction,
}: NotificationDetailProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loadingAction, setLoadingAction] = useState<'approve' | 'reject' | null>(null);
  const [actionTaken, setActionTaken] = useState(false);

  if (!notification) return null;

  const normalizeCategory = (cat: string): string => {
    const categoryLower = cat?.toLowerCase();
    if (categoryLower === 'custom reminder') {
      return 'reminder';
    }
    return categoryLower;
  };

  const isAuthorizationNotification = notification.category.toLowerCase() === 'authorization';

  const handleAuthorizationAction = async (approved: boolean) => {
    if (!onAuthorizationAction) return;

    setLoadingAction(approved ? 'approve' : 'reject');
    try {
      await onAuthorizationAction(notification.id, approved);
      setActionTaken(true);
      setTimeout(() => {
        onClose();
        setActionTaken(false);
        setLoadingAction(null);
      }, 1500);
    } catch (error) {
      console.error('Error handling authorization:', error);
      setLoadingAction(null);
    }
  };

  const categoryColors = {
    order: { color: '#15C2B0', bg: '#E4F8F4' },
    appointment: { color: '#2D7DD2', bg: '#EAF3FC' },
    prescription: { color: '#2D7DD2', bg: '#EAF3FC' },
    package: { color: '#F59E0B', bg: '#fef3c7' },
    invoice: { color: '#FF6F61', bg: '#FFEDEB' },
    question: { color: '#15C2B0', bg: '#E4F8F4' },
    authorization: { color: '#2D7DD2', bg: '#EAF3FC' },
    reminder: { color: '#F59E0B', bg: '#fef9c3' },
    general: { color: '#64748B', bg: '#F1F5F9' },
  };

  const getIcon = (category: string) => {
    const categoryLower = normalizeCategory(category);
    const iconSize = 28;
    const strokeWidth = 2;

    switch (categoryLower) {
      case 'order':
        return <ShoppingBag size={iconSize} color={categoryColors.order.color} strokeWidth={strokeWidth} />;
      case 'appointment':
        return <Calendar size={iconSize} color={categoryColors.appointment.color} strokeWidth={strokeWidth} />;
      case 'prescription':
        return <FileText size={iconSize} color={categoryColors.prescription.color} strokeWidth={strokeWidth} />;
      case 'package':
        return <Package size={iconSize} color={categoryColors.package.color} strokeWidth={strokeWidth} />;
      case 'invoice':
        return <CreditCard size={iconSize} color={categoryColors.invoice.color} strokeWidth={strokeWidth} />;
      case 'question':
        return <MessageSquare size={iconSize} color={categoryColors.question.color} strokeWidth={strokeWidth} />;
      case 'authorization':
        return <ShieldCheck size={iconSize} color={categoryColors.authorization.color} strokeWidth={strokeWidth} />;
      case 'reminder':
        return <Clock size={iconSize} color={categoryColors.reminder.color} strokeWidth={strokeWidth} />;
      default:
        return <Bell size={iconSize} color={categoryColors.general.color} strokeWidth={strokeWidth} />;
    }
  };

  const getIconBg = (category: string) => {
    const categoryLower = normalizeCategory(category);
    return categoryColors[categoryLower as keyof typeof categoryColors]?.bg || categoryColors.general.bg;
  };

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: getIconBg(notification.category) }]}>
                {getIcon(notification.category)}
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.category}>{t(CATEGORY_LABEL_KEYS[normalizeCategory(notification.category)] ?? CATEGORY_LABEL_KEYS.general).toUpperCase()}</Text>
                <Text style={styles.time}>{formatTime(notification.created_at)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.bodyWrapper}>
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              <Text style={styles.title}>{notification.message_header}</Text>
              <Text style={styles.body}>{notification.message_body}</Text>

              {actionTaken && (
                <View style={styles.successMessage}>
                  <Check size={20} color="#15C2B0" strokeWidth={2} />
                  <Text style={styles.successText}>{t('components.actionCompleted')}</Text>
                </View>
              )}
            </ScrollView>
          </View>

          <View style={styles.footer}>
            {isAuthorizationNotification && !actionTaken && !notification.completed ? (
              <View style={styles.authorizationButtons}>
                <TouchableOpacity
                  style={[styles.authButton, styles.rejectButton]}
                  onPress={() => handleAuthorizationAction(false)}
                  disabled={loadingAction !== null}
                >
                  {loadingAction === 'reject' ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <XIcon size={20} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.rejectButtonText}>{t('components.reject')}</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.authButton, styles.approveButton]}
                  onPress={() => handleAuthorizationAction(true)}
                  disabled={loadingAction !== null}
                >
                  {loadingAction === 'approve' ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Check size={20} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.approveButtonText}>{t('components.approve')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.closeButtonLarge} onPress={onClose}>
                <Text style={styles.closeButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: Dimensions.get('window').height * 0.8,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  category: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  time: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  closeButton: {
    padding: 8,
    marginLeft: 12,
  },
  bodyWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4F8F4',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  successText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#15C2B0',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  authorizationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  authButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  rejectButton: {
    backgroundColor: '#FF6F61',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  approveButton: {
    backgroundColor: '#15C2B0',
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButtonLarge: {
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

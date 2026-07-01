import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import {
  ShoppingBag,
  Calendar,
  FileText,
  Package,
  Bell,
  CreditCard,
  Check,
  MessageSquare,
  ShieldCheck,
  Clock,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';

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

interface NotificationCardProps {
  id: string;
  category: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  onPress: () => void;
  animatedValue?: Animated.Value;
}

export function NotificationCard({
  id,
  category,
  title,
  body,
  time,
  read,
  onPress,
  animatedValue,
}: NotificationCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

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

  const normalizeCategory = (cat: string): string => {
    const categoryLower = cat?.toLowerCase();
    if (categoryLower === 'custom reminder') {
      return 'reminder';
    }
    return categoryLower;
  };

  const getIcon = (cat: string) => {
    const categoryLower = normalizeCategory(cat);
    const iconSize = 20;
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

  const getIconBg = (cat: string) => {
    const categoryLower = normalizeCategory(cat);
    return categoryColors[categoryLower as keyof typeof categoryColors]?.bg || categoryColors.general.bg;
  };

  const styles = createStyles(colors, read);

  return (
    <Animated.View style={{ transform: animatedValue ? [{ translateX: animatedValue }] : [] }}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconContainer, { backgroundColor: getIconBg(category) }]}>
          {getIcon(category)}
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {!read ? (
              <View style={styles.unreadDot} />
            ) : (
              <Check size={16} color={colors.success} strokeWidth={2.5} />
            )}
          </View>

          <Text style={styles.category} numberOfLines={1}>
            {t(CATEGORY_LABEL_KEYS[normalizeCategory(category)] ?? CATEGORY_LABEL_KEYS.general).toUpperCase()}
          </Text>

          <Text style={styles.body} numberOfLines={3}>
            {body}
          </Text>

          <Text style={styles.time}>{time}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (colors: any, read: boolean) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backgroundColor: read ? colors.card : colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: read ? colors.border : colors.primaryLight,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  category: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  time: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D7DD2',
  },
});

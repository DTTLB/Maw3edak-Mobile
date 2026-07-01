/**
 * Maw3edak premium mobile UI kit.
 * Reusable, brand-aligned components built on constants/brand.ts.
 *
 * Exports: ScreenContainer, GradientHeader, AppHeader, Card, SectionHeader,
 * Button, IconButton, FilterButton, Chip, Badge, Toggle, KPIBox, ServiceTile,
 * EmptyState, RoleCard, Input, Dropdown.
 */
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, ChevronDown, ArrowLeft } from 'lucide-react-native';
import { brand, radius, shadow, gradients } from '@/constants/brand';

type BrandColor = 'blue' | 'turquoise' | 'coral' | 'neutral';

const accent = (c: BrandColor) =>
  c === 'turquoise'
    ? { color: brand.turquoise, soft: brand.turquoiseSoft, gradient: gradients.turquoise, glow: shadow.turquoiseGlow }
    : c === 'coral'
    ? { color: brand.coral, soft: brand.coralSoft, gradient: gradients.coral, glow: shadow.coralGlow }
    : c === 'neutral'
    ? { color: brand.textSecondary, soft: brand.muted, gradient: [brand.muted, brand.muted] as [string, string], glow: shadow.sm }
    : { color: brand.blue, soft: brand.blueSoft, gradient: gradients.blue, glow: shadow.blueGlow };

/* ------------------------------------------------------------------ */
/* ScreenContainer                                                     */
/* ------------------------------------------------------------------ */
export function ScreenContainer({
  children,
  style,
  edges = ['top'],
  background = brand.background,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  background?: string;
}) {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: background }, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* GradientHeader — blue→turquoise wellness gradient banner            */
/* ------------------------------------------------------------------ */
export function GradientHeader({
  children,
  style,
  colors = gradients.header,
  rounded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  colors?: readonly string[];
  rounded?: boolean;
}) {
  return (
    <LinearGradient
      colors={colors as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.gradientHeader,
        rounded && { borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
        style,
      ]}
    >
      {/* soft decorative shapes */}
      <View pointerEvents="none" style={styles.headerBlobA} />
      <View pointerEvents="none" style={styles.headerBlobB} />
      {children}
    </LinearGradient>
  );
}

/* ------------------------------------------------------------------ */
/* AppHeader — back button / title / optional right action            */
/* ------------------------------------------------------------------ */
export function AppHeader({
  title,
  subtitle,
  onBack,
  right,
  variant = 'plain',
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  variant?: 'plain' | 'gradient';
}) {
  const onGradient = variant === 'gradient';
  const titleColor = onGradient ? '#FFFFFF' : brand.textPrimary;
  const subColor = onGradient ? 'rgba(255,255,255,0.85)' : brand.textSecondary;

  const body = (
    <View style={styles.appHeaderRow}>
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.8}
          style={[styles.headerIconBtn, onGradient && styles.headerIconBtnGlass]}
        >
          <ArrowLeft size={22} color={onGradient ? '#FFFFFF' : brand.textPrimary} strokeWidth={2.4} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 44 }} />
      )}
      <View style={styles.appHeaderTitleWrap}>
        <Text style={[styles.appHeaderTitle, { color: titleColor }]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[styles.appHeaderSubtitle, { color: subColor }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.appHeaderRight}>{right ?? <View style={{ width: 44 }} />}</View>
    </View>
  );

  if (onGradient) {
    return <GradientHeader>{body}</GradientHeader>;
  }
  return <View style={styles.appHeaderPlain}>{body}</View>;
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */
export function Card({
  children,
  style,
  onPress,
  elevation = 'md',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevation?: 'sm' | 'md' | 'lg';
}) {
  const shadowStyle = elevation === 'lg' ? shadow.lg : elevation === 'sm' ? shadow.sm : shadow.md;
  const content = <View style={[styles.card, shadowStyle as ViewStyle, style]}>{children}</View>;
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

/* ------------------------------------------------------------------ */
/* SectionHeader                                                       */
/* ------------------------------------------------------------------ */
export function SectionHeader({
  title,
  accentColor = 'blue',
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  accentColor?: BrandColor;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const a = accent(accentColor);
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionTitleWrap}>
        <View style={[styles.sectionAccentBar, { backgroundColor: a.color }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {!!actionLabel && (
        <TouchableOpacity style={styles.sectionAction} onPress={onAction} activeOpacity={0.7}>
          <Text style={[styles.sectionActionText, { color: a.color }]}>{actionLabel}</Text>
          <ChevronRight size={16} color={a.color} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */
export function Button({
  label,
  onPress,
  color = 'blue',
  variant = 'solid',
  size = 'md',
  icon,
  loading,
  disabled,
  fullWidth = true,
  style,
}: {
  label: string;
  onPress?: () => void;
  color?: BrandColor;
  variant?: 'solid' | 'soft' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const a = accent(color);
  const pad = size === 'lg' ? 18 : size === 'sm' ? 11 : 15;
  const fontSize = size === 'lg' ? 16.5 : size === 'sm' ? 13.5 : 15.5;
  const isSolid = variant === 'solid';
  const textColor = isSolid ? '#FFFFFF' : a.color;

  const inner = (
    <View style={styles.btnInner}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.btnText, { color: textColor, fontSize }]}>{label}</Text>
        </>
      )}
    </View>
  );

  const baseStyle: StyleProp<ViewStyle> = [
    styles.btnBase,
    { paddingVertical: pad },
    fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start', paddingHorizontal: 22 },
    disabled && { opacity: 0.5 },
    style,
  ];

  if (isSolid) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        disabled={disabled || loading}
        style={[baseStyle, a.glow as ViewStyle]}
      >
        <LinearGradient
          colors={(color === 'coral' ? a.gradient : gradients.tri) as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.button }]}
        />
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        baseStyle,
        variant === 'soft'
          ? { backgroundColor: a.soft }
          : { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: a.color },
      ]}
    >
      {inner}
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* IconButton                                                          */
/* ------------------------------------------------------------------ */
export function IconButton({
  children,
  onPress,
  color = 'neutral',
  badge,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  color?: BrandColor;
  badge?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const a = accent(color);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.iconBtn, color !== 'neutral' && { backgroundColor: a.soft, borderColor: 'transparent' }, style]}
    >
      {children}
      {badge != null && badge > 0 && (
        <View style={styles.iconBtnBadge}>
          <Text style={styles.iconBtnBadgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* FilterButton — light blue bg, blue icon                            */
/* ------------------------------------------------------------------ */
export function FilterButton({
  onPress,
  label,
  active,
  icon,
}: {
  onPress?: () => void;
  label?: string;
  active?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.filterBtn, active && { backgroundColor: brand.blue, borderColor: brand.blue }]}
    >
      {icon}
      {!!label && (
        <Text style={[styles.filterBtnText, active && { color: '#FFFFFF' }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* Chip                                                                */
/* ------------------------------------------------------------------ */
export function Chip({
  label,
  color = 'blue',
  icon,
  selected,
  onPress,
  style,
}: {
  label: string;
  color?: BrandColor;
  icon?: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const a = accent(color);
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        selected ? { backgroundColor: a.color } : { backgroundColor: a.soft },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : a.color }]}>{label}</Text>
    </Wrapper>
  );
}

/* ------------------------------------------------------------------ */
/* Badge — counter (coral by default)                                 */
/* ------------------------------------------------------------------ */
export function Badge({
  value,
  color = 'coral',
  style,
}: {
  value: number | string;
  color?: BrandColor;
  style?: StyleProp<ViewStyle>;
}) {
  const a = accent(color);
  return (
    <View style={[styles.badge, { backgroundColor: a.color }, style]}>
      <Text style={styles.badgeText}>{value}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle — turquoise ON, gray OFF                                     */
/* ------------------------------------------------------------------ */
export function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={() => onChange?.(!value)}
      style={[
        styles.toggleTrack,
        { backgroundColor: value ? brand.turquoise : '#CBD5E1' },
        disabled && { opacity: 0.5 },
      ]}
    >
      <View style={[styles.toggleThumb, value ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* KPIBox — mini stat card                                            */
/* ------------------------------------------------------------------ */
export function KPIBox({
  icon,
  value,
  label,
  color = 'blue',
  onPress,
  style,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color?: BrandColor;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const a = accent(color);
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.9} style={[styles.kpiBox, shadow.sm as ViewStyle, style]}>
      <View style={[styles.kpiIcon, { backgroundColor: a.soft }]}>{icon}</View>
      <Text style={[styles.kpiValue, { color: a.color }]}>{value}</Text>
      <Text style={styles.kpiLabel} numberOfLines={1}>
        {label}
      </Text>
    </Wrapper>
  );
}

/* ------------------------------------------------------------------ */
/* ServiceTile                                                         */
/* ------------------------------------------------------------------ */
export function ServiceTile({
  icon,
  title,
  subtitle,
  color = 'blue',
  onPress,
  style,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color?: BrandColor;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const a = accent(color);
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.serviceTile, shadow.sm as ViewStyle, { borderColor: a.soft }, style]}
    >
      <View style={[styles.serviceTileIcon, { backgroundColor: a.soft }]}>{icon}</View>
      <View style={styles.serviceTileText}>
        <Text style={styles.serviceTileTitle} numberOfLines={2}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.serviceTileSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      <ChevronRight size={16} color={brand.textTertiary} strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState                                                          */
/* ------------------------------------------------------------------ */
export function EmptyState({
  icon,
  title,
  message,
  color = 'blue',
  actionLabel,
  onAction,
  style,
}: {
  icon: React.ReactNode;
  title: string;
  message?: string;
  color?: BrandColor;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const a = accent(color);
  return (
    <View style={[styles.emptyState, style]}>
      <View style={[styles.emptyIconRing, { borderColor: a.soft }]}>
        <LinearGradient
          colors={a.gradient as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyIconCircle}
        >
          {icon}
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!message && <Text style={styles.emptyMessage}>{message}</Text>}
      {!!actionLabel && (
        <Button label={actionLabel} onPress={onAction} color={color} fullWidth={false} style={{ marginTop: 18 }} />
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* RoleCard — welcome screen role selection                           */
/* ------------------------------------------------------------------ */
export function RoleCard({
  icon,
  title,
  description,
  color = 'blue',
  gradientColors,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: BrandColor;
  /** Optional override to render a custom (e.g. tri-color) gradient. */
  gradientColors?: readonly string[];
  onPress?: () => void;
}) {
  const a = accent(color);
  const cardGradient = (gradientColors ?? a.gradient) as readonly [string, string, ...string[]];
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.roleCard, a.glow as ViewStyle]}>
      <LinearGradient
        colors={cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.roleCardGradient}
      >
        <View pointerEvents="none" style={styles.roleBlob} />
        <View style={styles.roleCardRow}>
          <View style={styles.roleIcon}>{icon}</View>
          <View style={styles.roleTextWrap}>
            <Text style={styles.roleTitle}>{title}</Text>
            <Text style={styles.roleDescription}>{description}</Text>
          </View>
          <View style={styles.roleChevron}>
            <ChevronRight size={22} color="#FFFFFF" strokeWidth={2.6} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */
export function Input({
  value,
  onChangeText,
  placeholder,
  icon,
  rightIcon,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  focusedColor = 'blue',
  style,
  ...rest
}: {
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  focusedColor?: BrandColor;
  style?: StyleProp<ViewStyle>;
  [key: string]: any;
}) {
  const [focused, setFocused] = React.useState(false);
  const a = accent(focusedColor);
  return (
    <View
      style={[
        styles.input,
        focused && { borderColor: a.color, backgroundColor: '#FFFFFF' },
        style,
      ]}
    >
      {icon}
      <TextInput
        style={styles.inputField}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={brand.textTertiary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
      {rightIcon}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Dropdown — selector field (caller supplies modal/sheet)            */
/* ------------------------------------------------------------------ */
export function Dropdown({
  label,
  value,
  placeholder,
  onPress,
  icon,
  active,
  style,
}: {
  label?: string;
  value?: string;
  placeholder?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      {!!label && <Text style={styles.dropdownLabel}>{label}</Text>}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.dropdown, active && { borderColor: brand.blue, backgroundColor: '#FFFFFF' }]}
      >
        {icon}
        <Text style={[styles.dropdownValue, !value && { color: brand.textTertiary }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color={active ? brand.blue : brand.textSecondary} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  // GradientHeader
  gradientHeader: {
    paddingTop: 8,
    paddingBottom: 18,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  headerBlobA: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -120,
    right: -60,
  },
  headerBlobB: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -90,
    left: -40,
  },

  // AppHeader
  appHeaderPlain: {
    backgroundColor: brand.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: brand.borderLight,
  },
  appHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appHeaderTitleWrap: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
  appHeaderTitle: { fontSize: 19, fontWeight: '800' },
  appHeaderSubtitle: { fontSize: 12.5, fontWeight: '500', marginTop: 1 },
  appHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.border,
  },
  headerIconBtnGlass: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.35)',
  },

  // Card
  card: {
    backgroundColor: brand.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: brand.borderLight,
    padding: 16,
  },

  // SectionHeader
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionAccentBar: { width: 4, height: 20, borderRadius: 2 },
  sectionTitle: { fontSize: 18.5, fontWeight: '800', color: brand.textPrimary },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { fontSize: 13.5, fontWeight: '700' },

  // Button
  btnBase: {
    borderRadius: radius.button,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontWeight: '700' },

  // IconButton
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.border,
  },
  iconBtnBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: brand.coral,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: brand.surface,
  },
  iconBtnBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },

  // FilterButton
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: brand.blueSoft,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterBtnText: { fontSize: 14, fontWeight: '700', color: brand.blue },

  // Chip
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  chipText: { fontSize: 12.5, fontWeight: '700' },

  // Badge
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },

  // Toggle
  toggleTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },

  // KPIBox
  kpiBox: {
    flex: 1,
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.borderLight,
    borderRadius: radius.card,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiValue: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  kpiLabel: { fontSize: 11, fontWeight: '600', color: brand.textSecondary, textAlign: 'center' },

  // ServiceTile
  serviceTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 92,
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  serviceTileIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.tile,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceTileText: { flex: 1, minWidth: 0 },
  serviceTileTitle: { fontSize: 14.5, fontWeight: '800', color: brand.textPrimary, marginBottom: 2, lineHeight: 18 },
  serviceTileSubtitle: { fontSize: 11.5, fontWeight: '500', color: brand.textSecondary, lineHeight: 15 },

  // EmptyState
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIconRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: brand.textPrimary, textAlign: 'center', marginBottom: 6 },
  emptyMessage: { fontSize: 14, fontWeight: '500', color: brand.textSecondary, textAlign: 'center', lineHeight: 20 },

  // RoleCard
  roleCard: { borderRadius: 22, overflow: 'hidden' },
  roleCardGradient: { padding: 20, minHeight: 104, justifyContent: 'center', overflow: 'hidden' },
  roleBlob: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.14)',
    top: -70,
    right: -30,
  },
  roleCardRow: { flexDirection: 'row', alignItems: 'center' },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleTextWrap: { flex: 1 },
  roleTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  roleDescription: { fontSize: 13.5, color: 'rgba(255,255,255,0.9)', lineHeight: 19 },
  roleChevron: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Input
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: brand.muted,
    borderWidth: 1.5,
    borderColor: brand.border,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputField: { flex: 1, fontSize: 15, color: brand.textPrimary, paddingVertical: 12 },

  // Dropdown
  dropdownLabel: { fontSize: 13, fontWeight: '700', color: brand.textSecondary, marginBottom: 8 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: brand.muted,
    borderWidth: 1.5,
    borderColor: brand.border,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  dropdownValue: { flex: 1, fontSize: 15, fontWeight: '600', color: brand.textPrimary },
});

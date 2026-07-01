import { Platform } from 'react-native';

/**
 * Maw3edak premium medical brand system.
 * Single source of truth for the mobile app's color identity.
 *
 * Core palette:
 *  - Turquoise #15C2B0 — health / wellness / success / active toggles / positive status
 *  - Blue      #2D7DD2 — primary buttons, CTAs, links, active states, clinical actions
 *  - Coral     #FF6F61 — alerts, errors, warnings, counters, delete/off actions
 */
export const brand = {
  // Brand core
  turquoise: '#15C2B0',
  turquoiseDark: '#0FA295',
  blue: '#2D7DD2',
  blueDark: '#1E5FA8',
  coral: '#FF6F61',
  coralDark: '#E85A4D',

  // Neutrals / text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',

  // Surfaces
  background: '#F8FAFC',
  surface: '#FFFFFF',
  muted: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#EEF1F6',

  // Soft tints (12% brand) — for icon tiles, chips, soft backgrounds
  turquoiseSoft: 'rgba(21,194,176,0.12)',
  blueSoft: 'rgba(45,125,210,0.12)',
  coralSoft: 'rgba(255,111,97,0.12)',

  // Slightly stronger tints for borders on soft surfaces
  turquoiseSoftBorder: 'rgba(21,194,176,0.22)',
  blueSoftBorder: 'rgba(45,125,210,0.22)',
  coralSoftBorder: 'rgba(255,111,97,0.22)',
} as const;

export const radius = {
  card: 22,
  button: 16,
  input: 16,
  tile: 16,
  pill: 999,
  sm: 12,
  lg: 28,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Brand gradients used for headers, hero cards, and role/service tiles. */
export const gradients = {
  // Brand tri-color: Blue → Turquoise → Coral (all three brand colors)
  tri: ['#2D7DD2', '#15C2B0', '#FF6F61'] as [string, string, string],
  // Primary wellness header: blue → turquoise → coral
  header: ['#2D7DD2', '#15C2B0', '#FF6F61'] as [string, string, string],
  headerSoft: ['#EAF4FD', '#E4F8F4'] as [string, string],
  blue: ['#3B8AE0', '#2D7DD2'] as [string, string],
  blueSoft: ['#EAF3FC', '#DCEBFA'] as [string, string],
  turquoise: ['#1ED0BD', '#12B0A0'] as [string, string],
  turquoiseSoft: ['#E4F8F4', '#D4F3EE'] as [string, string],
  coral: ['#FF8475', '#FF6F61'] as [string, string],
  coralSoft: ['#FFEDEB', '#FFE0DC'] as [string, string],
} as const;

/** Soft, premium shadow presets. */
export const shadow = {
  sm: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.07,
      shadowRadius: 22,
    },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.1,
      shadowRadius: 40,
    },
    android: { elevation: 6 },
    default: {},
  }),
  // Colored glow shadows for primary CTAs
  blueGlow: Platform.select({
    ios: {
      shadowColor: '#2D7DD2',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.32,
      shadowRadius: 20,
    },
    android: { elevation: 6 },
    default: {},
  }),
  turquoiseGlow: Platform.select({
    ios: {
      shadowColor: '#15C2B0',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.32,
      shadowRadius: 20,
    },
    android: { elevation: 6 },
    default: {},
  }),
  coralGlow: Platform.select({
    ios: {
      shadowColor: '#FF6F61',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;

/**
 * Per-screen palette that mirrors the shape used across existing screens
 * (pageBg, cardBg, primary, lightBlue, etc.) but injects the brand identity.
 * Screens that already declare a local `getPalette(isDark)` can be pointed here.
 */
export const getBrandPalette = (isDark: boolean) =>
  isDark
    ? {
        pageBg: '#0B1220',
        cardBg: '#1E293B',
        elevatedBg: '#334155',
        rowBg: '#0F172A',
        text: '#F1F5F9',
        textSecondary: '#94A3B8',
        muted: '#64748B',
        border: '#334155',
        borderStrong: '#475569',

        primary: '#4FA3E6', // brand blue, lightened for dark bg
        primaryStrong: '#2D7DD2',
        lightBlue: '#16324E',
        avatarBg: '#16324E',
        dot: '#334155',

        turquoise: '#2BD4C2',
        turquoiseSoft: 'rgba(21,194,176,0.18)',
        blue: '#4FA3E6',
        blueSoft: 'rgba(45,125,210,0.18)',
        coral: '#FF8475',
        coralSoft: 'rgba(255,111,97,0.18)',
      }
    : {
        pageBg: '#F8FAFC',
        cardBg: '#FFFFFF',
        elevatedBg: '#FFFFFF',
        rowBg: '#F8FAFC',
        text: '#0F172A',
        textSecondary: '#64748B',
        muted: '#94A3B8',
        border: '#EEF1F6',
        borderStrong: '#E2E8F0',

        primary: '#2D7DD2', // brand blue
        primaryStrong: '#1E5FA8',
        lightBlue: '#EAF3FC',
        avatarBg: '#EAF3FC',
        dot: '#BFD9F5',

        turquoise: '#15C2B0',
        turquoiseSoft: 'rgba(21,194,176,0.12)',
        blue: '#2D7DD2',
        blueSoft: 'rgba(45,125,210,0.12)',
        coral: '#FF6F61',
        coralSoft: 'rgba(255,111,97,0.12)',
      };

export type BrandPalette = ReturnType<typeof getBrandPalette>;

/**
 * Brand-aligned icon-tile color sets for service / KPI tiles.
 * Each entry: soft background + saturated icon/accent color.
 */
export const tileColors = {
  blue: { bg: brand.blueSoft, color: brand.blue, border: brand.blueSoftBorder },
  turquoise: { bg: brand.turquoiseSoft, color: brand.turquoise, border: brand.turquoiseSoftBorder },
  coral: { bg: brand.coralSoft, color: brand.coral, border: brand.coralSoftBorder },
} as const;

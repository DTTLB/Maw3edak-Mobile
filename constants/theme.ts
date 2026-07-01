export const colors = {
  primary: '#2D7DD2', // brand Blue
  primaryLight: '#EAF3FC',
  primaryDark: '#1E5FA8',

  success: '#15C2B0', // brand Turquoise
  successLight: '#E4F8F4',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  error: '#FF6F61', // brand Coral
  errorLight: '#FFEDEB',

  info: '#2D7DD2',
  infoLight: '#EAF3FC',

  // Brand aliases
  turquoise: '#15C2B0',
  turquoiseLight: '#E4F8F4',
  blue: '#2D7DD2',
  blueLight: '#EAF3FC',
  coral: '#FF6F61',
  coralLight: '#FFEDEB',

  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',

  background: '#F8FAFC',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',

  surface: '#FFFFFF',

  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    tertiary: '#94A3B8',
    disabled: '#CBD5E1',
  },

  border: {
    light: '#EEF1F6',
    medium: '#E2E8F0',
    dark: '#CBD5E1',
  },

  notification: {
    unreadBg: '#EFF6FF',
    unreadBorder: '#BFDBFE',
    unreadDot: '#3B82F6',
    readBg: '#FFFFFF',
    readCheck: '#10B981',
  },

  shadow: {
    color: '#000000',
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    lineHeight: 36,
  },
  h2: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    lineHeight: 22,
  },
  bodySemiBold: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  captionMedium: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    lineHeight: 18,
  },
  small: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  smallMedium: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    lineHeight: 16,
  },
};

export const categoryColors = {
  order: {
    bg: '#EAF3FC',
    color: '#2D7DD2',
  },
  appointment: {
    bg: '#E4F8F4',
    color: '#15C2B0',
  },
  prescription: {
    bg: '#E4F8F4',
    color: '#0FA295',
  },
  package: {
    bg: '#EAF3FC',
    color: '#1E5FA8',
  },
  invoice: {
    bg: '#FFEDEB',
    color: '#FF6F61',
  },
  question: {
    bg: '#FFEDEB',
    color: '#E85A4D',
  },
  general: {
    bg: '#F1F5F9',
    color: '#64748B',
  },
};

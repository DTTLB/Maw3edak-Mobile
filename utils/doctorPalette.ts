// Shared premium healthcare palette for the doctor section — light + dark variants.
// Use with the `makeStyles(P)` factory pattern so every doctor screen responds to dark mode:
//
//   const { isDark } = useTheme();
//   const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
//   const styles = useMemo(() => makeStyles(P), [P]);
//   ...
//   const makeStyles = (P: DoctorPalette) => StyleSheet.create({ ... });
//
// Keep intentional accent colors (status greens/reds, colored icon chips) inline; map only
// structural colors (backgrounds, cards, text, borders, inputs) to this palette.

export const getDoctorPalette = (isDark: boolean) =>
  isDark
    ? {
        pageBg: '#0B1220',
        cardBg: '#1E293B',
        elevatedBg: '#334155',
        rowBg: '#0F172A',
        disabledBg: '#0F172A',
        inputBg: '#0F172A',

        text: '#F1F5F9',
        textSecondary: '#94A3B8',
        placeholder: '#64748B',
        chevron: '#94A3B8',

        border: '#334155',
        softBorder: '#1E293B',
        borderStrong: '#475569',
        inputBorder: '#475569',
        iconCardBorder: '#16324E',
        dashed: '#475569',

        primary: '#4FA3E6',
        lightBlue: '#16324E',
        avatarBg: '#16324E',
        dot: '#334155',

        success: '#2BD4C2',
        successBg: '#0E3B37',
        warning: '#FBBF24',
        warningBg: '#78350F',
        danger: '#FF8475',
        dangerBg: '#5A211C',
        cancelBtnBg: '#5A211C',

        overlay: 'rgba(0,0,0,0.6)',
        shadow: '#000000',
      }
    : {
        pageBg: '#F8FAFC',
        cardBg: '#FFFFFF',
        elevatedBg: '#FFFFFF',
        rowBg: '#F8FAFC',
        disabledBg: '#F8FAFC',
        inputBg: '#F9FAFB',

        text: '#0F172A',
        textSecondary: '#64748B',
        placeholder: '#94A3B8',
        chevron: '#334155',

        border: '#E2E8F0',
        softBorder: '#EEF1F6',
        borderStrong: '#E2E8F0',
        inputBorder: '#CBD5E1',
        iconCardBorder: '#EAF3FC',
        dashed: '#BFD9F5',

        primary: '#2D7DD2',
        lightBlue: '#EAF3FC',
        avatarBg: '#EAF3FC',
        dot: '#BFD9F5',

        success: '#15C2B0',
        successBg: '#E4F8F4',
        warning: '#D97706',
        warningBg: '#FEF3C7',
        danger: '#FF6F61',
        dangerBg: '#FFEDEB',
        cancelBtnBg: '#FFEDEB',

        overlay: 'rgba(0,0,0,0.45)',
        shadow: '#0F172A',
      };

export type DoctorPalette = ReturnType<typeof getDoctorPalette>;

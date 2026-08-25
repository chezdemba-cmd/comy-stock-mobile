/**
 * Design tokens de la marque Comy_stock.
 * Valeurs reprises telles quelles du handoff design (design_handoff_comy_stock/README.md)
 * pour rester fidèle à l'identité visuelle du site vitrine.
 */

export const colors = {
  background: '#071411',
  backgroundElevated: '#0b2019',
  surface: '#0d1f1a',
  surfaceGradientTop: '#10241e',
  surfaceHighlightStart: '#123028',
  surfaceHighlightEnd: '#0d1f1a',

  green: '#2fa85c',
  greenGradientStart: '#1c8a45',
  greenGradientEnd: '#2fa85c',
  greenDeep: '#197a3e',
  greenDeeper: '#14663a',
  greenDeepest: '#0d4426',

  gold: '#d4af37',
  goldLightStart: '#e8c46a',
  goldLightEnd: '#f0d68a',

  textPrimary: '#f2f8f5',
  textOnWhite: '#ffffff',
  textSecondary: '#9ab5ab',
  textTertiary: '#7d968d',
  textTertiaryAlt: '#8ba79d',
  textOnLight: '#072e17',

  border: 'rgba(47,168,92,0.2)',
  borderHover: 'rgba(47,168,92,0.35)',
  borderPremium: 'rgba(47,168,92,0.6)',

  danger: '#e5484d',
  warning: '#e8c46a',
  success: '#2fa85c',
} as const;

export const radii = {
  button: 14,
  card: 22,
  cardLarge: 24,
  block: 30,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  xxxl: 36,
} as const;

export const typography = {
  fontHeading: 'Poppins_600SemiBold',
  fontHeadingBold: 'Poppins_700Bold',
  fontBody: 'DMSans_400Regular',
  fontBodyMedium: 'DMSans_500Medium',

  h1: { fontSize: 40, lineHeight: 42 },
  h2: { fontSize: 30, lineHeight: 34 },
  h3: { fontSize: 20, lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  overline: { fontSize: 13, lineHeight: 16, letterSpacing: 2.4 },
} as const;

export const shadows = {
  button: {
    shadowColor: '#1c8a45',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 4,
  },
} as const;

export const theme = { colors, radii, spacing, typography, shadows } as const;

export type Theme = typeof theme;

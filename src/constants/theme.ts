/**
 * Design tokens de la marque Comy_stock.
 * Palette affinée par rapport au handoff design initial (design_handoff_comy_stock/README.md) :
 * fond neutre anthracite (moins de teinte verte), vert réservé aux accents/actions, or inchangé.
 */

export const colors = {
  background: '#15171a',
  backgroundElevated: '#1a1d20',
  surface: '#1e2124',
  surfaceGradientTop: '#22262a',
  surfaceHighlightStart: '#262b2f',
  surfaceHighlightEnd: '#1e2124',

  green: '#22a06b',
  greenGradientStart: '#158a56',
  greenGradientEnd: '#22a06b',
  greenDeep: '#127a4c',
  greenDeeper: '#0f6640',
  greenDeepest: '#0a4429',

  gold: '#d4af37',
  goldLightStart: '#e8c46a',
  goldLightEnd: '#f0d68a',

  textPrimary: '#f2f8f5',
  textOnWhite: '#ffffff',
  textSecondary: '#98a3a0',
  textTertiary: '#7c8683',
  textTertiaryAlt: '#8b9895',
  textOnLight: '#072e17',

  border: 'rgba(34,160,107,0.2)',
  borderHover: 'rgba(34,160,107,0.35)',
  borderPremium: 'rgba(34,160,107,0.6)',

  danger: '#e5484d',
  warning: '#e8c46a',
  success: '#22a06b',
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
    shadowColor: '#158a56',
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

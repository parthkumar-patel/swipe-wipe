export const colors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceLight: '#2A2A2A',
  border: '#333333',
  text: '#FFFFFF',
  textSecondary: '#999999',
  textTertiary: '#666666',
  keep: '#22C55E',
  keepBg: 'rgba(34, 197, 94, 0.15)',
  delete: '#EF4444',
  deleteBg: 'rgba(239, 68, 68, 0.15)',
  phone: '#3B82F6',
  phoneBg: 'rgba(59, 130, 246, 0.15)',
  export: '#F97316',
  exportBg: 'rgba(249, 115, 22, 0.15)',
  accent: '#8B5CF6',
  warning: '#EAB308',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.37 },
  title: { fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.36 },
  title2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: 0.35 },
  title3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: 0.38 },
  headline: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.41 },
  body: { fontSize: 17, fontWeight: '400' as const, letterSpacing: -0.41 },
  callout: { fontSize: 16, fontWeight: '400' as const, letterSpacing: -0.32 },
  subhead: { fontSize: 15, fontWeight: '400' as const, letterSpacing: -0.24 },
  footnote: { fontSize: 13, fontWeight: '400' as const, letterSpacing: -0.08 },
  caption: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0 },
} as const;

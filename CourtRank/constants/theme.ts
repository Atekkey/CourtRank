// Semantic color tokens. Screens should reference these instead of hex literals
// so every surface follows the active light/dark scheme.

const light = {
  background: '#f5f5f5',
  card: '#ffffff',
  surface: '#f8f9fa', // inputs, inset panels
  surfaceAlt: '#f0f0f0',
  cardMuted: '#d4d4d4', // expired league cards
  surfaceMuted: '#dfdfdf',
  text: '#333333',
  textStrong: '#000000',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#e0e0e0',
  borderStrong: '#cccccc',
  divider: '#f0f0f0',
  primary: '#8E24AA', // fills (buttons, tab bar)
  primaryText: '#8E24AA', // primary-colored text/icons on background
  primarySoft: '#f3e5f5',
  onPrimary: '#ffffff',
  accent: 'orange',
  disabled: '#cccccc',
  success: '#4CAF50',
  successSoft: '#d6f5d6',
  selectedWin: '#98e698',
  selectedLoss: '#e69898',
  warning: '#FF9800',
  danger: '#f44336',
  dangerText: '#d32f2f',
  dangerSoft: '#f5d6d6',
  info: '#2f95dc',
  infoSoft: '#e3f2fd',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  googleText: '#3c4043',
  googleBorder: '#dadce0',
};

export type ThemeColors = typeof light;

const dark: ThemeColors = {
  background: '#121212',
  card: '#1e1e1e',
  surface: '#2a2a2a',
  surfaceAlt: '#262626',
  cardMuted: '#2b2b2b',
  surfaceMuted: '#353535',
  text: '#e6e6e6',
  textStrong: '#ffffff',
  textSecondary: '#b3b3b3',
  textMuted: '#8a8a8a',
  border: '#3a3a3a',
  borderStrong: '#4a4a4a',
  divider: '#2c2c2c',
  primary: '#9C27B0',
  primaryText: '#CE93D8',
  primarySoft: '#3a2340',
  onPrimary: '#ffffff',
  accent: 'orange',
  disabled: '#4a4a4a',
  success: '#43A047',
  successSoft: '#1f3a22',
  selectedWin: '#2e6b34',
  selectedLoss: '#7a2e2e',
  warning: '#FFA726',
  danger: '#ef5350',
  dangerText: '#ef9a9a',
  dangerSoft: '#3d1f1f',
  info: '#64b5f6',
  infoSoft: '#1a2b3a',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  googleText: '#e6e6e6',
  googleBorder: '#4a4a4a',
};

export const Colors = { light, dark };

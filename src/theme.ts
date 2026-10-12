// Design tokens. Names follow shadcn/ui; values are the project theme converted from oklch to sRGB hex,
// because React Native has no CSS variables or oklch(). good/bad/skip are Sway additions for the three votes.
export const light = {
  background: '#FFFFFF', foreground: '#000000',
  card: '#F7F8F8', cardForeground: '#202020',
  popover: '#FFFFFF', popoverForeground: '#323232',
  primary: '#58D3DB', primaryForeground: '#000000',
  secondary: '#202020', secondaryForeground: '#FFFFFF',
  muted: '#F1F5F9', mutedForeground: '#323232',
  accent: '#E3ECF6', accentForeground: '#323232',
  destructive: '#F4212E', destructiveForeground: '#FFFFFF',
  border: '#E1EAEF', input: '#F7F9FA', ring: '#58D3DB',
  good: '#17BF63', goodForeground: '#000000', goodText: '#0B7A43', goodSoft: '#E3F7EC',
  bad: '#F4212E', badForeground: '#FFFFFF', badText: '#C8101D', badSoft: '#FDE8E9',
  skip: '#8B98A5',
};
export const dark: Theme = {
  background: '#121212', foreground: '#E7E9EA',
  card: '#17181C', cardForeground: '#E7E9EA',
  popover: '#121212', popoverForeground: '#E7E9EA',
  primary: '#58D3DB', primaryForeground: '#000000',
  secondary: '#E7E9EA', secondaryForeground: '#202020',
  muted: '#1A1D1E', mutedForeground: '#8B98A5',
  accent: '#12383B', accentForeground: '#E7E9EA',
  destructive: '#F4212E', destructiveForeground: '#FFFFFF',
  border: '#2F3336', input: '#16181C', ring: '#58D3DB',
  good: '#17BF63', goodForeground: '#000000', goodText: '#4ADE94', goodSoft: '#10301F',
  bad: '#F4212E', badForeground: '#FFFFFF', badText: '#FF7A82', badSoft: '#3A1518',
  skip: '#6B7780',
};
export type Theme = typeof light;
export const fonts = { display: 'OpenSansExtraBold', body: 'OpenSansRegular', medium: 'OpenSansSemiBold', bold: 'OpenSansBold' };
export const space = { xs: 4, sm: 8, md: 12, lg: 20, xl: 28 };
// --radius: 0.5rem
export const radius = { sm: 4, md: 6, lg: 8, xl: 12 };
// --tracking-normal: 0.025em
export const tracking = (fontSize: number) => fontSize * 0.025;

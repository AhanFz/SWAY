import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useSway } from '../../state/SwayProvider';
import { fonts, tracking, type Theme } from '../../theme';

const variants = {
  h1: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38 },
  h2: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32 },
  h3: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
  large: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 24 },
  p: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  muted: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
} satisfies Record<string, TextStyle>;
const headings = new Set(['h1', 'h2', 'h3']);

export type TextProps = RNTextProps & { variant?: keyof typeof variants; tone?: keyof Theme };
export function Text({ variant = 'p', tone, style, ...props }: TextProps) {
  const { theme } = useSway();
  const base = variants[variant];
  const color = theme[tone ?? (variant === 'muted' || variant === 'caption' ? 'mutedForeground' : 'foreground')];
  return <RNText accessibilityRole={headings.has(variant) ? 'header' : undefined} {...props} style={[base, { color, letterSpacing: headings.has(variant) ? 0 : tracking(base.fontSize) }, style]} />;
}

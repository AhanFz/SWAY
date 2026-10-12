import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useSway } from '../../state/SwayProvider';
import { fonts, radius, tracking, type Theme } from '../../theme';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'good';
type Size = 'default' | 'sm' | 'lg';
export type ButtonProps = {
  children: ReactNode; onPress: () => void; variant?: Variant; size?: Size; disabled?: boolean;
  icon?: ComponentProps<typeof Feather>['name']; accessibilityLabel?: string; style?: StyleProp<ViewStyle>;
};
function colors(theme: Theme, variant: Variant) {
  switch (variant) {
    case 'secondary': return { bg: theme.secondary, fg: theme.secondaryForeground, border: theme.secondary };
    case 'outline': return { bg: theme.background, fg: theme.foreground, border: theme.border };
    case 'ghost': case 'link': return { bg: 'transparent', fg: theme.foreground, border: 'transparent' };
    case 'destructive': return { bg: theme.destructive, fg: theme.destructiveForeground, border: theme.destructive };
    case 'good': return { bg: theme.good, fg: theme.goodForeground, border: theme.good };
    default: return { bg: theme.primary, fg: theme.primaryForeground, border: theme.primary };
  }
}
// Heights stay at or above 44pt so every variant is a comfortable touch target.
const sizes = { sm: { minHeight: 44, paddingHorizontal: 12, fontSize: 14 }, default: { minHeight: 48, paddingHorizontal: 18, fontSize: 15 }, lg: { minHeight: 56, paddingHorizontal: 22, fontSize: 16 } };
export function Button({ children, onPress, variant = 'default', size = 'default', disabled = false, icon, accessibilityLabel, style }: ButtonProps) {
  const { theme } = useSway();
  const c = colors(theme, variant), z = sizes[size];
  return <Pressable accessibilityRole={variant === 'link' ? 'link' : 'button'} accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.base, { minHeight: z.minHeight, paddingHorizontal: variant === 'link' ? 0 : z.paddingHorizontal, backgroundColor: pressed && (variant === 'ghost' || variant === 'outline') ? theme.accent : c.bg, borderColor: c.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]}>
    {icon && <Feather name={icon} size={z.fontSize + 3} color={c.fg} />}
    <Text style={{ fontFamily: fonts.medium, fontSize: z.fontSize, letterSpacing: tracking(z.fontSize), color: c.fg, textDecorationLine: variant === 'link' ? 'underline' : 'none' }}>{children}</Text>
  </Pressable>;
}
const s = StyleSheet.create({ base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md, borderWidth: 1 } });

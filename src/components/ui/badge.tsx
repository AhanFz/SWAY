import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSway } from '../../state/SwayProvider';
import { fonts, radius, tracking } from '../../theme';

type Variant = 'default' | 'secondary' | 'accent' | 'outline';
export function Badge({ children, variant = 'default', style }: { children: string; variant?: Variant; style?: StyleProp<ViewStyle> }) {
  const { theme } = useSway();
  const c = variant === 'secondary' ? { bg: theme.secondary, fg: theme.secondaryForeground, border: theme.secondary }
    : variant === 'accent' ? { bg: theme.accent, fg: theme.accentForeground, border: theme.accent }
    : variant === 'outline' ? { bg: 'transparent', fg: theme.foreground, border: theme.border }
    : { bg: theme.primary, fg: theme.primaryForeground, border: theme.primary };
  return <View style={[s.badge, { backgroundColor: c.bg, borderColor: c.border }, style]}><Text style={[s.text, { color: c.fg }]}>{children}</Text></View>;
}
const s = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: tracking(12) },
});

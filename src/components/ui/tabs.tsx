import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSway } from '../../state/SwayProvider';
import { fonts, radius, tracking } from '../../theme';

// shadcn TabsList look, used as a single-choice segmented control.
export function Tabs<T extends string>({ value, options, onValueChange, accessibilityLabel }: { value: T; options: readonly { value: T; label: string }[]; onValueChange: (value: T) => void; accessibilityLabel: string }) {
  const { theme } = useSway();
  return <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={[s.list, { backgroundColor: theme.muted }]}>
    {options.map(option => {
      const active = option.value === value;
      return <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => onValueChange(option.value)}
        style={[s.trigger, active && { backgroundColor: theme.background, borderColor: theme.border }]}>
        <Text style={[s.label, { color: active ? theme.foreground : theme.mutedForeground }]}>{option.label}</Text>
      </Pressable>;
    })}
  </View>;
}
const s = StyleSheet.create({
  list: { flexDirection: 'row', borderRadius: radius.lg, padding: 3, gap: 3 },
  trigger: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent' },
  label: { fontFamily: fonts.medium, fontSize: 14, letterSpacing: tracking(14) },
});

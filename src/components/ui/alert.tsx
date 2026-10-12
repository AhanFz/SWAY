import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useSway } from '../../state/SwayProvider';
import { radius } from '../../theme';
import { Text } from './text';

export function Alert({ title, children, icon = 'info', variant = 'default', action }: { title?: string; children?: ReactNode; icon?: ComponentProps<typeof Feather>['name']; variant?: 'default' | 'destructive'; action?: ReactNode }) {
  const { theme } = useSway();
  const destructive = variant === 'destructive';
  return <View accessibilityLiveRegion="polite" style={[s.alert, { backgroundColor: destructive ? theme.badSoft : theme.card, borderColor: destructive ? theme.badText : theme.border }]}>
    <Feather name={icon} size={18} color={destructive ? theme.badText : theme.foreground} style={{ marginTop: 2 }} />
    <View style={s.body}>
      {title && <Text variant="small" tone={destructive ? 'badText' : 'foreground'}>{title}</Text>}
      {children && <Text variant="muted" tone="foreground">{children}</Text>}
    </View>
    {action}
  </View>;
}
const s = StyleSheet.create({ alert: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 }, body: { flex: 1, gap: 2, paddingVertical: 2 } });

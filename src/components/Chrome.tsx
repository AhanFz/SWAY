import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSway } from '../state/SwayProvider';
import { isDemo } from '../services/api';
import { Alert, Badge, Button, Text } from './ui';

export { Button } from './ui';
export function Header({ title, detail }: { title: string; detail?: string }) {
  const { theme } = useSway();
  return <View style={s.header}>
    <Text variant="h1" style={s.title}>{title}{title === 'Sway' && <Text variant="h1" tone="primary" style={s.title}>.</Text>}</Text>
    <View style={s.side}>
      {!!detail && <Text variant="caption">{detail}</Text>}
      {isDemo && <Badge variant="accent" style={{ alignSelf: 'flex-end', borderColor: theme.border }}>Sample feed</Badge>}
    </View>
  </View>;
}
export function ErrorNotice() {
  const { error, retry } = useSway();
  if (!error) return null;
  return <Alert variant="destructive" icon="alert-circle" title="Something went wrong" action={<Button variant="outline" size="sm" onPress={() => void retry()}>Retry</Button>}>{error}</Alert>;
}
export function Loading() {
  const { theme } = useSway();
  return <View style={{ padding: 32 }}><ActivityIndicator color={theme.foreground} accessibilityLabel="Loading stories" /></View>;
}
const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 14, paddingBottom: 6 },
  title: { fontSize: 34, lineHeight: 40, letterSpacing: -0.8, flexShrink: 1 },
  side: { alignItems: 'flex-end', gap: 6 },
});

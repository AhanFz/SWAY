import { StyleSheet, View, type ViewProps } from 'react-native';
import { useSway } from '../../state/SwayProvider';
import { radius } from '../../theme';
import { Text, type TextProps } from './text';

export function Card({ style, ...props }: ViewProps) {
  const { theme } = useSway();
  return <View {...props} style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }, style]} />;
}
export function CardHeader({ style, ...props }: ViewProps) { return <View {...props} style={[s.header, style]} />; }
export function CardTitle(props: TextProps) { return <Text variant="large" tone="cardForeground" {...props} />; }
export function CardDescription(props: TextProps) { return <Text variant="muted" {...props} />; }
export function CardContent({ style, ...props }: ViewProps) { return <View {...props} style={[s.content, style]} />; }
export function CardFooter({ style, ...props }: ViewProps) { return <View {...props} style={[s.footer, style]} />; }
const s = StyleSheet.create({
  card: { borderRadius: radius.xl, borderWidth: 1, padding: 20, gap: 16 },
  header: { gap: 6 }, content: { gap: 12 }, footer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
});

import { StyleSheet, View } from 'react-native';
import type { Totals } from '../domain/types';
import { percentages, total } from '../domain/results';
import { fonts, radius, type Theme } from '../theme';
import { isDemo } from '../services/api';
import { Text } from './ui';

const keys = ['good', 'skip', 'bad'] as const;
const names = { good: 'Good', skip: 'Skipped', bad: 'Bad' };
export function ResultsBar({ totals, theme, large = false }: { totals: Totals | null; theme: Theme; large?: boolean }) {
  if (!totals || total(totals) < 20) return <Text variant="muted">Not enough votes yet</Text>;
  const n = total(totals), p = percentages(totals);
  return <View accessible accessibilityLabel={`${p.good}% good, ${p.skip}% skipped, ${p.bad}% bad. ${n} ${isDemo ? 'simulated ' : ''}responses.`}>
    <View style={[s.bar, { height: large ? 12 : 8, backgroundColor: theme.muted }]}>{keys.map(key => <View key={key} style={{ flex: totals[key], backgroundColor: theme[key] }} />)}</View>
    <View style={s.numbers}>{keys.map(key => <View key={key} style={key === 'skip' ? s.center : key === 'bad' ? s.end : undefined}>
      <Text tone={key === 'good' ? 'goodText' : key === 'bad' ? 'badText' : 'mutedForeground'} style={[s.percent, { fontSize: large ? 24 : 18, lineHeight: large ? 30 : 24 }]}>{p[key]}%</Text>
      <Text variant="caption">{names[key]}</Text>
    </View>)}</View>
    <Text variant="caption" style={{ marginTop: 10 }}>{n.toLocaleString()} responses{isDemo ? ' · simulated' : ''}</Text>
  </View>;
}
const s = StyleSheet.create({
  bar: { borderRadius: radius.sm, overflow: 'hidden', flexDirection: 'row', gap: 2 },
  numbers: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  percent: { fontFamily: fonts.display, letterSpacing: 0, fontVariant: ['tabular-nums'] },
  center: { alignItems: 'center' }, end: { alignItems: 'flex-end' },
});

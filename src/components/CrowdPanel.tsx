import { StyleSheet } from 'react-native';
import type { HistoryEntry } from '../domain/history';
import { evaluateGuess } from '../domain/history';
import { total } from '../domain/results';
import { useSway } from '../state/SwayProvider';
import { ResultsBar } from './ResultsBar';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Text } from './ui';

export function CrowdPanel({ entry, onShare }: { entry: HistoryEntry; onShare: (entry: HistoryEntry) => void }) {
  const { theme, guess, setPreferences, reveal } = useSway();
  const needsGuess = entry.value !== 'skip' && !entry.revealed;
  const outcome = entry.totals && entry.guess ? evaluateGuess(entry.totals, entry.guess) : null;
  const shareable = !!entry.totals && total(entry.totals) >= 100;
  return <Card style={s.panel}>
    <CardHeader>
      <CardDescription numberOfLines={1} style={{ fontSize: 12, lineHeight: 17 }}>{entry.story.headline}</CardDescription>
      {needsGuess ? <CardTitle>What did most people say?</CardTitle>
        : entry.status !== 'confirmed' ? <CardTitle>{entry.status === 'error' ? 'Response not sent. Tap Retry above.' : 'Saving your response…'}</CardTitle>
        : <CardTitle>{outcome ? outcome.message : 'How the crowd voted'}</CardTitle>}
    </CardHeader>
    {needsGuess ? <>
      <CardContent style={s.choices}>
        {(['bad', 'good'] as const).map(value => <Button key={value} variant="outline" style={s.choice} accessibilityLabel={`Guess the crowd said ${value}`} onPress={() => void guess(entry.id, value)}>
          <Text variant="small" tone={value === 'good' ? 'goodText' : 'badText'} style={{ fontSize: 16 }}>{value === 'good' ? 'Good' : 'Bad'}</Text>
        </Button>)}
      </CardContent>
      <CardFooter><Button variant="link" size="sm" onPress={() => void setPreferences({ guessing: false })}>Don’t ask me</Button></CardFooter>
    </> : entry.status === 'confirmed' && <>
      <CardContent><ResultsBar totals={entry.totals} theme={theme} /></CardContent>
      <CardFooter>
        {shareable ? <Button variant="outline" size="sm" icon="share" onPress={() => onShare(entry)}>Share result</Button>
          : <><Button variant="outline" size="sm" icon="refresh-cw" onPress={() => void reveal(entry)}>Refresh result</Button><Text variant="caption">Not enough votes to share yet</Text></>}
      </CardFooter>
    </>}
  </Card>;
}
const s = StyleSheet.create({ panel: { padding: 16, gap: 12 }, choices: { flexDirection: 'row', gap: 10 }, choice: { flex: 1 } });

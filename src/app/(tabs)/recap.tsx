import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSway } from '../../state/SwayProvider';
import { agrees, personalInsight, roomScore, type HistoryEntry } from '../../domain/history';
import { total } from '../../domain/results';
import { Header, ErrorNotice } from '../../components/Chrome';
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Separator, Text } from '../../components/ui';
import { ResultsBar } from '../../components/ResultsBar';
import { CrowdPanel } from '../../components/CrowdPanel';
import { ShareResult } from '../../components/ShareResult';
import { readSessionInsight, saveSessionInsight } from '../../services/storage';
import { fonts } from '../../theme';
export default function RecapScreen() {
  const { theme, history, sessionId, reveal } = useSway();
  const current = history.filter(e => e.sessionId === sessionId);
  const session = current.length ? current : history.filter(e => e.sessionId === history.at(-1)?.sessionId);
  const score = roomScore(history), requested = useRef(new Set<string>());
  const [insight, setInsight] = useState<{ sessionId: string; text: string } | null>(null), [sharing, setSharing] = useState<HistoryEntry | null>(null);
  const insightSession = session[0]?.sessionId;
  const insightCache = useRef(new Map<string, string>());
  useEffect(() => {
    for (const entry of session) {
      if (entry.status === 'confirmed' && (entry.value === 'skip' || entry.revealed) && !requested.current.has(entry.id)) {
        requested.current.add(entry.id); void reveal(entry);
      }
    }
    if (insightSession && session.every(e => e.status === 'confirmed')) {
      let cancelled = false;
      readSessionInsight(insightSession).then(async saved => {
        const candidate = insightCache.current.get(insightSession) ?? saved ?? personalInsight(history);
        if (candidate) {
          insightCache.current.set(insightSession, candidate);
          await saveSessionInsight(insightSession, candidate);
        }
        if (!cancelled) setInsight(candidate ? { sessionId: insightSession, text: candidate } : null);
      }).catch(() => { /* Insight absence does not block recap. */ });
      return () => { cancelled = true; };
    }
  }, [session, history, reveal, insightSession]);
  const voted = session.filter(e => e.value !== 'skip').length, sided = session.filter(e => agrees(e)).length;
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}><ScrollView contentContainerStyle={s.page}>
    <Header title="Your recap" detail="A little perspective" /><ErrorNotice />
    {!session.length ? <View style={s.empty}>
      <Text variant="h1">Your take starts here.</Text>
      <Text variant="p" tone="mutedForeground">Read a story and make your first call. Your recap will be waiting.</Text>
      <Button style={{ marginTop: 8 }} onPress={() => router.navigate('/')}>Read the stories</Button>
    </View> : <>
      <Text variant="h2">You voted on {voted} of {session.length} stories and sided with the majority on {sided}.</Text>
      <Card>
        <CardHeader><CardDescription>Read the room</CardDescription><Text style={s.scoreValue}>{score.percent === null ? '—' : `${score.percent}%`}</Text></CardHeader>
        <Text variant="caption">{score.count ? `${score.correct} correct from your last ${score.count} scored guesses` : 'No guesses yet. Turn on Guess the crowd in the You tab to start scoring.'}</Text>
      </Card>
      {insight?.sessionId === insightSession && <Card style={{ backgroundColor: theme.accent, borderColor: theme.accent }}>
        <Text variant="h3" tone="accentForeground">{insight?.text}</Text>
        <Text variant="caption" tone="accentForeground">Only for you · calculated on this device</Text>
      </Card>}
      <Separator />
      {session.map(entry => entry.value !== 'skip' && !entry.revealed ? <CrowdPanel key={entry.id} entry={entry} onShare={setSharing} /> : <Card key={entry.id}>
        <CardHeader>
          <View style={s.rowTop}>
            <Badge variant="accent">{entry.story.topic}</Badge>
            <Badge variant="outline" style={entry.value === 'skip' ? undefined : { borderColor: entry.value === 'good' ? theme.goodText : theme.badText }}>{entry.value === 'skip' ? 'You skipped' : `You said ${entry.value}`}</Badge>
          </View>
          <CardTitle style={s.headline}>{entry.story.headline}</CardTitle>
        </CardHeader>
        {entry.status !== 'confirmed' ? <Text variant="muted">Response {entry.status === 'error' ? 'not sent — tap Retry above' : 'waiting to send'}.</Text> : <>
          <CardContent><ResultsBar totals={entry.totals} theme={theme} large /></CardContent>
          <CardFooter>{entry.totals && total(entry.totals) >= 100 ? <Button variant="outline" size="sm" icon="share" onPress={() => setSharing(entry)}>Share result</Button> : <Text variant="caption">Not enough votes to share yet</Text>}</CardFooter>
        </>}
      </Card>)}
      <Button onPress={() => router.navigate('/')}>Keep reading</Button>
    </>}
    {sharing && <ShareResult entry={sharing} onClose={() => setSharing(null)} />}
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingBottom: 30, gap: 16, maxWidth: 480, width: '100%', alignSelf: 'center' },
  scoreValue: { fontFamily: fonts.display, fontSize: 36, lineHeight: 42, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  headline: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 25 },
  empty: { paddingVertical: 60, gap: 16 },
});

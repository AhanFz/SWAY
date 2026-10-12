import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useSharedValue } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSway } from '../../state/SwayProvider';
import { StoryCard, type VoteCommand } from '../../components/StoryCard';
import { Header, ErrorNotice, Loading } from '../../components/Chrome';
import { Button, Text } from '../../components/ui';
import { CrowdPanel } from '../../components/CrowdPanel';
import { ShareResult } from '../../components/ShareResult';
import type { ResponseValue } from '../../domain/types';
import type { HistoryEntry } from '../../domain/history';
import { isDemo } from '../../services/api';
export default function ReadScreen() {
  const { theme, darkMode, ready, error, feed, history, sessionId, respond, loading, more, loadMore } = useSway();
  const [exited, setExited] = useState<string[]>([]), [command, setCommand] = useState<VoteCommand>(null);
  const [size, setSize] = useState({ width: 0, height: 0 }), [requiredHeight, setRequiredHeight] = useState(0);
  const [sharing, setSharing] = useState<HistoryEntry | null>(null);
  const activeIndex = useSharedValue(0), progress = useSharedValue(0), nonce = useRef(0);
  const window = useWindowDimensions(), insets = useSafeAreaInsets();
  const found = feed.findIndex(s => !history.some(h => h.story.id === s.id));
  const index = found === -1 ? feed.length : found;
  const currentRef = useRef({ feed, index, respond });
  useEffect(() => { currentRef.current = { feed, index, respond }; }, [feed, index, respond]);
  useEffect(() => { if (ready && !error && more && !loading && feed.length - index <= 3) void loadMore(); }, [ready, error, more, loading, feed.length, index, loadMore]);
  const commit = useCallback((id: string, value: ResponseValue) => {
    const current = currentRef.current;
    const story = current.feed.find(s => s.id === id);
    if (story) current.respond(story, value);
  }, []);
  const exit = useCallback((id: string) => setExited(ids => [...ids, id]), []);
  const requireHeight = useCallback((height: number) => setRequiredHeight(current => Math.max(current, height)), []);
  const session = history.filter(h => h.sessionId === sessionId);
  const unanswered = history.find(h => h.value !== 'skip' && !h.revealed);
  const latest = session.at(-1);
  const shown = unanswered ?? (latest?.value !== 'skip' && latest?.revealed ? latest : null);
  const vote = (value: ResponseValue) => { const story = feed[index]; if (story) setCommand({ id: story.id, value, nonce: ++nonce.current }); };
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
    <StatusBar style={darkMode ? 'light' : 'dark'} />
    <ScrollView contentContainerStyle={[s.page, { minHeight: window.height - insets.top - insets.bottom - 56 }]}>
      <Header title="Sway" detail={isDemo && feed.length ? `${Math.min(index + 1, feed.length)} of ${feed.length}` : `${session.length} read this session`} />
      <ErrorNotice />
      {shown && <CrowdPanel entry={shown} onShare={setSharing} />}
      {!ready ? <Loading /> : index >= feed.length ? <View style={s.empty}>
        {loading ? <Loading /> : <>
          <Text variant="h1">{isDemo ? 'That’s the sample deck.' : 'You’re up to date.'}</Text>
          <Text variant="p" tone="mutedForeground">{isDemo ? 'See how your take compared with the sample crowd.' : 'New stories arrive every hour. There’s no daily limit.'}</Text>
          <View style={s.emptyActions}>
            <Button onPress={() => router.navigate('/recap')}>See your recap</Button>
            {!isDemo && <Button variant="outline" icon="refresh-cw" onPress={() => void loadMore()}>Check for stories</Button>}
          </View>
        </>}
      </View> : <>
        <View style={[s.deck, { minHeight: Math.max(415 * Math.max(window.fontScale, 1), requiredHeight) + 24 }]} onLayout={e => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height - 24 })}>
          {size.width > 0 && feed.map((story, i) => ({ story, i })).filter(({ story, i }) => i <= index + 2 && !exited.includes(story.id)).reverse().map(({ story, i }) => <StoryCard key={story.id} story={story} index={i} isTop={i === index} activeIndex={activeIndex} progress={progress} width={size.width} height={size.height} theme={theme} command={command} onCommit={commit} onExit={exit} onRequireHeight={requireHeight} />)}
        </View>
        <View style={s.question}><Text variant="h3">Is this good news?</Text><Text variant="caption">Your take comes first.</Text></View>
        <View style={s.controls}>
          <Button variant="destructive" size="lg" icon="thumbs-down" style={s.vote} accessibilityLabel="Vote bad news" onPress={() => vote('bad')}>Bad</Button>
          <Button variant="outline" size="lg" icon="arrow-down" style={s.skip} accessibilityLabel="Skip story" onPress={() => vote('skip')}>Skip</Button>
          <Button variant="good" size="lg" icon="thumbs-up" style={s.vote} accessibilityLabel="Vote good news" onPress={() => vote('good')}>Good</Button>
        </View>
        <Text variant="caption" style={s.hint}>Swipe left, down, or right. Or tap your choice.</Text>
      </>}
    </ScrollView>
    {sharing && <ShareResult entry={sharing} onClose={() => setSharing(null)} />}
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 18, gap: 14 },
  deck: { flex: 1 },
  question: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 },
  controls: { flexDirection: 'row', gap: 10 }, vote: { flex: 1 }, skip: { flex: 0.7, paddingHorizontal: 8 },
  hint: { textAlign: 'center' },
  empty: { flex: 1, justifyContent: 'center', gap: 16, paddingVertical: 40 }, emptyActions: { gap: 10, marginTop: 8 },
});

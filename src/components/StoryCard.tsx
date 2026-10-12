/* eslint-disable react-hooks/immutability -- Reanimated shared values are explicitly mutable UI-thread state. */
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { type SharedValue, useAnimatedStyle, useSharedValue, withSpring, withTiming, useReducedMotion } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import Feather from '@expo/vector-icons/Feather';
import { dragProgress, exitDuration, resolveSwipe } from '../domain/gestures';
import type { ResponseValue, Story } from '../domain/types';
import { fonts, radius, tracking, type Theme } from '../theme';

export type VoteCommand = { id: string; value: ResponseValue; nonce: number } | null;
type Props = { story: Story; index: number; isTop: boolean; activeIndex: SharedValue<number>; progress: SharedValue<number>; width: number; height: number; theme: Theme; command: VoteCommand; onCommit: (id: string, value: ResponseValue) => void; onExit: (id: string) => void; onRequireHeight: (height: number) => void };
export function StoryCard({ story, index, isTop, activeIndex, progress, width, height, theme, command, onCommit, onExit, onRequireHeight }: Props) {
  const rawY = useSharedValue(0);
  const [now] = useState(() => Date.now());
  const x = useSharedValue(0), y = useSharedValue(0), leaving = useSharedValue(false), opacity = useSharedValue(1);
  const reduced = useReducedMotion();
  const [fontSize, setFontSize] = useState(16);
  const [summaryHeight, setSummaryHeight] = useState<number | null>(null);
  const compact = height < 450;

  const commit = (value: ResponseValue, velocity: number) => {
    'worklet';
    if (leaving.value || activeIndex.value !== index) return;
    leaving.value = true;
    activeIndex.value = index + 1;
    progress.value = 0;
    scheduleOnRN(onCommit, story.id, value);
    const duration = reduced ? 0 : exitDuration(velocity);
    x.value = withTiming(value === 'skip' ? x.value * 0.3 : (value === 'good' ? width + 160 : -width - 160), { duration });
    y.value = withTiming(value === 'skip' ? height + 200 : y.value + 24, { duration }, finished => {
      if (finished) scheduleOnRN(onExit, story.id);
    });
    opacity.value = withTiming(0, { duration: reduced ? 0 : duration });
  };
  useEffect(() => {
    if (command?.id === story.id) scheduleOnUI(commit, command.value, 700);
    // Commands are immutable and uniquely numbered; UI state lives in shared values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command]);
  const pan = Gesture.Pan().minDistance(8).onUpdate(e => {
    if (leaving.value || activeIndex.value !== index) return;
    rawY.value = e.translationY;
    x.value = e.translationX;
    y.value = e.translationY < 0 ? e.translationY * 0.25 : e.translationY;
    progress.value = dragProgress(e.translationX, e.translationY, width, height);
  }).onEnd(e => {
    if (leaving.value || activeIndex.value !== index) return;
    const vote = resolveSwipe(e.translationX, e.translationY, e.velocityX, e.velocityY, width, height);
    if (vote) commit(vote, vote === 'skip' ? e.velocityY : e.velocityX);
  }).onFinalize(() => {
    if (leaving.value || activeIndex.value !== index) return;
    const config = { damping: 16, stiffness: 210, mass: 0.7 };
    rawY.value = withSpring(0, config);
    x.value = withSpring(0, config); y.value = withSpring(0, config); progress.value = withSpring(0, config);
  });
  const animated = useAnimatedStyle(() => {
    const depth = Math.max(0, index - activeIndex.value);
    const rise = depth > 0 ? progress.value : 0;
    return { opacity: opacity.value, zIndex: leaving.value ? 1000 - index : 100 - depth, transform: [
      { translateX: x.value }, { translateY: y.value + 12 * Math.max(0, depth - rise) },
      { rotate: `${reduced ? 0 : x.value * 0.05}deg` }, { scale: 1 - 0.045 * Math.max(0, depth - rise) },
    ] };
  });
  const good = useAnimatedStyle(() => ({ opacity: x.value > 0 && Math.abs(x.value) >= Math.abs(rawY.value) ? Math.min(x.value / (width * 0.28), 1) : 0 }));
  const bad = useAnimatedStyle(() => ({ opacity: x.value < 0 && Math.abs(x.value) >= Math.abs(rawY.value) ? Math.min(-x.value / (width * 0.28), 1) : 0 }));
  const skip = useAnimatedStyle(() => ({ opacity: rawY.value > Math.abs(x.value) ? Math.min(rawY.value / (height * 0.18), 1) : 0 }));
  const ageHours = Math.max(0, Math.round((now - Date.parse(story.publishedAt)) / 3600000));
  const age = ageHours < 1 ? 'just now' : ageHours < 24 ? `${ageHours}h ago` : `${Math.floor(ageHours / 24)}d ago`;
  const open = async (url: string) => { try { await Linking.openURL(url); } catch { Alert.alert('Could not open article', 'Please check your connection and try the source again.'); } };
  return <GestureDetector gesture={pan}>
    <Animated.View pointerEvents={isTop ? 'auto' : 'none'} accessibilityElementsHidden={!isTop} importantForAccessibility={isTop ? 'auto' : 'no-hide-descendants'} style={[s.card, { height, backgroundColor: theme.card, borderColor: theme.border, padding: compact ? 18 : 22 }, animated]}>
      <View style={s.meta}><Text style={[s.topic, { color: theme.accentForeground, backgroundColor: theme.accent }]}>{story.topic}</Text><Text style={[s.age, { color: theme.mutedForeground }]}>{age}</Text></View>
      <Text accessibilityRole="header" style={[s.headline, { color: theme.cardForeground, fontSize: compact ? 23 : 26, lineHeight: compact ? 28 : 32 }]}>{story.headline}</Text>
      <View style={s.summary} onLayout={e => { setSummaryHeight(e.nativeEvent.layout.height); }}>
        <Text key={`${summaryHeight}-${fontSize}`} style={{ fontFamily: fonts.body, color: theme.cardForeground, fontSize, lineHeight: fontSize * 1.5, letterSpacing: tracking(fontSize) }} onTextLayout={e => {
          const lines = e.nativeEvent.lines;
          const bottom = lines.reduce((max, line) => Math.max(max, line.y + line.height), 0);
          if (summaryHeight !== null && bottom > summaryHeight + 1) {
            if (fontSize > 12.5) setFontSize(size => Math.max(12.5, size - 0.5));
            else onRequireHeight(height + bottom - summaryHeight + 8);
          }
        }}>{story.summary}</Text>
      </View>
      <View style={s.meta}><Text numberOfLines={1} style={[s.outlets, { color: theme.mutedForeground }]}>{story.sources.map(source => source.name).join(' + ')}</Text><Text style={[s.words, { color: theme.mutedForeground }]}>{story.summary.trim().split(/\s+/).length} words</Text></View>
      <View style={[s.footer, { borderColor: theme.border }]}>
        <Text style={[s.sourceLabel, { color: theme.mutedForeground }]}>Read the original reporting</Text>
        <View style={s.sources}>{story.sources.map(source =>
          <GestureDetector key={source.url} gesture={Gesture.Native().disallowInterruption(true).blocksExternalGesture(pan)}>
            <Pressable accessible accessibilityRole="link" accessibilityLabel={`Read original article at ${source.name}`} onPress={() => open(source.url)} style={s.source}>
              <Text style={{ fontFamily: fonts.medium, color: theme.cardForeground, fontSize: 14, textDecorationLine: 'underline' }}>{source.name}</Text><Feather name="arrow-up-right" size={15} color={theme.cardForeground} />
            </Pressable>
          </GestureDetector>)}</View>
      </View>
      <Animated.Text pointerEvents="none" style={[s.stamp, { left: 18, color: theme.goodText, borderColor: theme.goodText, backgroundColor: theme.card, transform: [{ rotate: '-12deg' }] }, good]}>GOOD</Animated.Text>
      <Animated.Text pointerEvents="none" style={[s.stamp, { right: 18, color: theme.badText, borderColor: theme.badText, backgroundColor: theme.card, transform: [{ rotate: '12deg' }] }, bad]}>BAD</Animated.Text>
      <Animated.Text pointerEvents="none" style={[s.stamp, { alignSelf: 'center', top: undefined, bottom: 90, color: theme.mutedForeground, borderColor: theme.mutedForeground, backgroundColor: theme.card }, skip]}>SKIP</Animated.Text>
    </Animated.View>
  </GestureDetector>;
}
const s = StyleSheet.create({
  card: { position: 'absolute', left: 0, right: 0, top: 0, borderRadius: radius.xl, borderWidth: 1, gap: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, topic: { fontFamily: fonts.medium, fontSize: 12, letterSpacing: 0.3, borderRadius: radius.md, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4 }, age: { fontFamily: fonts.body, fontSize: 12 },
  outlets: { fontFamily: fonts.body, fontSize: 12, flexShrink: 1 }, headline: { fontFamily: fonts.display, letterSpacing: -0.3 }, summary: { flex: 1, minHeight: 0, overflow: 'hidden' }, words: { fontFamily: fonts.body, fontSize: 11 }, footer: { borderTopWidth: 1, paddingTop: 12, gap: 0 }, sourceLabel: { fontFamily: fonts.body, fontSize: 11 }, sources: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, source: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 48 }, stamp: { position: 'absolute', top: 24, fontFamily: fonts.display, fontSize: 26, borderWidth: 3, borderRadius: radius.lg, paddingVertical: 4, paddingHorizontal: 12, letterSpacing: 1 },
});

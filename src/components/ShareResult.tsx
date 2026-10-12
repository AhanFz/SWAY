import { useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';
import type { HistoryEntry } from '../domain/history';
import { percentages, total } from '../domain/results';
import { useSway } from '../state/SwayProvider';
import { fonts, light, radius } from '../theme';
import { isDemo } from '../services/api';
import { Button, Separator, Switch, Text as UIText } from './ui';
export function ShareResult({ entry, onClose }: { entry: HistoryEntry; onClose: () => void }) {
  const { theme } = useSway();
  const shot = useRef<React.ComponentRef<typeof ViewShot>>(null), { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [include, setInclude] = useState(false), [busy, setBusy] = useState(false);
  const t = entry.totals;
  const allowed = t && total(t) >= 100;
  const share = async () => {
    if (!allowed || busy) return;
    setBusy(true); let uri: string | undefined;
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
      uri = await shot.current?.capture?.();
      if (!uri) throw new Error('The image could not be prepared. Please try again.');
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share the crowd’s take' });
    } catch (e) { Alert.alert('Could not share', e instanceof Error ? e.message : 'Please try again.'); }
    finally { if (uri) { try { new File(uri).delete(); } catch { /* Temporary cache cleanup is best effort. */ } } setBusy(false); }
  };
  const p = t ? percentages(t) : { good: 0, skip: 0, bad: 0 };
  const cardWidth = Math.min(width - 48, 320);
  return <Modal animationType="slide" transparent visible onRequestClose={onClose}>
    <View style={s.backdrop}><ScrollView style={[s.sheet, { backgroundColor: theme.background, borderColor: theme.border, maxHeight: height - insets.top - 12 }]} contentContainerStyle={{ padding: 24, paddingBottom: Math.max(24, insets.bottom), gap: 12 }}>
      <View style={s.top}><UIText variant="h3">Share the room</UIText><Button variant="ghost" size="sm" onPress={onClose}>Done</Button></View>
      {allowed ? <><ViewShot ref={shot} options={{ format: 'png', quality: 1, width: 1080, height: 1350 }} style={{ alignSelf: 'center' }}>
        <View collapsable={false} style={[s.image, { width: cardWidth, height: cardWidth * 1.25 }]}>
          <Text allowFontScaling={false} style={s.logo}>Sway<Text style={{ color: light.primary }}>.</Text></Text>
          <Text allowFontScaling={false} style={s.headline} numberOfLines={6} adjustsFontSizeToFit minimumFontScale={0.65}>{entry.story.headline}</Text>
          <Text allowFontScaling={false} style={s.question}>Is this good news?</Text>
          <View style={s.bar}>{(['good', 'skip', 'bad'] as const).map(k => <View key={k} style={{ flex: t[k], backgroundColor: light[k] }} />)}</View>
          <View style={s.percent}>{(['good', 'skip', 'bad'] as const).map(k => <View key={k}><Text allowFontScaling={false} style={[s.number, { color: k === 'good' ? light.goodText : k === 'bad' ? light.badText : light.mutedForeground }]}>{p[k]}%</Text><Text allowFontScaling={false} style={s.label}>{k === 'skip' ? 'Skipped' : k === 'good' ? 'Good' : 'Bad'}</Text></View>)}</View>
          <Text allowFontScaling={false} style={s.label}>{total(t).toLocaleString()} responses{isDemo ? ' · sample result' : ''}</Text>
          {include && <Text allowFontScaling={false} style={s.vote}>My response: {entry.value === 'skip' ? 'Skipped' : entry.value === 'good' ? 'Good news' : 'Bad news'}</Text>}
          <Text allowFontScaling={false} style={s.date}>{new Date(entry.respondedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
        </View>
      </ViewShot><Separator /><View style={s.toggle}><View style={{ flex: 1, gap: 2 }}><UIText variant="small">Include my vote</UIText><UIText variant="caption">Your guesses and personal patterns are never included.</UIText></View><Switch accessibilityLabel="Include my vote" value={include} onValueChange={setInclude} /></View><Button disabled={busy} onPress={() => void share()}>{busy ? 'Preparing image…' : 'Share image'}</Button></> : <UIText variant="muted" style={{ paddingVertical: 24 }}>Not enough votes to share yet</UIText>}
    </ScrollView></View>
  </Modal>;
}
const s = StyleSheet.create({ backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' }, sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, borderBottomWidth: 0, flexGrow: 0 }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, image: { backgroundColor: light.background, borderWidth: 1, borderColor: light.border, padding: 22, gap: 10 }, logo: { fontFamily: fonts.display, color: light.foreground, fontSize: 28, letterSpacing: -0.8 }, headline: { fontFamily: fonts.display, color: light.foreground, fontSize: 21, lineHeight: 26, flex: 1 }, question: { fontFamily: fonts.bold, color: light.foreground, fontSize: 16 }, bar: { height: 12, flexDirection: 'row', borderRadius: 3, overflow: 'hidden' }, percent: { flexDirection: 'row', justifyContent: 'space-between' }, number: { fontFamily: fonts.display, fontSize: 23 }, label: { fontFamily: fonts.body, fontSize: 11, color: light.mutedForeground }, date: { fontFamily: fonts.body, fontSize: 10, color: light.mutedForeground, marginTop: 3 }, vote: { fontFamily: fonts.bold, fontSize: 12, color: light.foreground }, toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 48 } });

import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useSway } from '../../state/SwayProvider';
import { Header, ErrorNotice } from '../../components/Chrome';
import { Card, CardDescription, CardHeader, CardTitle, Separator, Switch, Tabs, Text } from '../../components/ui';
import { roomScore } from '../../domain/history';
import { fonts } from '../../theme';
import { isDemo } from '../../services/api';

const appearances = [{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }] as const;
export default function YouScreen() {
  const { theme, preferences, setPreferences, history } = useSway();
  const score = roomScore(history);
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}><ScrollView contentContainerStyle={s.page}>
    <Header title="Just you" detail="No account needed" /><ErrorNotice />
    <Text variant="h2">A better sense of where you stand.</Text>
    <Card>
      <View style={s.row}>
        <CardHeader style={s.grow}><CardTitle>Read the room</CardTitle><CardDescription>{score.count ? `${score.correct} correct out of your last ${score.count} scored guesses. We keep the most recent 50.` : 'Turn on Guess the crowd to start scoring. Your score appears once a result has enough responses.'}</CardDescription></CardHeader>
        <Text style={s.value}>{score.percent === null ? '—' : `${score.percent}%`}</Text>
      </View>
    </Card>
    <Card>
      <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
      <View style={s.row}>
        <View style={s.grow}><Text variant="small">Guess the crowd</Text><Text variant="muted">One quick guess before each result. Off by default, so results appear straight away.</Text></View>
        <Switch accessibilityLabel="Ask me to guess the crowd" value={preferences.guessing} onValueChange={value => void setPreferences({ guessing: value })} />
      </View>
      <Separator />
      <View style={s.stack}>
        <Text variant="small">Appearance</Text>
        <Tabs accessibilityLabel="Appearance" value={preferences.appearance} options={appearances} onValueChange={mode => void setPreferences({ appearance: mode })} />
      </View>
    </Card>
    <Card>
      <CardHeader><Feather name="lock" size={20} color={theme.foreground} /><CardTitle>Your patterns stay here.</CardTitle></CardHeader>
      <Text variant="muted">Your guesses, score, and personal insights are stored on this device. Sharing a result never includes them.</Text>
      <Text variant="muted">{isDemo ? 'This is a sample feed. Responses stay on your phone and crowd counts are simulated.' : 'Your news responses are sent with a hashed device identifier to prevent duplicate votes. There is no name, email, or public profile.'}</Text>
    </Card>
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingBottom: 32, gap: 16, width: '100%', maxWidth: 480, alignSelf: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  grow: { flex: 1, gap: 4 }, stack: { gap: 10 },
  value: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
});

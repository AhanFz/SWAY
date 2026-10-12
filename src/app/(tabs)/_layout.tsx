import { Tabs } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useSway } from '../../state/SwayProvider';
import { fonts } from '../../theme';
export default function TabLayout() {
  const { theme } = useSway();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.foreground, tabBarInactiveTintColor: theme.mutedForeground, tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border }, tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11, letterSpacing: 0.3 } }}>
    <Tabs.Screen name="index" options={{ title: 'Read', tabBarIcon: ({ color, size }) => <Feather name="layers" size={size} color={color} /> }} />
    <Tabs.Screen name="recap" options={{ title: 'Recap', tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" size={size} color={color} /> }} />
    <Tabs.Screen name="you" options={{ title: 'You', tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }} />
  </Tabs>;
}

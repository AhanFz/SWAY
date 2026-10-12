import { Stack } from 'expo-router';
import { SwayProvider } from '../state/SwayProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { OpenSans_400Regular } from '@expo-google-fonts/open-sans/400Regular';
import { OpenSans_600SemiBold } from '@expo-google-fonts/open-sans/600SemiBold';
import { OpenSans_700Bold } from '@expo-google-fonts/open-sans/700Bold';
import { OpenSans_800ExtraBold } from '@expo-google-fonts/open-sans/800ExtraBold';
import { ActivityIndicator, Text, View } from 'react-native';
export default function Layout() {
  const [loaded, error] = useFonts({ OpenSansRegular: OpenSans_400Regular, OpenSansSemiBold: OpenSans_600SemiBold, OpenSansBold: OpenSans_700Bold, OpenSansExtraBold: OpenSans_800ExtraBold });
  if (!loaded && !error) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}><ActivityIndicator accessibilityLabel="Loading Sway" color="#58D3DB" /></View>;
  if (error) return <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}><Text>Could not load Sway’s fonts. Close and reopen the app to try again.</Text></View>;
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><SwayProvider><Stack screenOptions={{ headerShown: false }} /></SwayProvider></SafeAreaProvider></GestureHandlerRootView>;
}

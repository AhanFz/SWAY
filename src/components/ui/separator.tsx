import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSway } from '../../state/SwayProvider';
export function Separator({ style }: { style?: StyleProp<ViewStyle> }) {
  const { theme } = useSway();
  return <View accessibilityElementsHidden importantForAccessibility="no" style={[{ height: 1, alignSelf: 'stretch', backgroundColor: theme.border }, style]} />;
}

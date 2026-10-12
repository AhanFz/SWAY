import { Switch as RNSwitch } from 'react-native';
import { useSway } from '../../state/SwayProvider';
export function Switch({ value, onValueChange, accessibilityLabel, disabled }: { value: boolean; onValueChange: (value: boolean) => void; accessibilityLabel: string; disabled?: boolean }) {
  const { theme, darkMode } = useSway();
  const off = darkMode ? theme.border : '#CBD5DC';
  return <RNSwitch accessibilityLabel={accessibilityLabel} disabled={disabled} value={value} onValueChange={onValueChange} trackColor={{ false: off, true: theme.primary }} ios_backgroundColor={off} thumbColor="#FFFFFF" />;
}

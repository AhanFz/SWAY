import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
let identity: Promise<string> | null = null;
export function deviceHash() {
  if (!identity) identity = (async () => {
    let id = await SecureStore.getItemAsync('sway-device-v1');
    if (!id) {
      id = `${Crypto.randomUUID()}:${Crypto.randomUUID()}`;
      await SecureStore.setItemAsync('sway-device-v1', id, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    }
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `sway:device:v1:${id}`);
  })().catch(e => { identity = null; throw e; });
  return identity;
}

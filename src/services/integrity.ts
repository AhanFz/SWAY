import * as AppIntegrity from '@expo/app-integrity';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { callApi } from './api';
export async function createProof(payload: string, hash: string) {
  if (Platform.OS === 'ios') {
    if (!AppIntegrity.isSupported) throw new Error('Live voting needs Sway’s signed iPhone app on a supported device. You can keep using the sample feed.');
    let keyId = await SecureStore.getItemAsync('sway-attest-key');
    if (!keyId) {
      keyId = await AppIntegrity.generateKeyAsync();
      await SecureStore.setItemAsync('sway-attest-key', keyId);
    }
    const registered = await SecureStore.getItemAsync('sway-attest-registered');
    if (registered !== keyId) {
      const { challenge } = await callApi<{ challenge: string }>('challenge', { deviceHash: hash });
      const attestation = await AppIntegrity.attestKeyAsync(keyId, challenge);
      await callApi('register', { keyId, attestation, challenge, deviceHash: hash });
      await SecureStore.setItemAsync('sway-attest-registered', keyId);
    }
    return { platform: 'ios', keyId, assertion: await AppIntegrity.generateAssertionAsync(keyId, payload) };
  }
  if (Platform.OS === 'android') {
    const project = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER;
    if (!project) throw new Error('Live Android voting is not configured yet.');
    await AppIntegrity.prepareIntegrityTokenProviderAsync(project);
    const requestHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payload);
    return { platform: 'android', token: await AppIntegrity.requestIntegrityCheckAsync(requestHash) };
  }
  throw new Error('Live voting requires the native Sway app.');
}

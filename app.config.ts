import type { ConfigContext, ExpoConfig } from 'expo/config';
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Sway', slug: 'sway',
  ios: {
    ...config.ios,
    ...(process.env.SWAY_IOS_BUNDLE_ID ? { bundleIdentifier: process.env.SWAY_IOS_BUNDLE_ID } : {}),
    entitlements: {
      ...config.ios?.entitlements,
      'com.apple.developer.devicecheck.appattest-environment': process.env.SWAY_ATTEST_ENV === 'development' ? 'development' : 'production',
    },
  },
  android: {
    ...config.android,
    ...(process.env.SWAY_ANDROID_PACKAGE ? { package: process.env.SWAY_ANDROID_PACKAGE } : {}),
  },
});

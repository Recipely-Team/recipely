import { Linking, Platform } from 'react-native';
import { StoreLinks } from '@infrastructure/constants/store-links';

/** Opens the store listing the version check named, or this platform's own listing. */
export const openStore = (storeUrl: string | null): void => {
  const url = storeUrl ?? (Platform.OS === 'ios' ? StoreLinks.ios : StoreLinks.android);
  void Linking.openURL(url).catch(() => undefined);
};

import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { InstagramConnection } from '@domain/instagram/connect/instagram-connection';
import { useStores } from '@presentation/bootstrap/use-stores';

/** Stable "nothing known yet", so the selector does not hand back a new object each render. */
const UNKNOWN = InstagramConnection.none();

/**
 * The viewer's Instagram link, re-read whenever the screen comes into focus
 * — so an expiry or a link made on another device shows up. Until the first
 * answer it reads as unavailable, which hides every Instagram surface rather
 * than flashing one that may not exist.
 */
export const useInstagramConnection = (): InstagramConnection => {
  const { instagramStore } = useStores();
  const connection = instagramStore((s) => (s.connection.status === StoreStatus.Loaded ? s.connection.connection : UNKNOWN));
  useFocusEffect(
    useCallback(() => {
      void instagramStore.getState().load();
    }, [instagramStore]),
  );
  return connection;
};

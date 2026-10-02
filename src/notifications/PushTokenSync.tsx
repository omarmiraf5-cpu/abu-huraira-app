import { useEffect } from 'react';
import { registerForPushNotificationsOnce } from './pushToken';

/** Invisible: registers this device for remote push once on launch. */
export function PushTokenSync() {
  useEffect(() => {
    void registerForPushNotificationsOnce();
  }, []);
  return null;
}

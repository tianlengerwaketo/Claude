import { useEffect } from 'react';
import { OFFLINE_REMOVE_AFTER_MS, PRESENCE_RECHECK_INTERVAL_MS } from '../constants/presence';
import { getPresence } from '../services/presenceService';
import { useAppStore } from '../store/useAppStore';

/**
 * Independently of whether we're actively "buscando gente" right now, keeps
 * the persistent detected-people list in sync with whether each person is
 * still reachable: once someone's "quiero ser detectado" has been off for
 * OFFLINE_REMOVE_AFTER_MS, they're removed automatically. Runs on a timer
 * rather than live subscriptions so it stays cheap regardless of how many
 * people end up in the list.
 *
 * This only runs while the app is open in the foreground - there's no
 * background task here, so a person who's been off for over an hour while
 * the app was closed gets pruned the next time it's opened instead of
 * exactly on the hour mark.
 */
export function useDetectedPeoplePruning() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const setRemoteOfflineSince = useAppStore((state) => state.setRemoteOfflineSince);
  const removeDetectedPerson = useAppStore((state) => state.removeDetectedPerson);

  useEffect(() => {
    if (!hasHydrated) return;

    const recheck = async () => {
      const { detectedPeople } = useAppStore.getState();
      const now = Date.now();

      await Promise.all(
        Object.values(detectedPeople).map(async (person) => {
          const presence = await getPresence(person.token).catch(() => null);

          if (presence?.isDetectable) {
            if (person.remoteOfflineSince !== null) setRemoteOfflineSince(person.token, null);
            return;
          }

          // Prefer the real moment Firestore says they went offline; fall
          // back to "whenever we first noticed" if presence is missing
          // entirely (e.g. Firebase not configured yet).
          const offlineSince = presence?.updatedAt ?? person.remoteOfflineSince ?? now;

          if (now - offlineSince >= OFFLINE_REMOVE_AFTER_MS) {
            removeDetectedPerson(person.token);
          } else if (person.remoteOfflineSince !== offlineSince) {
            setRemoteOfflineSince(person.token, offlineSince);
          }
        })
      );
    };

    recheck();
    const interval = setInterval(recheck, PRESENCE_RECHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hasHydrated, setRemoteOfflineSince, removeDetectedPerson]);
}

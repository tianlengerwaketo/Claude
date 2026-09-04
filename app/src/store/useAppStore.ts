import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { NearbyPerson, UserProfile } from '../types';
import { EMOJI_PALETTE } from '../utils/profileEncoding';

interface AppState {
  profile: UserProfile;
  isDetectable: boolean;
  isBluetoothOn: boolean;
  hasHydrated: boolean;
  nearbyPeople: Record<string, NearbyPerson>;

  setProfile: (profile: UserProfile) => void;
  setDetectable: (value: boolean) => void;
  setBluetoothOn: (value: boolean) => void;
  upsertNearbyPerson: (person: NearbyPerson) => void;
  pruneStalePeople: (olderThanMs: number) => void;
  clearNearbyPeople: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: { name: '', emoji: EMOJI_PALETTE[0] },
      isDetectable: false,
      isBluetoothOn: false,
      hasHydrated: false,
      nearbyPeople: {},

      setProfile: (profile) => set({ profile }),
      setDetectable: (value) => set({ isDetectable: value }),
      setBluetoothOn: (value) => set({ isBluetoothOn: value }),

      upsertNearbyPerson: (person) =>
        set((state) => ({
          nearbyPeople: { ...state.nearbyPeople, [person.id]: person },
        })),

      pruneStalePeople: (olderThanMs) =>
        set((state) => {
          const now = Date.now();
          const next: Record<string, NearbyPerson> = {};
          for (const [id, person] of Object.entries(state.nearbyPeople)) {
            if (now - person.lastSeenAt <= olderThanMs) next[id] = person;
          }
          return { nearbyPeople: next };
        }),

      clearNearbyPeople: () => set({ nearbyPeople: {} }),
    }),
    {
      name: 'person-detection-profile',
      storage: createJSONStorage(() => AsyncStorage),
      // Only the profile is worth remembering across launches - detection
      // state and the nearby list should always start fresh.
      partialize: (state) => ({ profile: state.profile }),
      onRehydrateStorage: () => () => useAppStore.setState({ hasHydrated: true }),
    }
  )
);

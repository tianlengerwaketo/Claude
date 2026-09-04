import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { EMOJI_PALETTE } from '../constants/emoji';
import type { DetectedPerson, UserProfile } from '../types';
import { generateDeviceToken } from '../utils/token';

type DetectedPersonUpdate = Omit<DetectedPerson, 'firstDetectedAt'>;

interface AppState {
  /** This install's own BLE broadcast token / Firestore presence+chat id. Generated once, persisted forever. */
  deviceToken: string;
  profile: UserProfile;
  isDetectable: boolean;
  isSearching: boolean;
  isBluetoothOn: boolean;
  hasHydrated: boolean;
  /** Everyone ever detected - a persistent log, not a live-only radar. */
  detectedPeople: Record<string, DetectedPerson>;

  setProfile: (profile: UserProfile) => void;
  setDetectable: (value: boolean) => void;
  setSearching: (value: boolean) => void;
  setBluetoothOn: (value: boolean) => void;
  upsertDetectedPerson: (person: DetectedPersonUpdate) => void;
  removeDetectedPerson: (token: string) => void;
  clearDetectedPeople: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      deviceToken: generateDeviceToken(),
      profile: { name: '', emoji: EMOJI_PALETTE[0], phone: '' },
      isDetectable: false,
      isSearching: false,
      isBluetoothOn: false,
      hasHydrated: false,
      detectedPeople: {},

      setProfile: (profile) => set({ profile }),
      setDetectable: (value) => set({ isDetectable: value }),
      setSearching: (value) => set({ isSearching: value }),
      setBluetoothOn: (value) => set({ isBluetoothOn: value }),

      upsertDetectedPerson: (person) =>
        set((state) => {
          const existing = state.detectedPeople[person.token];
          return {
            detectedPeople: {
              ...state.detectedPeople,
              [person.token]: { ...person, firstDetectedAt: existing?.firstDetectedAt ?? person.detectedAt },
            },
          };
        }),

      removeDetectedPerson: (token) =>
        set((state) => {
          const next = { ...state.detectedPeople };
          delete next[token];
          return { detectedPeople: next };
        }),

      clearDetectedPeople: () => set({ detectedPeople: {} }),
    }),
    {
      name: 'person-detection-profile',
      storage: createJSONStorage(() => AsyncStorage),
      // The device token, profile and detection history are worth
      // remembering across launches; live toggle/search state should
      // always start fresh.
      partialize: (state) => ({
        deviceToken: state.deviceToken,
        profile: state.profile,
        detectedPeople: state.detectedPeople,
      }),
      onRehydrateStorage: () => () => useAppStore.setState({ hasHydrated: true }),
    }
  )
);

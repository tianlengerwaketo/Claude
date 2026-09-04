import { useEffect, useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DetectableToggle } from '../components/DetectableToggle';
import { DetectedPersonCard } from '../components/DetectedPersonCard';
import { SearchButton } from '../components/SearchButton';
import { useDetectedPeoplePruning } from '../hooks/useDetectedPeoplePruning';
import { useProximityDetection } from '../hooks/useProximityDetection';
import { useAppStore } from '../store/useAppStore';
import type { DetectedPerson } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  useProximityDetection();
  useDetectedPeoplePruning();

  const isDetectable = useAppStore((state) => state.isDetectable);
  const isSearching = useAppStore((state) => state.isSearching);
  const isBluetoothOn = useAppStore((state) => state.isBluetoothOn);
  const setDetectable = useAppStore((state) => state.setDetectable);
  const setSearching = useAppStore((state) => state.setSearching);
  const profile = useAppStore((state) => state.profile);
  const detectedPeople = useAppStore((state) => state.detectedPeople);
  const removeDetectedPerson = useAppStore((state) => state.removeDetectedPerson);
  const clearDetectedPeople = useAppStore((state) => state.clearDetectedPeople);
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated && !profile.name) navigation.navigate('Profile');
  }, [hasHydrated, profile.name, navigation]);

  const people = useMemo(
    () => Object.values(detectedPeople).sort((a, b) => b.detectedAt - a.detectedAt),
    [detectedPeople]
  );

  const confirmClearAll = () => {
    Alert.alert('Vaciar lista', 'Se van a borrar todas las personas detectadas. Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Vaciar', style: 'destructive', onPress: clearDetectedPeople },
    ]);
  };

  const openChat = (person: DetectedPerson) => {
    navigation.navigate('Chat', { token: person.token, name: person.name, emoji: person.emoji });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Gente cerca</Text>
        <Text style={styles.subtitle}>
          {profile.emoji} {profile.name || 'Sin nombre'}
        </Text>
      </View>

      <DetectableToggle value={isDetectable} onValueChange={setDetectable} bluetoothOn={isBluetoothOn} />

      <SearchButton isSearching={isSearching} bluetoothOn={isBluetoothOn} onPress={() => setSearching(!isSearching)} />

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Detectados{people.length > 0 ? ` (${people.length})` : ''}</Text>
        {people.length > 0 && (
          <Pressable onPress={confirmClearAll}>
            <Text style={styles.clearAll}>Vaciar lista</Text>
          </Pressable>
        )}
      </View>

      {people.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {isSearching ? 'Buscando gente cerca...' : 'Todavía no detectaste a nadie.'}
          </Text>
          <Text style={styles.emptyHint}>
            Solo aparecen personas con esta app abierta y "Quiero ser detectado" activado, a pocos metros de
            distancia. Quedan en esta lista hasta que la vacíes.
          </Text>
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item.token}
          renderItem={({ item }) => <DetectedPersonCard person={item} onDelete={removeDetectedPerson} onOpenChat={openChat} />}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    gap: 16,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  clearAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

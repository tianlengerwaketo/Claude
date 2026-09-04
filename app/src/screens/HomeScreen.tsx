import { useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DetectableToggle } from '../components/DetectableToggle';
import { NearbyPersonCard } from '../components/NearbyPersonCard';
import { useProximityDetection } from '../hooks/useProximityDetection';
import { useAppStore } from '../store/useAppStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  useProximityDetection();

  const isDetectable = useAppStore((state) => state.isDetectable);
  const isBluetoothOn = useAppStore((state) => state.isBluetoothOn);
  const setDetectable = useAppStore((state) => state.setDetectable);
  const profile = useAppStore((state) => state.profile);
  const nearbyPeople = useAppStore((state) => state.nearbyPeople);
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated && !profile.name) navigation.navigate('Profile');
  }, [hasHydrated, profile.name, navigation]);

  const people = useMemo(
    () => Object.values(nearbyPeople).sort((a, b) => a.distanceMeters - b.distanceMeters),
    [nearbyPeople]
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Gente cerca</Text>
        <Text style={styles.subtitle}>
          {profile.emoji} {profile.name || 'Sin nombre'}
        </Text>
      </View>

      <DetectableToggle value={isDetectable} onValueChange={setDetectable} bluetoothOn={isBluetoothOn} />

      {!isDetectable ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Activa "Quiero ser detectado" para ver a otras personas cercanas que también lo activaron.
          </Text>
        </View>
      ) : people.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Buscando gente cerca...</Text>
          <Text style={styles.emptyHint}>
            Solo aparecen personas con esta app abierta y "Quiero ser detectado" activado, a pocos metros de
            distancia.
          </Text>
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NearbyPersonCard person={item} />}
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

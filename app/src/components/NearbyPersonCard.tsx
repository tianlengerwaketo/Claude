import { StyleSheet, Text, View } from 'react-native';
import type { NearbyPerson } from '../types';
import { PROXIMITY_LABEL } from '../utils/distance';

const PROXIMITY_COLOR: Record<NearbyPerson['proximity'], string> = {
  'muy-cerca': '#16a34a',
  cerca: '#2563eb',
  lejos: '#ca8a04',
  'fuera-de-rango': '#9ca3af',
};

export function NearbyPersonCard({ person }: { person: NearbyPerson }) {
  const color = PROXIMITY_COLOR[person.proximity];

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{person.emoji}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{person.name}</Text>
        <Text style={[styles.proximity, { color }]}>
          {PROXIMITY_LABEL[person.proximity]}
          {person.distanceMeters >= 0 ? ` · ~${person.distanceMeters}m` : ''}
        </Text>
      </View>
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  proximity: {
    fontSize: 13,
    fontWeight: '500',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

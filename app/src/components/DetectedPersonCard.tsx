import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DetectedPerson } from '../types';
import { PROXIMITY_LABEL } from '../utils/distance';
import { formatDetectedAt } from '../utils/time';
import { openWhatsAppChat } from '../utils/whatsapp';

const PROXIMITY_COLOR: Record<DetectedPerson['proximity'], string> = {
  'muy-cerca': '#16a34a',
  cerca: '#2563eb',
  lejos: '#ca8a04',
  'fuera-de-rango': '#9ca3af',
};

interface Props {
  person: DetectedPerson;
  onDelete: (id: string) => void;
}

export function DetectedPersonCard({ person, onDelete }: Props) {
  const color = PROXIMITY_COLOR[person.proximity];

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.emoji}>{person.emoji}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{person.name}</Text>
          <Text style={[styles.proximity, { color }]}>
            {PROXIMITY_LABEL[person.proximity]}
            {person.distanceMeters >= 0 ? ` · ~${person.distanceMeters}m` : ''}
          </Text>
          <Text style={styles.timestamp}>Detectado: {formatDetectedAt(person.detectedAt)}</Text>
        </View>
        <Pressable onPress={() => onDelete(person.id)} hitSlop={10} style={styles.deleteButton}>
          <Text style={styles.deleteText}>✕</Text>
        </Pressable>
      </View>

      <Pressable style={styles.whatsappButton} onPress={() => openWhatsAppChat(person.phone)}>
        <Text style={styles.whatsappText}>💬 Abrir WhatsApp</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '700',
  },
  whatsappButton: {
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  whatsappText: {
    color: '#15803d',
    fontSize: 14,
    fontWeight: '700',
  },
});

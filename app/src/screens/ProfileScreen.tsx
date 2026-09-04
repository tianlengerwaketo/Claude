import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { EMOJI_PALETTE } from '../utils/profileEncoding';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const MAX_NAME_LENGTH = 16;

export function ProfileScreen({ navigation }: Props) {
  const profile = useAppStore((state) => state.profile);
  const setProfile = useAppStore((state) => state.setProfile);

  const [name, setName] = useState(profile.name);
  const [emoji, setEmoji] = useState(profile.emoji);

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    setProfile({ name: name.trim().slice(0, MAX_NAME_LENGTH), emoji });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tu perfil</Text>
        <Text style={styles.subtitle}>Esto es lo que verán otras personas cuando te detecten cerca.</Text>

        <Text style={styles.label}>Nombre o apodo</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Ej. Tian"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Elige un emoji</Text>
        <View style={styles.emojiGrid}>
          {EMOJI_PALETTE.map((candidate) => (
            <Pressable
              key={candidate}
              onPress={() => setEmoji(candidate)}
              style={[styles.emojiOption, candidate === emoji && styles.emojiOptionSelected]}
            >
              <Text style={styles.emojiText}>{candidate}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={[styles.saveButton, !canSave && styles.saveButtonDisabled]} onPress={handleSave} disabled={!canSave}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiOption: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionSelected: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  emojiText: {
    fontSize: 26,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

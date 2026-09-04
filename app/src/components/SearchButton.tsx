import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  isSearching: boolean;
  bluetoothOn: boolean;
  onPress: () => void;
}

export function SearchButton({ isSearching, bluetoothOn, onPress }: Props) {
  return (
    <Pressable
      style={[styles.button, isSearching && styles.buttonActive, !bluetoothOn && styles.buttonDisabled]}
      onPress={onPress}
      disabled={!bluetoothOn}
    >
      {isSearching && <ActivityIndicator color="#ffffff" style={styles.spinner} />}
      <Text style={styles.text}>{isSearching ? 'Dejar de buscar' : 'Buscar gente'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
  },
  buttonActive: {
    backgroundColor: '#dc2626',
  },
  buttonDisabled: {
    backgroundColor: '#c7d2fe',
  },
  spinner: {
    marginRight: 2,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

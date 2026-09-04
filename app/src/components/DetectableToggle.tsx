import { StyleSheet, Switch, Text, View } from 'react-native';

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
  bluetoothOn: boolean;
}

export function DetectableToggle({ value, onValueChange, bluetoothOn }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>Quiero ser detectado</Text>
        <Text style={styles.subtitle}>
          {bluetoothOn
            ? 'Otras personas con la app cerca podrán encontrarte al buscar.'
            : 'Activa el Bluetooth del teléfono para usar esta función.'}
        </Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} disabled={!bluetoothOn} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
});

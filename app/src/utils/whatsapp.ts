import { Alert, Linking } from 'react-native';

/** Opens a WhatsApp chat with the given phone (digits only, international format). */
export async function openWhatsAppChat(phone: string): Promise<void> {
  if (!phone) {
    Alert.alert('Sin número', 'Esta persona no compartió un número de WhatsApp.');
    return;
  }

  const url = `https://wa.me/${phone}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('No se pudo abrir WhatsApp', 'Verificá que WhatsApp esté instalado en este teléfono.');
  }
}

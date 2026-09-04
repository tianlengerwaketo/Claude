import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { conversationIdFor, RecipientNotDetectableError, sendMessage, subscribeMessages } from '../services/chatService';
import { subscribePresence } from '../services/presenceService';
import { useAppStore } from '../store/useAppStore';
import type { ChatMessage, Presence } from '../types';
import { formatDetectedAt } from '../utils/time';
import { openWhatsAppChat } from '../utils/whatsapp';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ route }: Props) {
  const { token: recipientToken, name, emoji } = route.params;
  const deviceToken = useAppStore((state) => state.deviceToken);
  const profile = useAppStore((state) => state.profile);

  const conversationId = useMemo(() => conversationIdFor(deviceToken, recipientToken), [deviceToken, recipientToken]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recipientPresence, setRecipientPresence] = useState<Presence | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => subscribeMessages(conversationId, setMessages), [conversationId]);
  useEffect(() => subscribePresence(recipientToken, setRecipientPresence), [recipientToken]);

  const canWrite = recipientPresence?.isDetectable ?? true; // optimistic until the first snapshot arrives

  const handleSend = async (text: string, type: 'text' | 'phone_share' = 'text') => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(conversationId, [deviceToken, recipientToken], deviceToken, text.trim(), type);
      setDraft('');
    } catch (error) {
      if (error instanceof RecipientNotDetectableError) {
        Alert.alert('No disponible', error.message);
      } else {
        Alert.alert('No se pudo enviar', 'Revisá tu conexión e intentá de nuevo.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleSharePhone = () => {
    if (!profile.phone) {
      Alert.alert('Sin número cargado', 'Agregá tu WhatsApp en "Tu perfil" para poder compartirlo.');
      return;
    }
    handleSend(profile.phone, 'phone_share');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {!canWrite && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {emoji} {name} ya no tiene "Quiero ser detectado" activado - no le podés escribir hasta que lo vuelva a
            activar.
          </Text>
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => {
          const isMine = item.senderToken === deviceToken;
          if (item.type === 'phone_share') {
            return (
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={styles.phoneShareLabel}>{isMine ? 'Compartiste tu WhatsApp' : 'Compartió su WhatsApp'}</Text>
                <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.text}</Text>
                {!isMine && (
                  <Pressable style={styles.whatsappButton} onPress={() => openWhatsAppChat(item.text)}>
                    <Text style={styles.whatsappButtonText}>💬 Abrir WhatsApp</Text>
                  </Pressable>
                )}
                <Text style={[styles.timestamp, isMine && styles.timestampMine]}>{formatDetectedAt(item.createdAt)}</Text>
              </View>
            );
          }
          return (
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.text}</Text>
              <Text style={[styles.timestamp, isMine && styles.timestampMine]}>{formatDetectedAt(item.createdAt)}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Todavía no hay mensajes. Escribí algo para empezar la conversación.</Text>
        }
      />

      <Pressable style={styles.sharePhoneButton} onPress={handleSharePhone}>
        <Text style={styles.sharePhoneText}>📞 Compartir mi WhatsApp</Text>
      </Pressable>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribí un mensaje..."
          placeholderTextColor="#9ca3af"
          multiline
        />
        <Pressable
          style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
          onPress={() => handleSend(draft)}
          disabled={!draft.trim() || sending}
        >
          <Text style={styles.sendButtonText}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  banner: {
    backgroundColor: '#fef3c7',
    padding: 12,
  },
  bannerText: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
  },
  messages: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 40,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
  },
  bubbleText: {
    fontSize: 15,
    color: '#111827',
  },
  bubbleTextMine: {
    color: '#ffffff',
  },
  phoneShareLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
    alignSelf: 'flex-end',
  },
  timestampMine: {
    color: '#bfdbfe',
  },
  whatsappButton: {
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  whatsappButtonText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '700',
  },
  sharePhoneButton: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
  },
  sharePhoneText: {
    color: '#4338ca',
    fontWeight: '700',
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    paddingTop: 0,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

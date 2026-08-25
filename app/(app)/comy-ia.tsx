import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AIMessageBubble } from '@/components/AIMessageBubble';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useLatestConversation, useSendMessage } from '@/features/comyIa/hooks';

const SUGGESTED_QUESTIONS = [
  "Combien ai-je vendu aujourd'hui ?",
  'Quel produit se vend le mieux ?',
  "Qui me doit de l'argent ?",
  'Fais-moi un résumé de la boutique.',
  'Quel produit risque d\'être en rupture ?',
];

export default function ComyIAScreen() {
  const { data } = useLatestConversation();
  const sendMessage = useSendMessage();
  const [input, setInput] = useState('');
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const conversationId = data?.conversationId ?? null;
  const messages = data?.messages ?? [];

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending) return;
    setError(null);
    setInput('');
    setPendingUserMessage(trimmed);
    try {
      await sendMessage.mutateAsync({ conversationId, message: trimmed });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setPendingUserMessage(null);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenContainer edges={['top', 'bottom']}>
        <Text style={styles.title}>Comy IA</Text>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && !pendingUserMessage ? (
            <View style={styles.suggestions}>
              <Text style={styles.suggestionsTitle}>Posez-moi une question sur votre boutique :</Text>
              {SUGGESTED_QUESTIONS.map((question) => (
                <Pressable key={question} style={styles.suggestionChip} onPress={() => submit(question)}>
                  <Text style={styles.suggestionLabel}>{question}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {messages.map((message) => (
            <AIMessageBubble key={message.id} role={message.role} content={message.content} />
          ))}

          {pendingUserMessage ? <AIMessageBubble role="user" content={pendingUserMessage} /> : null}

          {sendMessage.isPending ? (
            <View style={styles.typingRow}>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={colors.textSecondary} />
              </View>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Écrivez à Comy IA..."
            placeholderTextColor={colors.textTertiary}
            multiline
            onSubmitEditing={() => submit(input)}
          />
          <Pressable
            style={[styles.sendButton, (!input.trim() || sendMessage.isPending) && styles.sendButtonDisabled]}
            onPress={() => submit(input)}
            disabled={!input.trim() || sendMessage.isPending}
          >
            <Ionicons name="arrow-up" size={18} color={colors.textOnWhite} />
          </Pressable>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h2.fontSize,
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  suggestions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  suggestionsTitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  suggestionChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  suggestionLabel: {
    color: colors.textPrimary,
    fontFamily: typography.fontBody,
    fontSize: 13,
  },
  typingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
  },
  typingBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontFamily: typography.fontBody,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

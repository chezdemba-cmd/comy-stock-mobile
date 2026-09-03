import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { deleteAccount } from '@/features/auth/deleteAccount';

const CONFIRMATION = 'SUPPRIMER';

export default function AccountScreen() {
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = () => {
    Alert.alert(
      'Supprimer définitivement le compte ?',
      "L'accès sera supprimé immédiatement. Les données commerciales d'une entreprise sans autre membre seront conservées deux ans, puis supprimées.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer mon compte',
          style: 'destructive',
          onPress: () => {
            setIsDeleting(true);
            setError(null);
            void deleteAccount()
              .then(() => router.replace('/(onboarding)/welcome'))
              .catch((reason: unknown) => {
                setError(reason instanceof Error ? reason.message : 'La suppression a échoué.');
                setIsDeleting(false);
              });
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Suppression du compte</Text>
          <Text style={styles.text}>
            Votre connexion, votre profil personnel et vos accès aux boutiques seront supprimés immédiatement.
          </Text>
          <Text style={styles.text}>
            Si d&apos;autres membres travaillent dans l&apos;entreprise, elle leur sera transférée. Sinon, ses données
            commerciales seront isolées pendant deux ans pour l&apos;historique comptable, puis supprimées.
          </Text>
          <Text style={styles.text}>
            Pour confirmer, écrivez {CONFIRMATION} ci-dessous.
          </Text>
        </View>

        <TextField
          label="Confirmation"
          placeholder={CONFIRMATION}
          autoCapitalize="characters"
          value={confirmation}
          onChangeText={setConfirmation}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Supprimer mon compte"
          variant="secondary"
          disabled={confirmation.trim().toUpperCase() !== CONFIRMATION}
          loading={isDeleting}
          onPress={onDelete}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: spacing.xl, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { color: colors.textPrimary, fontFamily: typography.fontHeading, fontSize: typography.h3.fontSize },
  text: { color: colors.textSecondary, fontFamily: typography.fontBody, fontSize: 14, lineHeight: 21 },
  error: { color: colors.danger, fontFamily: typography.fontBody, fontSize: 14, marginBottom: spacing.md },
});

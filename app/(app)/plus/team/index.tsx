import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ListRow } from '@/components/ListRow';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing, typography } from '@/constants/theme';
import { useActiveCompanyRole } from '@/features/company/hooks';
import { roleLabel } from '@/features/team/schemas';
import { useAuthStore } from '@/stores/authStore';
import {
  usePendingInvitations,
  useRemoveMember,
  useRevokeInvite,
  useTeamMembers,
} from '@/features/team/hooks';

export default function TeamScreen() {
  const role = useActiveCompanyRole();
  const canManage = role === 'owner' || role === 'manager' || role === 'accountant';
  const canConfigure = role === 'owner';
  const currentUserId = useAuthStore((state) => state.session?.user.id);

  const { data: members, isLoading, isError, refetch } = useTeamMembers();
  const { data: invitations = [] } = usePendingInvitations();
  const removeMember = useRemoveMember();
  const revokeInvite = useRevokeInvite();

  const confirmRemove = (userId: string, name: string) => {
    Alert.alert(
      'Retirer ce membre ?',
      `${name} perdra immédiatement l'accès à cette entreprise.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () =>
            removeMember.mutate(userId, {
              onError: (error) =>
                Alert.alert('Impossible de retirer ce membre', error instanceof Error ? error.message : ''),
            }),
        },
      ]
    );
  };

  const confirmRevoke = (invitationId: string) => {
    Alert.alert('Annuler cette invitation ?', 'Le code ne pourra plus être utilisé.', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Annuler l’invitation',
        style: 'destructive',
        onPress: () => revokeInvite.mutate(invitationId),
      },
    ]);
  };

  const shareCode = (code: string) => {
    Share.share({
      message: `Rejoignez notre entreprise sur Comy_stock ! Téléchargez l'application, créez un compte, puis entrez ce code d'invitation : ${code}`,
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingIndicator fullScreen />
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={() => refetch()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Équipe</Text>
          {canManage ? (
            <Button
              label="Inviter"
              variant="secondary"
              onPress={() => router.push('/(app)/plus/team/invite')}
              style={styles.inviteButton}
            />
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>Membres</Text>
        {(members ?? []).length === 0 ? (
          <EmptyState title="Aucun membre" />
        ) : (
          (members ?? []).map((member) => (
            <View key={member.userId}>
              <ListRow
                icon="person-outline"
                title={member.fullName || member.email || 'Utilisateur'}
                subtitle={`${roleLabel[member.role]} · ${member.shopIds.length} boutique${member.shopIds.length > 1 ? 's' : ''}`}
              />
              {canManage && member.userId !== currentUserId ? (
                <View style={styles.pendingActions}>
                  {canConfigure ? (
                    <Button
                      label="Gérer"
                      variant="ghost"
                      onPress={() => router.push(`/(app)/plus/team/${member.userId}`)}
                      style={styles.rowAction}
                    />
                  ) : null}
                  <Button
                    label="Retirer"
                    variant="ghost"
                    onPress={() => confirmRemove(member.userId, member.fullName || member.email || 'ce membre')}
                    style={styles.rowAction}
                  />
                </View>
              ) : null}
            </View>
          ))
        )}

        {canManage && invitations.length > 0 ? (
          <>
            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
              Invitations en attente
            </Text>
            {invitations.map((invitation) => (
              <View key={invitation.id}>
                <ListRow
                  icon="mail-outline"
                  iconTone="warning"
                  title={invitation.code}
                  subtitle={roleLabel[invitation.role]}
                />
                <View style={styles.pendingActions}>
                  <Button
                    label="Partager"
                    variant="ghost"
                    onPress={() => shareCode(invitation.code)}
                    style={styles.rowAction}
                  />
                  <Button
                    label="Annuler"
                    variant="ghost"
                    onPress={() => confirmRevoke(invitation.id)}
                    style={styles.rowAction}
                  />
                </View>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h2.fontSize,
  },
  inviteButton: {
    minWidth: 110,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  sectionLabelSpaced: {
    marginTop: spacing.xl,
  },
  rowAction: {
    alignSelf: 'flex-start',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
});

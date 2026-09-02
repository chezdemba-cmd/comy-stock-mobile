import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/features/notifications/hooks';

export default function NotificationsScreen() {
  const { data = [], isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unreadCount = data.filter((item) => !item.read_at).length;

  if (isLoading) return <ScreenContainer><LoadingIndicator fullScreen /></ScreenContainer>;
  if (isError) return <ScreenContainer><ErrorState onRetry={() => refetch()} /></ScreenContainer>;

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {unreadCount > 0 ? (
          <Button
            label={`Tout marquer comme lu (${unreadCount})`}
            variant="secondary"
            onPress={() => markAll.mutate()}
            loading={markAll.isPending}
            style={styles.markAll}
          />
        ) : null}

        {data.length === 0 ? (
          <EmptyState title="Aucune notification" description="Les mouvements de stock apparaîtront ici." />
        ) : data.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => { if (!item.read_at) markRead.mutate(item.id); }}
            style={[styles.card, !item.read_at && styles.cardUnread]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{item.title}</Text>
              {!item.read_at ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleString('fr-FR')}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.lg, paddingBottom: spacing.xxxl },
  markAll: { marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  cardUnread: { borderColor: colors.green, backgroundColor: colors.greenDeepest },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  title: { color: colors.textPrimary, fontFamily: typography.fontBodyMedium, fontSize: 15 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  message: { color: colors.textSecondary, fontFamily: typography.fontBody, fontSize: 14, lineHeight: 20 },
  date: { color: colors.textTertiary, fontFamily: typography.fontBody, fontSize: 11, marginTop: spacing.sm },
});

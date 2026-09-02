import { supabase } from '@/services/supabase';
import type { UserNotification } from '@/types/database';

export async function fetchNotifications(companyId: string): Promise<UserNotification[]> {
  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as UserNotification[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);
  if (error) throw error;
}

export async function markAllNotificationsRead(companyId: string): Promise<void> {
  const { error } = await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('company_id', companyId)
    .is('read_at', null);
  if (error) throw error;
}

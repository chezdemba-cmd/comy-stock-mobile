import { clearLocalSession } from '@/features/auth/signOut';
import { supabase } from '@/services/supabase';

export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) throw error;
  await clearLocalSession();
}

import { supabase } from '@/services/supabase';
import type { AppRole, Invitation, Profile } from '@/types/database';

export interface TeamMember {
  userId: string;
  role: AppRole;
  fullName: string | null;
  email: string | null;
}

export async function fetchTeamMembers(companyId: string): Promise<TeamMember[]> {
  const { data: members, error } = await supabase
    .from('company_members')
    .select('user_id, role')
    .eq('company_id', companyId);

  if (error) throw error;

  const userIds = (members ?? []).map((row) => row.user_id as string);

  // Requête séparée plutôt qu'un embed PostgREST : company_members et profiles référencent
  // tous les deux auth.users indépendamment, il n'y a pas de foreign key directe entre eux
  // pour que PostgREST résolve profiles(...) depuis company_members (même pattern que
  // fetchSaleReceipt pour le nom du vendeur).
  let profilesById = new Map<string, Profile>();
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);
    if (profilesError) throw profilesError;
    profilesById = new Map((profiles ?? []).map((profile) => [profile.id as string, profile as Profile]));
  }

  return (members ?? []).map((member) => {
    const profile = profilesById.get(member.user_id as string);
    return {
      userId: member.user_id as string,
      role: member.role as AppRole,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
    };
  });
}

export async function fetchPendingInvitations(companyId: string): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Invitation[];
}

export interface InviteMemberInput {
  companyId: string;
  shopId: string;
  role: AppRole;
}

export async function inviteMember(input: InviteMemberInput): Promise<Invitation> {
  const { data, error } = await supabase
    .rpc('invite_member', { p_company_id: input.companyId, p_shop_id: input.shopId, p_role: input.role })
    .single();

  if (error) throw error;
  return data as Invitation;
}

export async function revokeInvite(invitationId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_invite', { p_invitation_id: invitationId });
  if (error) throw error;
}

export async function removeMember(companyId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_member', { p_company_id: companyId, p_user_id: userId });
  if (error) throw error;
}

export interface AcceptInviteResult {
  companyId: string;
  shopId: string;
}

export async function acceptInvite(code: string): Promise<AcceptInviteResult> {
  const { data, error } = await supabase.rpc('accept_invite', { p_code: code }).single();
  if (error) throw error;
  const row = data as { company_id: string; shop_id: string };
  return { companyId: row.company_id, shopId: row.shop_id };
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { myMembershipsKey } from '@/features/company/hooks';
import { useAuthStore } from '@/stores/authStore';
import { useCompanyStore } from '@/stores/companyStore';
import {
  acceptInvite,
  fetchPendingInvitations,
  fetchTeamMembers,
  inviteMember,
  removeMember,
  revokeInvite,
  updateMemberRole,
  assignMemberToShop,
  removeMemberFromShop,
  type InviteMemberInput,
} from './api';

export function useTeamMembers() {
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  return useQuery({
    queryKey: ['teamMembers', activeCompanyId],
    queryFn: () => fetchTeamMembers(activeCompanyId as string),
    enabled: Boolean(activeCompanyId),
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Parameters<typeof updateMemberRole>[2] }) =>
      updateMemberRole(companyId as string, userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teamMembers', companyId] }),
  });
}

export function useAssignMemberToShop() {
  const queryClient = useQueryClient();
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  return useMutation({
    mutationFn: ({ userId, shopId }: { userId: string; shopId: string }) =>
      assignMemberToShop(companyId as string, userId, shopId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teamMembers', companyId] }),
  });
}

export function useRemoveMemberFromShop() {
  const queryClient = useQueryClient();
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  return useMutation({
    mutationFn: ({ userId, shopId }: { userId: string; shopId: string }) =>
      removeMemberFromShop(companyId as string, userId, shopId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teamMembers', companyId] }),
  });
}

export function usePendingInvitations() {
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  return useQuery({
    queryKey: ['pendingInvitations', activeCompanyId],
    queryFn: () => fetchPendingInvitations(activeCompanyId as string),
    enabled: Boolean(activeCompanyId),
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);

  return useMutation({
    mutationFn: (input: InviteMemberInput) => inviteMember(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingInvitations', activeCompanyId] });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);

  return useMutation({
    mutationFn: (invitationId: string) => revokeInvite(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingInvitations', activeCompanyId] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);

  return useMutation({
    mutationFn: (userId: string) => removeMember(activeCompanyId as string, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', activeCompanyId] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.session?.user.id);

  return useMutation({
    mutationFn: (code: string) => acceptInvite(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myMembershipsKey(userId) });
    },
  });
}

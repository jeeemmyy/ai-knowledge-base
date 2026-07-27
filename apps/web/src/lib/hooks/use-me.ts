'use client';
import { useQuery } from '@tanstack/react-query';
import { accountApi } from '@/lib/api/account';
import { useSupabase } from '@/components/providers/supabase-provider';

/** Current account state (verification + admin), fetched once a session exists. */
export function useMe() {
  const { session } = useSupabase();
  return useQuery({
    queryKey: ['me'],
    queryFn: accountApi.me,
    enabled: !!session,
    staleTime: 60_000,
  });
}

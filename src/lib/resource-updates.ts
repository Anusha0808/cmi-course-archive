import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ResourceUpdate = Database['public']['Tables']['resource_updates']['Row'];
export const updatesQuery = (userId?: string, admin = false) => ({
  queryKey: ['resource-updates', userId, admin],
  enabled: !!userId,
  queryFn: async () => {
    let query = supabase.from('resource_updates').select('*').order('created_at', { ascending: false });
    if (admin) query = query.eq('status', 'pending');
    else if (userId) query = query.eq('uploader_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
});
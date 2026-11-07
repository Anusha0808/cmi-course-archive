import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';

export const getAuthor = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
    const client = createClient<Database>(process.env['SUPABASE_URL']!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
        headers.set('apikey', key);
        return fetch(input, { ...init, headers });
      } },
    });
    const profile = await client.from('profiles').select('id, display_name, bio').eq('id', data.id).maybeSingle();
    if (profile.error) throw profile.error;
    const notes = await client.from('resources').select('*, courses(code, name)').eq('uploader_id', data.id).eq('status', 'approved').order('created_at', { ascending: false });
    if (notes.error) throw notes.error;
    return { profile: profile.data, notes: notes.data };
  });
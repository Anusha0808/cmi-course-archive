import { createServerFn } from '@tanstack/react-start';
import { directoryClient } from './directory.server';

export const getAuthors = createServerFn({ method: 'GET' }).handler(async () => {
  const client = directoryClient();
  const profiles = await client.from('profiles').select('id, display_name, bio').order('display_name');
  if (profiles.error) throw profiles.error;
  const notes = await client.from('resources').select('uploader_id').eq('status', 'approved');
  if (notes.error) throw notes.error;
  return profiles.data.map(p => ({ ...p, noteCount: notes.data.filter(n => n.uploader_id === p.id).length }));
});

export const getWebsites = createServerFn({ method: 'GET' }).handler(async () => {
  const result = await directoryClient().from('member_websites').select('id, owner_id, title, url, description, created_at, profiles(id, display_name)').order('created_at').order('id');
  if (result.error) throw result.error;
  return result.data;
});
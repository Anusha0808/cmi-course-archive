import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getAuthor } from '@/lib/profiles.functions';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { ResourceCard } from '@/components/ResourceCard';
import { EditResource } from '@/components/EditResource';
import { updatesQuery } from '@/lib/resource-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const authorQuery = (id: string) => ({ queryKey: ['author', id], queryFn: () => getAuthor({ data: { id } }) });
export const Route = createFileRoute('/authors/$id')({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(authorQuery(params.id)),
  head: ({ loaderData }) => {
    const name = loaderData?.profile?.display_name ?? 'Author';
    const title = `${name} — CMI Notes Archive`;
    const description = loaderData?.profile?.bio || `Course notes and peer resources shared by ${name}.`;
    return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'profile' }, { name: 'twitter:card', content: 'summary' }] };
  },
  errorComponent: () => <p className="mx-auto max-w-6xl px-5 py-12">Could not load this author. <Link to="/" className="text-primary underline">Back to archive</Link></p>,
  notFoundComponent: () => <p className="px-5 py-12">Author not found.</p>,
  component: AuthorPage,
});

function AuthorPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(authorQuery(id));
  const { user } = useAuth();
  const own = user?.id === id;
  const qc = useQueryClient();
  const mine = useQuery({ queryKey: ['my-resources', id], enabled: own, queryFn: async () => {
    const result = await supabase.from('resources').select('*, courses(code, name)').eq('uploader_id', id).order('created_at', { ascending: false });
    if (result.error) throw result.error;
    return result.data;
  } });
  const updates = useQuery(updatesQuery(own ? id : undefined));
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await supabase.from('profiles').update({ display_name: String(form.get('name')).trim(), bio: String(form.get('bio')).trim() }).eq('id', id);
    if (result.error) { toast.error(result.error.message); return; }
    toast.success('Profile saved');
    await qc.invalidateQueries({ queryKey: ['author', id] });
  }
  if (!data.profile) return <p className="px-5 py-12">Author not found.</p>;
  const notes = own ? mine.data ?? data.notes : data.notes;
  return <div className="mx-auto max-w-6xl px-5 py-12">
    <header className="mb-8 border-b border-border pb-6"><p className="mb-2 font-mono text-xs uppercase text-muted-foreground">CMI contributor</p><h1 className="break-words text-4xl font-bold text-primary">{data.profile.display_name}</h1>{data.profile.bio && <p className="mt-3 max-w-2xl whitespace-pre-wrap break-words text-muted-foreground">{data.profile.bio}</p>}</header>
    {own && <details className="mb-8 border-b border-border pb-6"><summary className="cursor-pointer font-semibold text-primary">Edit profile</summary><form onSubmit={save} className="mt-4 max-w-xl space-y-4"><div><Label htmlFor="profile-name">Name</Label><Input id="profile-name" name="name" defaultValue={data.profile.display_name} required maxLength={80} /></div><div><Label htmlFor="profile-bio">Short bio</Label><Textarea id="profile-bio" name="bio" defaultValue={data.profile.bio} maxLength={500} /></div><Button type="submit">Save profile</Button></form></details>}
    <h2 className="mb-5 text-2xl font-bold text-primary">{own ? 'Your uploads' : 'Published notes'} <span className="text-base font-normal text-muted-foreground">({notes.length})</span></h2>
    {mine.error && own && <p role="alert" className="text-destructive">Could not load your uploads.</p>}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{notes.map(r => {
      const update = updates.data?.find(u => u.resource_id === r.id);
      return <ResourceCard key={r.id} r={r} actions={own ? <><span className="self-center text-xs text-muted-foreground">{r.status}{update ? ` · Update ${update.status}` : ''}</span><EditResource resource={r} pending={update?.status === 'pending'} /></> : undefined} />;
    })}</div>
    {!notes.length && <p className="text-muted-foreground">No published notes yet.</p>}
  </div>;
}
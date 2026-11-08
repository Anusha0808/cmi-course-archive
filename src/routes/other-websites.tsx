import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Shuffle, Globe, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getWebsites } from '@/lib/directory.functions';
import { ringNeighbor, websiteUrl } from '@/lib/webring';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const websitesQuery = { queryKey: ['member-websites'], queryFn: () => getWebsites() };
export const Route = createFileRoute('/other-websites')({
  loader: ({ context }) => context.queryClient.ensureQueryData(websitesQuery),
  head: () => ({ meta: [
    { title: 'Other websites — CMI Webring' },
    { name: 'description', content: 'Explore personal websites, blogs and projects by CMI members in the CMI webring.' },
    { property: 'og:title', content: 'Other websites — CMI Webring' },
    { property: 'og:description', content: 'Personal websites connected by the CMI community.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  errorComponent: () => <p className="mx-auto max-w-6xl px-5 py-12">Could not load websites. <Link to="/" className="underline">Back to archive</Link></p>,
  component: WebsitesPage,
});

function WebsitesPage() {
  const { data: websites } = useSuspenseQuery(websitesQuery);
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string>();
  const own = websites.find(w => w.owner_id === user?.id);
  const current = websites.find(w => w.id === selected) ?? websites[0];
  const index = current ? websites.findIndex(w => w.id === current.id) : 0;
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const url = websiteUrl(String(form.get('url')));
      const result = await supabase.from('member_websites').upsert({ owner_id: user.id, title: String(form.get('title')).trim(), description: String(form.get('description')).trim(), url }, { onConflict: 'owner_id' });
      if (result.error) throw result.error;
      await qc.invalidateQueries({ queryKey: ['member-websites'] });
      toast.success(own ? 'Website updated' : 'Welcome to the CMI webring');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save your website'); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!window.confirm('Remove this website from the webring?')) return;
    const result = await supabase.from('member_websites').delete().eq('id', id);
    if (result.error) { toast.error(result.error.message); return; }
    await qc.invalidateQueries({ queryKey: ['member-websites'] });
    toast.success('Website removed');
  }
  return <main className="mx-auto max-w-6xl px-5 py-12">
    <header className="mb-8 border-b border-border pb-6"><p className="mb-2 font-mono text-xs uppercase text-muted-foreground">CMI Webring</p><h1 className="text-4xl font-bold text-primary">Other websites</h1><p className="mt-3 text-muted-foreground">Personal corners of the web, connected by CMI.</p></header>
    {user ? <details className="mb-8 border-b border-border pb-6"><summary className="cursor-pointer font-semibold text-primary">{own ? 'Edit your website' : 'Join the webring'}</summary><form key={own?.id ?? user.id} onSubmit={save} className="mt-5 max-w-xl space-y-4">
      <div><Label htmlFor="website-title">Website name</Label><Input id="website-title" name="title" defaultValue={own?.title} maxLength={100} required /></div>
      <div><Label htmlFor="website-url">Website address</Label><Input id="website-url" name="url" defaultValue={own?.url} placeholder="https://your-website.com" maxLength={2048} required /></div>
      <div><Label htmlFor="website-description">Short description</Label><Textarea id="website-description" name="description" defaultValue={own?.description} maxLength={300} /></div>
      <Button type="submit" disabled={busy}>{busy ? 'Saving…' : own ? 'Save website' : 'Join webring'}</Button>
    </form></details> : <Button asChild variant="outline" className="mb-8"><Link to="/auth">Sign in to join the webring</Link></Button>}
    {current && <section className="mb-10 border-y border-border bg-secondary/40 py-6">
      <div className="flex flex-wrap items-center justify-between gap-5"><div className="min-w-0"><p className="text-xs uppercase text-muted-foreground">Around the ring · {index + 1} / {websites.length}</p><h2 className="mt-2 break-words text-2xl font-bold text-primary">{current.title}</h2></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setSelected(ringNeighbor(websites, index, -1)?.id)} disabled={websites.length < 2}><ArrowLeft />Previous</Button><Button variant="outline" onClick={() => { const others = websites.filter(w => w.id !== current.id); setSelected(others[Math.floor(Math.random() * others.length)]?.id); }} disabled={websites.length < 2}><Shuffle />Random</Button><Button variant="outline" onClick={() => setSelected(ringNeighbor(websites, index, 1)?.id)} disabled={websites.length < 2}>Next<ArrowRight /></Button><Button asChild><a href={current.url} target="_blank" rel="noopener noreferrer">Visit<ExternalLink /></a></Button></div>
      </div>
    </section>}
    <h2 className="mb-5 text-2xl font-bold text-primary">Member websites <span className="text-base font-normal text-muted-foreground">({websites.length})</span></h2>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{websites.map(w => <article key={w.id} className="flex min-w-0 flex-col rounded-lg border border-border bg-card p-6 shadow-card">
      <Globe className="mb-5 size-8 text-muted-foreground" /><h3 className="break-words text-xl font-bold text-primary"><a href={w.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{w.title}</a></h3>
      <Link to="/authors/$id" params={{ id: w.owner_id }} className="mt-2 text-sm text-primary hover:underline">{w.profiles?.display_name ?? 'CMI member'}</Link>
      {w.description && <p className="mt-3 break-words text-sm text-muted-foreground">{w.description}</p>}
      <div className="mt-auto flex items-center justify-between gap-2 pt-5"><Button asChild variant="link" className="px-0"><a href={w.url} target="_blank" rel="noopener noreferrer">Visit website<ExternalLink /></a></Button>{(w.owner_id === user?.id || isAdmin) && <Button variant="ghost" size="icon" title="Remove website" aria-label={`Remove ${w.title}`} onClick={() => remove(w.id)}><Trash2 /></Button>}</div>
    </article>)}</div>
    {!websites.length && <p className="text-muted-foreground">No websites yet. Be the first to join.</p>}
  </main>;
}
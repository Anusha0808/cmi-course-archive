import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { updatesQuery } from '@/lib/resource-updates';
import { supabase } from '@/integrations/supabase/client';
import { openResource, type Resource } from '@/lib/resources';
import { ResourceCard } from '@/components/ResourceCard';
import { Button } from '@/components/ui/button';

export function UpdateReview() {
  const { user } = useAuth();
  const updates = useQuery(updatesQuery(user?.id, true));
  const current = useQuery({ queryKey: ['update-originals'], queryFn: async () => {
    const result = await supabase.from('resources').select('*, courses(code, name)');
    if (result.error) throw result.error;
    return result.data;
  } });
  const qc = useQueryClient();
  async function review(id: string, approve: boolean) {
    const result = await supabase.rpc('review_resource_update', { _id: id, _approve: approve });
    if (result.error) { toast.error(result.error.message); return; }
    toast.success(approve ? 'Update approved and published' : 'Update rejected; current version unchanged');
    await qc.invalidateQueries();
  }
  return <section className="mb-10"><h2 className="mb-4 border-b border-border pb-2 text-2xl font-bold text-primary">Updates awaiting review <span className="text-base">({updates.data?.length ?? 0})</span></h2>
    {updates.error ? <p className="text-destructive">Could not load updates.</p> : !updates.data?.length ? <p className="text-muted-foreground">No updates waiting for review.</p> : <div className="space-y-8">{updates.data.map(u => {
      const original = current.data?.find(r => r.id === u.resource_id);
      return <div key={u.id} className="border-b border-border pb-6"><p className="mb-3 text-sm text-muted-foreground">Submitted {new Date(u.created_at).toLocaleDateString()}</p><div className="grid gap-5 md:grid-cols-2"><div><h3 className="mb-2 font-semibold">Current version</h3>{original && <ResourceCard r={original} />}</div><div><h3 className="mb-2 font-semibold">Proposed update</h3><article className="rounded-md border border-border bg-card p-5 shadow-card"><h4 className="break-words text-xl font-bold text-primary">{u.title}</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{u.description}</p><p className="mt-3 text-sm">{u.author_name} · {u.academic_year}</p><p className="mt-2 text-xs text-muted-foreground">{u.section} · {u.tags.join(', ')} · {u.kind}</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => {
        const preview: Resource = { ...u, id: u.resource_id, course_request_id: null, revision_number: u.base_version, status: 'pending' };
        void openResource(preview).catch(e => toast.error(e.message));
      }}>Open proposed file / link</Button><Button size="sm" onClick={() => review(u.id, true)}>Approve update</Button><Button variant="outline" size="sm" onClick={() => review(u.id, false)}>Reject update</Button></div></article></div></div></div>;
    })}</div>}
  </section>;
}
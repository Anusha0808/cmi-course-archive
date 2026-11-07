import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { courseListQuery, fileMatchesKind, KIND_ACCEPT, KIND_LABEL, type Resource, type ResourceKind } from '@/lib/resources';
import { parseTags } from '@/lib/archive-rules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function EditResource({ resource, pending = false }: { resource: Resource; pending?: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<ResourceKind>(resource.kind);
  const courses = useQuery(courseListQuery);
  const qc = useQueryClient();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const section = String(form.get('section'));
    const courseId = section === 'miscellaneous' ? courses.data?.find(c => c.code === 'MISC')?.id : String(form.get('course'));
    if (!courseId) { toast.error('Select a course.'); return; }
    setBusy(true);
    let uploaded: string | null = null;
    try {
      let path = resource.file_path;
      let url: string | null = null;
      if (kind === 'link') {
        url = String(form.get('url') ?? '').trim();
        if (!/^https?:\/\//.test(url)) throw new Error('Enter a valid HTTP link.');
        path = null;
      } else {
        const file = form.get('file');
        if (file instanceof File && file.size) {
          if (!fileMatchesKind(file.name, kind)) throw new Error('The file does not match the selected type.');
          uploaded = `${resource.uploader_id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, '_')}`;
          const result = await supabase.storage.from('notes').upload(uploaded, file);
          if (result.error) throw result.error;
          path = uploaded;
        } else if (kind !== resource.kind || !path) throw new Error('Choose a replacement file for this type.');
      }
      const { error } = await supabase.from('resource_updates').insert({
        resource_id: resource.id, uploader_id: resource.uploader_id,
        title: String(form.get('title')).trim(), author_name: String(form.get('author')).trim(),
        description: String(form.get('description') ?? '').trim() || null,
        academic_year: String(form.get('year') ?? '').trim() || null,
        section, course_id: courseId, tags: parseTags(String(form.get('tags') ?? '')),
        kind, file_path: path, url,
      });
      if (error) throw error;
      toast.success('Update sent to moderators for review');
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ['resource-updates'] });
    } catch (error) {
      if (uploaded) await supabase.storage.from('notes').remove([uploaded]);
      toast.error(error instanceof Error ? error.message : 'Could not submit update.');
    } finally { setBusy(false); }
  }
  return <>
    <Button size="sm" variant="outline" disabled={pending} onClick={() => setOpen(true)}><Pencil className="size-3.5" />{pending ? 'Update awaiting review' : 'Edit upload'}</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto"><DialogHeader><DialogTitle>Edit upload</DialogTitle><DialogDescription>The current version stays visible until a moderator approves your update.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1"><Label htmlFor="edit-title">Title</Label><Input id="edit-title" name="title" defaultValue={resource.title} required maxLength={150} /></div>
        <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="edit-author">Author name</Label><Input id="edit-author" name="author" defaultValue={resource.author_name} required maxLength={80} /></div><div><Label htmlFor="edit-year">Semester / year</Label><Input id="edit-year" name="year" defaultValue={resource.academic_year ?? ''} maxLength={40} /></div></div>
        <div><Label htmlFor="edit-section">Section</Label><select id="edit-section" name="section" defaultValue={resource.section} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="course">Course notes</option><option value="miscellaneous">Miscellaneous</option></select></div>
        <div><Label htmlFor="edit-course">Course</Label><select id="edit-course" name="course" defaultValue={resource.course_id} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">{courses.data?.filter(c => c.code !== 'MISC').map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}</select></div>
        <div><Label htmlFor="edit-description">Description</Label><Textarea id="edit-description" name="description" defaultValue={resource.description ?? ''} maxLength={1000} /></div>
        <div><Label htmlFor="edit-tags">Tags</Label><Input id="edit-tags" name="tags" defaultValue={resource.tags.join(', ')} /></div>
        <div><Label htmlFor="edit-kind">Type</Label><select id="edit-kind" value={kind} onChange={e => setKind(e.target.value as ResourceKind)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(KIND_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        {kind === 'link' ? <div><Label htmlFor="edit-url">Link</Label><Input id="edit-url" name="url" type="url" required defaultValue={resource.url ?? ''} /></div> : <div><Label htmlFor="edit-file">Replacement file (optional)</Label><Input id="edit-file" type="file" name="file" accept={KIND_ACCEPT[kind].join(',')} /></div>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'Sending…' : 'Send update for review'}</Button>
      </form>
    </DialogContent></Dialog>
  </>;
}
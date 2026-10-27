import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { courseListQuery, fileMatchesKind, KIND_ACCEPT, KIND_LABEL, type Resource, type ResourceKind } from "@/lib/resources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/upload")({
  validateSearch: (s: Record<string, unknown>) => ({ course: typeof s.course === "string" ? s.course : undefined }),
  head: () => ({
    meta: [
      { title: "Share notes — CMI Notes Archive" },
      { name: "description", content: "Upload your typed course notes (PDF, LaTeX, Typst) or share a link for fellow CMI students." },
      { property: "og:title", content: "Share notes — CMI Notes Archive" },
      { property: "og:description", content: "Contribute your course notes to the CMI student archive." },
    ],
  }),
  component: UploadPage,
});

const KINDS: ResourceKind[] = ["pdf", "tex", "typst", "link"];

function UploadPage() {
  const { user, loading } = useAuth();
  const search = Route.useSearch();
  const qc = useQueryClient();
  const courses = useQuery(courseListQuery);
  const [kind, setKind] = useState<ResourceKind>("pdf");
  const [courseId, setCourseId] = useState(search.course ?? "");
  const [busy, setBusy] = useState(false);

  const mine = useQuery({
    queryKey: ["my-resources", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*, courses(code, name)")
        .eq("uploader_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Resource[];
    },
  });

  if (loading) return null;
  if (!user)
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="text-3xl font-bold text-primary">Share your notes</h1>
        <p className="mt-3 text-muted-foreground">Sign in to upload notes. Every submission is reviewed before it appears in the archive.</p>
        <Button asChild className="mt-6"><Link to="/auth">Sign in to upload</Link></Button>
      </div>
    );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const author = String(form.get("author") ?? "").trim();
    if (!courseId || !title || !author) return toast.error("Course, title and your name are required.");
    setBusy(true);
    try {
      let file_path: string | null = null;
      let url: string | null = null;
      if (kind === "link") {
        url = String(form.get("url") ?? "").trim();
        if (!/^https?:\/\//.test(url)) throw new Error("Enter a valid link starting with http(s)://");
      } else {
        const file = form.get("file") as File | null;
        if (!file || !file.size) throw new Error("Choose a file to upload.");
        if (!fileMatchesKind(file.name, kind)) throw new Error(`${KIND_LABEL[kind]} uploads must be ${KIND_ACCEPT[kind].join(" or ")}`);
        const safe = file.name.replace(/[^\w.-]+/g, "_");
        file_path = `${user!.id}/${crypto.randomUUID()}-${safe}`;
        const { error } = await supabase.storage.from("notes").upload(file_path, file);
        if (error) throw error;
      }
      const { error } = await supabase.from("resources").insert({
        course_id: courseId,
        title,
        author_name: author,
        description: String(form.get("description") ?? "").trim() || null,
        academic_year: String(form.get("year") ?? "").trim() || null,
        kind,
        file_path,
        url,
        uploader_id: user!.id,
      });
      if (error) throw error;
      toast.success("Submitted! It will appear once reviewed.");
      (e.target as HTMLFormElement).reset();
      qc.invalidateQueries({ queryKey: ["my-resources"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1fr_22rem]">
      <form onSubmit={submit} className="space-y-5 rounded-md border border-border bg-card p-6 shadow-card">
        <div>
          <h1 className="text-3xl font-bold text-primary">Share your notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Submissions are reviewed before they go public.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="course">Course</Label>
          <select id="course" value={courseId} onChange={(e) => setCourseId(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Select a course…</option>
            {courses.data?.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <Button key={k} type="button" size="sm" variant={k === kind ? "default" : "outline"} onClick={() => setKind(k)}>
                {KIND_LABEL[k]}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" maxLength={150} placeholder="Lecture notes, weeks 1–6" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="author">Your name</Label><Input id="author" name="author" maxLength={80} /></div>
          <div className="space-y-2"><Label htmlFor="year">Semester / year</Label><Input id="year" name="year" maxLength={40} placeholder="Aug–Nov 2026" /></div>
        </div>
        <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" maxLength={1000} placeholder="Instructor, topics covered, anything useful" /></div>
        {kind === "link" ? (
          <div className="space-y-2"><Label htmlFor="url">Link</Label><Input id="url" name="url" type="url" placeholder="https://…" /></div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="file">File ({KIND_ACCEPT[kind].join(", ")}, max 50 MB)</Label>
            <Input id="file" name="file" type="file" accept={KIND_ACCEPT[kind].join(",")} />
          </div>
        )}
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Submitting…" : "Submit for review"}</Button>
      </form>

      <aside>
        <h2 className="mb-3 text-xl font-bold text-primary">Your submissions</h2>
        <ul className="space-y-2">
          {mine.data?.map((r) => (
            <li key={r.id} className="rounded-md border border-border bg-card p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-semibold text-primary">{r.title}</span>
                <span className={r.status === "approved" ? "text-success" : r.status === "rejected" ? "text-destructive" : "text-warning"}>{r.status}</span>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{r.courses?.code}</span>
            </li>
          ))}
          {!mine.data?.length && <li className="text-sm text-muted-foreground">Nothing submitted yet.</li>}
        </ul>
      </aside>
    </div>
  );
}

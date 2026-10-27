import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { courseListQuery, type Resource } from "@/lib/resources";
import { ResourceCard } from "@/components/ResourceCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CMI Notes Archive — Course notes by CMI students" },
      { name: "description", content: "Typed course notes, LaTeX and Typst sources, and peer resources shared by students of Chennai Mathematical Institute." },
      { property: "og:title", content: "CMI Notes Archive" },
      { property: "og:description", content: "Course notes and peer resources shared by CMI students." },
    ],
  }),
  component: Index,
});

function Index() {
  const [q, setQ] = useState("");
  const courses = useQuery(courseListQuery);
  const counts = useQuery({
    queryKey: ["resource-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("resources").select("course_id").eq("status", "approved");
      if (error) throw error;
      const m: Record<string, number> = {};
      data.forEach((r) => (m[r.course_id] = (m[r.course_id] ?? 0) + 1));
      return m;
    },
  });
  const recent = useQuery({
    queryKey: ["recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*, courses(code, name)")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as Resource[];
    },
  });

  const grouped = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = (courses.data ?? []).filter(
      (c) => !term || c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term),
    );
    const g: Record<string, typeof list> = {};
    list.forEach((c) => (g[c.subject] ??= []).push(c));
    return g;
  }, [courses.data, q]);

  return (
    <div>
      <section className="bg-hero">
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-16">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">An archive by students, for students</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold text-primary sm:text-5xl">
            Course notes from the lecture halls of CMI.
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Typed notes, LaTeX and Typst sources, problem sets and useful links — shared by your peers, organised by course.
          </p>
          <div className="mt-8 max-w-md">
            <Input placeholder="Search courses — e.g. Topology, CS201" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 bg-card" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10">
        {Object.entries(grouped).map(([subject, list]) => (
          <section key={subject} className="mb-10">
            <h2 className="mb-4 border-b border-border pb-2 text-2xl font-bold text-primary">{subject}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => (
                <Link
                  key={c.id}
                  to="/courses/$code"
                  params={{ code: c.code }}
                  className="group flex items-baseline justify-between rounded-md border border-border bg-card px-4 py-3 shadow-card transition-colors hover:border-ring"
                >
                  <span>
                    <span className="mr-2 font-mono text-xs text-muted-foreground">{c.code}</span>
                    <span className="font-semibold text-primary group-hover:underline underline-offset-4">{c.name}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{counts.data?.[c.id] ?? 0}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {courses.isLoading && <p className="text-muted-foreground">Loading courses…</p>}

        <section className="mt-6">
          <h2 className="mb-4 border-b border-border pb-2 text-2xl font-bold text-primary">Recently added</h2>
          {recent.data?.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recent.data.map((r) => <ResourceCard key={r.id} r={r} />)}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Nothing here yet. <Link to="/upload" className="font-semibold text-primary underline">Be the first to share your notes.</Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

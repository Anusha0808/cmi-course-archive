import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CourseBrowser } from "@/components/CourseBrowser";
import { supabase } from "@/integrations/supabase/client";
import { courseListQuery, type Resource } from "@/lib/resources";
import { ResourceCard } from "@/components/ResourceCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "CMI Notes Archive — Course notes by CMI students" },
      { name: "description", content: "Typed course notes, LaTeX and Typst sources, and peer resources shared by students of Chennai Mathematical Institute." },
      { property: "og:title", content: "CMI Notes Archive" },
      { property: "og:description", content: "Course notes and peer resources shared by CMI students." },
    ],
  }),
  component: Index,
});

function Index() {
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
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <CourseBrowser courses={courses.data ?? []} counts={counts.data ?? {}} loading={courses.isLoading || counts.isLoading} error={courses.isError || counts.isError} retry={() => { void courses.refetch(); void counts.refetch(); }} />

        <section className="mb-10"><h2 className="mb-4 border-b border-border pb-2 text-2xl font-bold text-primary">Miscellaneous</h2><Link to="/miscellaneous" className="font-semibold text-primary underline">Browse notes and peer resources by tag →</Link></section>

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

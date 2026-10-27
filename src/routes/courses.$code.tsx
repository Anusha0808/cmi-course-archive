import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResourceCard } from "@/components/ResourceCard";
import type { Resource } from "@/lib/resources";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/courses/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.code} notes — CMI Notes Archive` },
      { name: "description", content: `Student notes and resources for ${params.code} at Chennai Mathematical Institute.` },
      { property: "og:title", content: `${params.code} notes — CMI Notes Archive` },
      { property: "og:description", content: `Student notes and resources for ${params.code} at CMI.` },
    ],
  }),
  component: CoursePage,
});

function CoursePage() {
  const { code } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["course", code],
    queryFn: async () => {
      const { data: course, error } = await supabase.from("courses").select("*").eq("code", code).maybeSingle();
      if (error) throw error;
      if (!course) return null;
      const { data: res, error: e2 } = await supabase
        .from("resources")
        .select("*")
        .eq("course_id", course.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (e2) throw e2;
      return { course, resources: res as Resource[] };
    },
  });

  if (isLoading) return <p className="mx-auto max-w-6xl px-5 py-12 text-muted-foreground">Loading…</p>;
  if (!data) return <p className="mx-auto max-w-6xl px-5 py-12">Course not found. <Link to="/" className="text-primary underline">Back to courses</Link></p>;

  return (
    <div>
      <section className="bg-hero">
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-12">
          <Link to="/" className="text-sm text-muted-foreground hover:underline">← All courses</Link>
          <p className="mt-4 font-mono text-sm text-muted-foreground">{data.course.code} · {data.course.subject}</p>
          <h1 className="mt-1 text-4xl font-bold text-primary">{data.course.name}</h1>
          <Button asChild className="mt-6">
            <Link to="/upload" search={{ course: data.course.id }}>Share notes for this course</Link>
          </Button>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-10">
        {data.resources.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.resources.map((r) => <ResourceCard key={r.id} r={r} />)}
          </div>
        ) : (
          <p className="text-muted-foreground">No notes for this course yet.</p>
        )}
      </div>
    </div>
  );
}

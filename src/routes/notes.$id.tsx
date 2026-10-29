import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ReportResource } from "@/components/ReportResource";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { supabase } from "@/integrations/supabase/client";
import type { Resource } from "@/lib/resources";

export const Route = createFileRoute("/notes/$id")({
  head: () => ({
    meta: [
      { title: "Notes — CMI Notes Archive" },
      { name: "description", content: "Read student-written course notes from Chennai Mathematical Institute." },
      { property: "og:title", content: "Notes — CMI Notes Archive" },
      { property: "og:description", content: "Student-written course notes from CMI." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotePage,
});

function NotePage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      const { data: r, error } = await supabase.from("resources").select("*, courses(code, name)").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!r) return null;
      let text = "";
      if (r.file_path) {
        const { data: blob, error: e2 } = await supabase.storage.from("notes").download(r.file_path);
        if (e2) throw e2;
        text = await blob.text();
      }
      return { r: r as Resource, text };
    },
  });

  if (isLoading) return <p className="mx-auto max-w-3xl px-5 py-12 text-muted-foreground">Loading…</p>;
  if (error || !data) return <p className="mx-auto max-w-3xl px-5 py-12">Note not found. <Link to="/" className="text-primary underline">Back to courses</Link></p>;
  const { r, text } = data;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      {r.section === "miscellaneous" ? <Link to="/miscellaneous" className="text-sm text-muted-foreground">← Miscellaneous</Link> : r.courses && (
        <Link to="/courses/$code" params={{ code: r.courses.code }} className="text-sm text-muted-foreground hover:underline">
          ← {r.courses.code} · {r.courses.name}
        </Link>
      )}
      <h1 className="mt-3 text-4xl font-bold text-primary">{r.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        by <span className="font-medium text-foreground">{r.author_name}</span>
        {r.academic_year && <> · {r.academic_year}</>}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">{r.tags.map((tag) => <Link key={tag} to="/miscellaneous" search={{ tag }} className="text-sm text-primary underline">#{tag}</Link>)}<ReportResource id={r.id} /></div>
      <article className="md-body mt-8 rounded-md border border-border bg-card p-6 shadow-card">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{text}</ReactMarkdown>
      </article>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ResourceCard } from "@/components/ResourceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Resource } from "@/lib/resources";

export const Route = createFileRoute("/miscellaneous")({
  validateSearch: (s: Record<string, unknown>): { tag?: string } => typeof s["tag"] === "string" ? { tag: s["tag"] } : {},
  head: () => ({ meta: [
    { title: "Miscellaneous notes — CMI Notes Archive" },
    { name: "description", content: "Tagged study notes, reading material and peer resources beyond CMI courses." },
    { property: "og:title", content: "Miscellaneous notes — CMI Notes Archive" },
    { property: "og:description", content: "Browse CMI peer resources and miscellaneous notes by tag." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: MiscellaneousPage,
});

function MiscellaneousPage() {
  const { tag } = Route.useSearch();
  const [search, setSearch] = useState("");
  const notes = useQuery({ queryKey: ["miscellaneous"], queryFn: async () => {
    const { data, error } = await supabase.from("resources").select("*, courses(code, name)").eq("section", "miscellaneous").eq("status", "approved").order("created_at", { ascending: false });
    if (error) throw error;
    return data as Resource[];
  } });
  const tags = [...new Set(notes.data?.flatMap((r) => r.tags) ?? [])].sort();
  const filtered = notes.data?.filter((r) => (!tag || r.tags.includes(tag)) && `${r.title} ${r.description ?? ""} ${r.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  return <div>
    <section className="bg-hero"><div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-4xl font-bold text-primary">Miscellaneous</h1>
      <Button asChild className="mt-6"><Link to="/upload" search={{ section: "miscellaneous" }}>Share notes</Link></Button>
    </div></section>
    <div className="mx-auto max-w-6xl space-y-6 px-5 py-10">
      <Input aria-label="Search miscellaneous notes" placeholder="Search notes or tags…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      <div className="flex flex-wrap gap-2"><Button asChild size="sm" variant={!tag ? "default" : "outline"}><Link to="/miscellaneous" search={{}}>All tags</Link></Button>{tags.map((t) => <Button asChild key={t} size="sm" variant={tag === t ? "default" : "outline"}><Link to="/miscellaneous" search={{ tag: t }}>#{t}</Link></Button>)}</div>
      {notes.isLoading ? <p>Loading notes…</p> : notes.error ? <p className="text-destructive">Could not load notes. Please try again.</p> : filtered?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((r) => <ResourceCard key={r.id} r={r} />)}</div> : <p className="text-muted-foreground">No notes found.</p>}
    </div>
  </div>;
}
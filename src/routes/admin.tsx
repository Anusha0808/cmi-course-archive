import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Resource } from "@/lib/resources";
import { ResourceCard } from "@/components/ResourceCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Review submissions — CMI Notes Archive" },
      { name: "description", content: "Moderator queue for approving student-submitted notes." },
      { property: "og:title", content: "Review submissions — CMI Notes Archive" },
      { property: "og:description", content: "Moderator review of archive submissions and spam reports." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const pending = useQuery({
    queryKey: ["pending"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*, courses(code, name)")
        .eq("status", "pending")
        .order("created_at");
      if (error) throw error;
      return data as Resource[];
    },
  });

  if (loading) return null;
  if (!isAdmin) return <p className="mx-auto max-w-6xl px-5 py-16 text-muted-foreground">Only moderators can view this page.</p>;

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("resources").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Approved and published" : "Rejected");
    qc.invalidateQueries();
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="mb-6 text-3xl font-bold text-primary">Review queue</h1>
      {pending.data?.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pending.data.map((r) => (
            <ResourceCard
              key={r.id}
              r={r}
              actions={
                <>
                  <Button size="sm" onClick={() => setStatus(r.id, "approved")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "rejected")}>Reject</Button>
                </>
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No submissions waiting for review.</p>
      )}
    </div>
  );
}

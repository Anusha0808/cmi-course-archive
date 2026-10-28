import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Link2, FileCode2, Trash2 } from "lucide-react";
import { deleteResource, KIND_LABEL, openResource, type Resource } from "@/lib/resources";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function ResourceCard({ r, actions }: { r: Resource; actions?: ReactNode }) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const Icon = r.kind === "link" ? Link2 : r.kind === "pdf" || r.kind === "markdown" ? FileText : FileCode2;
  const titleCls = "text-left font-serif text-lg font-bold text-primary hover:underline underline-offset-4";

  const onDelete = async () => {
    if (!confirm(`Delete "${r.title}" permanently?`)) return;
    try {
      await deleteResource(r);
      toast.success("Note deleted");
      qc.invalidateQueries();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <article className="flex flex-col rounded-md border border-border bg-card p-5 shadow-card transition-transform hover:-translate-y-0.5">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 font-mono font-medium text-secondary-foreground">
          <Icon className="size-3" /> {KIND_LABEL[r.kind]}
        </span>
        {r.courses && <span className="font-mono text-muted-foreground">{r.courses.code}</span>}
      </div>
      {r.kind === "markdown" ? (
        <Link to="/notes/$id" params={{ id: r.id }} className={titleCls}>{r.title}</Link>
      ) : (
        <button className={titleCls} onClick={() => openResource(r).catch((e) => toast.error(e.message))}>
          {r.title}
        </button>
      )}
      {r.description && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{r.description}</p>}
      <p className="mt-auto pt-4 text-xs text-muted-foreground">
        by <span className="font-medium text-foreground">{r.author_name}</span>
        {r.academic_year && <> · {r.academic_year}</>}
      </p>
      {(actions || isAdmin) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions}
          {isAdmin && (
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="size-3.5" /> Delete
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

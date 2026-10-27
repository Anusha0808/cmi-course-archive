import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type Resource = Database["public"]["Tables"]["resources"]["Row"] & {
  courses?: { code: string; name: string } | null;
};
export type ResourceKind = Database["public"]["Enums"]["resource_kind"];

export const KIND_LABEL: Record<ResourceKind, string> = {
  pdf: "PDF",
  tex: "LaTeX",
  typst: "Typst",
  link: "Link",
};

export const KIND_ACCEPT: Record<Exclude<ResourceKind, "link">, string[]> = {
  pdf: [".pdf"],
  tex: [".tex", ".zip"],
  typst: [".typ", ".zip"],
};

export function fileMatchesKind(fileName: string, kind: Exclude<ResourceKind, "link">) {
  const lower = fileName.toLowerCase();
  return KIND_ACCEPT[kind].some((ext) => lower.endsWith(ext));
}

export async function openResource(r: Resource) {
  if (r.kind === "link" && r.url) {
    window.open(r.url, "_blank", "noopener");
    return;
  }
  if (!r.file_path) return;
  const { data, error } = await supabase.storage.from("notes").createSignedUrl(r.file_path, 600);
  if (error || !data) throw error ?? new Error("Could not open file");
  window.open(data.signedUrl, "_blank", "noopener");
}

export const courseListQuery = {
  queryKey: ["courses"],
  queryFn: async () => {
    const { data, error } = await supabase.from("courses").select("*").order("code");
    if (error) throw error;
    return data;
  },
};

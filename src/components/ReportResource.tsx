import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ReportResource({ id }: { id: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState("");

  async function report() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("resource_reports").insert({ resource_id: id, reporter_id: user.id, reason, details });
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "You have already reported this submission." : error.message); return; }
    toast.success("Report sent to the moderator.");
    setOpen(false);
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button size="sm" variant="ghost"><Flag className="size-3.5" /> Report</Button></DialogTrigger>
    <DialogContent><DialogHeader><DialogTitle>Report submission</DialogTitle></DialogHeader>
      {!user ? <Button asChild><Link to="/auth">Sign in to report</Link></Button> : <div className="space-y-4">
        <fieldset className="flex gap-4"><legend className="mb-2 text-sm font-medium">Reason</legend>
          {["spam", "scam"].map((value) => <label key={value} className="flex items-center gap-2 text-sm"><input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} />{value === "spam" ? "Spam" : "Scam"}</label>)}
        </fieldset>
        <div className="space-y-2"><Label htmlFor={`report-${id}`}>Details (optional)</Label><Textarea id={`report-${id}`} value={details} maxLength={1000} onChange={(e) => setDetails(e.target.value)} /></div>
        <Button onClick={report} disabled={busy}>{busy ? "Sending…" : "Send report"}</Button>
      </div>}
    </DialogContent>
  </Dialog>;
}
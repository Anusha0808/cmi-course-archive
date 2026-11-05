import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isRecoveryHash } from "@/lib/archive-rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Captured at import time: the auth client clears the URL hash once it has read the link.
const RECOVERY_IN_HASH = typeof window !== "undefined" && isRecoveryHash(window.location.hash);

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Choose a new password — CMI Notes Archive" },
      { name: "description", content: "Set a new password for your CMI Notes Archive account." },
      { property: "og:title", content: "Choose a new password — CMI Notes Archive" },
      { property: "og:description", content: "Set a new password for your CMI Notes Archive account." },
    ],
  }),
  component: ResetPasswordPage,
});

type Status = "checking" | "ready" | "invalid" | "done";

function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const admit = (allowed: boolean) =>
      setStatus((prev) => (prev === "ready" || prev === "done" ? prev : allowed ? "ready" : "invalid"));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session && active) admit(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      const recoverySession = session?.user?.app_metadata?.provider === "recovery";
      admit(Boolean(session) && (RECOVERY_IN_HASH || recoverySession));
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    const confirm = String(f.get("confirm"));
    if (password.length < 6) { toast.error("Use at least 6 characters."); return; }
    if (password !== confirm) { toast.error("The two passwords don't match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setStatus("done");
    toast.success("Password updated — you're signed in.");
  }

  return (
    <div className="bg-hero">
      <div className="mx-auto max-w-sm px-5 py-16">
        <div className="rounded-md border border-border bg-card p-6 shadow-card space-y-5">
          <h1 className="text-3xl font-bold text-primary">New password</h1>

          {status === "checking" && (
            <p className="text-sm text-muted-foreground">Checking your reset link…</p>
          )}

          {status === "invalid" && (
            <>
              <p className="text-sm text-muted-foreground">
                This reset link is expired or wasn't opened from the email. Ask for a new one and open the
                link it sends.
              </p>
              <Button asChild className="w-full">
                <Link to="/auth">Back to sign in</Link>
              </Button>
            </>
          )}

          {status === "ready" && (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-sm text-muted-foreground">Choose a new password for your archive account.</p>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input id="password" name="password" type="password" minLength={6} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" name="confirm" type="password" minLength={6} required />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                Save new password
              </Button>
            </form>
          )}

          {status === "done" && (
            <>
              <p className="text-sm text-muted-foreground">
                Your password is set. You can sign in with it from now on.
              </p>
              <Button asChild className="w-full">
                <Link to="/upload">Upload notes</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/">Browse courses</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

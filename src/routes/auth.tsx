import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CMI Notes Archive" },
      { name: "description", content: "Sign in to share your course notes with CMI students." },
      { property: "og:title", content: "Sign in — CMI Notes Archive" },
      { property: "og:description", content: "Sign in to contribute to the CMI notes archive." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/upload" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    setBusy(true);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === "up") toast.success("Check your email to confirm your account.");
  }

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(String(res.error.message ?? res.error));
  }

  return (
    <div className="bg-hero">
      <div className="mx-auto max-w-sm px-5 py-16">
        <div className="rounded-md border border-border bg-card p-6 shadow-card space-y-5">
          <h1 className="text-3xl font-bold text-primary">{mode === "in" ? "Sign in" : "Create account"}</h1>
          <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
          <div className="text-center text-xs text-muted-foreground">or with email</div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" minLength={6} required /></div>
            <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Sign up"}</Button>
          </form>
          <button className="w-full text-sm text-primary underline-offset-4 hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { emailAllowed, resetRedirectUrl } from "@/lib/archive-rules";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Sign in — CMI Notes Archive" },
      { name: "description", content: "Sign in to share your course notes with CMI students." },
      { property: "og:title", content: "Sign in — CMI Notes Archive" },
      { property: "og:description", content: "Sign in to contribute to the CMI notes archive." },
    ],
  }),
  component: AuthPage,
});

type View = "in" | "up" | "forgot";

function AuthPage() {
  const [view, setView] = useState<View>("in");
  const [busy, setBusy] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetSentTo, setResetSentTo] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/upload" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim().toLowerCase();
    if (!emailAllowed(email)) { toast.error("Use your @cmi.ac.in email. Only the designated moderator Gmail is allowed."); return; }
    const password = String(f.get("password"));
    setBusy(true);
    const { error } =
      view === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (view === "up") {
      setVerificationEmail(email);
      toast.success("Check your email for your verification code.");
    }
  }

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: verificationEmail, token: code.trim(), type: "signup" });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  async function signInWithGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return; // browser is navigating to Google
    setBusy(false);
  }

  async function resend() {
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: verificationEmail, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Verification email resent.");
  }

  async function sendReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim().toLowerCase();
    if (!emailAllowed(email)) { toast.error("Use your @cmi.ac.in email. Only the designated moderator Gmail is allowed."); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirectUrl(window.location.origin),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setResetSentTo(email);
    toast.success("Check your email for a reset link.");
  }

  async function resendReset() {
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetSentTo, {
      redirectTo: resetRedirectUrl(window.location.origin),
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Reset link resent.");
  }

  const heading = verificationEmail
    ? "Verify your email"
    : view === "forgot"
      ? resetSentTo
        ? "Check your email"
        : "Reset password"
      : view === "in"
        ? "Sign in"
        : "Create account";

  return (
    <div className="bg-hero">
      <div className="mx-auto max-w-sm px-5 py-16">
        <div className="rounded-md border border-border bg-card p-6 shadow-card space-y-5">
          <h1 className="text-3xl font-bold text-primary">{heading}</h1>

          {verificationEmail ? <form onSubmit={verify} className="space-y-4">
            <p className="break-all text-sm text-muted-foreground">{verificationEmail}</p>
            <Label htmlFor="verification-code">Verification code</Label>
            <Input id="verification-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" minLength={6} maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required />
            <Button className="w-full" disabled={busy} type="submit">Verify account</Button>
            <Button variant="ghost" disabled={busy} type="button" onClick={resend}>Resend code</Button>
            <Button variant="ghost" type="button" onClick={() => setVerificationEmail("")}>Change email</Button>
          </form> : view === "forgot" ? <>
            {resetSentTo ? <>
              <p className="break-all text-sm text-muted-foreground">{resetSentTo}</p>
              <p className="text-sm text-muted-foreground">
                We sent a link to this address. Open it to choose a new password — it expires in an hour.
              </p>
              <Button variant="ghost" className="w-full" disabled={busy} type="button" onClick={resendReset}>
                Resend link
              </Button>
              <Button className="w-full" type="button" onClick={() => { setResetSentTo(""); setView("in"); }}>
                Back to sign in
              </Button>
            </> : <form onSubmit={sendReset} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the email on your archive account and we'll send a link to choose a new password.
              </p>
              <div className="space-y-2"><Label htmlFor="reset-email">Email</Label><Input id="reset-email" name="email" type="email" required /></div>
              <Button type="submit" className="w-full" disabled={busy}>Send reset link</Button>
              <Button variant="ghost" className="w-full text-sm" type="button" onClick={() => setView("in")}>
                Back to sign in
              </Button>
            </form>}
          </> : <>
          <p className="text-sm text-muted-foreground">CMI email accounts · designated moderator Gmail</p>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" minLength={6} required /></div>
            <Button type="submit" className="w-full" disabled={busy}>{view === "in" ? "Sign in" : "Sign up"}</Button>
          </form>
          {view === "in" && (
            <Button variant="ghost" className="w-full text-sm" onClick={() => { setResetSentTo(""); setView("forgot"); }}>
              Forgot password?
            </Button>
          )}
          <Button variant="ghost" className="w-full text-sm" onClick={() => setView(view === "in" ? "up" : "in")}>
            {view === "in" ? "New here? Create an account" : "Have an account? Sign in"}
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" disabled={busy} onClick={signInWithGoogle}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.27 9.14 5.38 12 5.38Z" />
            </svg>
            Continue with Google
          </Button>
          </>}
        </div>
      </div>
    </div>
  );
}

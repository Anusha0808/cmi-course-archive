import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const linkCls = "text-sm font-semibold text-primary hover:underline underline-offset-4";
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link to="/" className="flex items-center gap-4">
          <span className="font-serif text-3xl italic font-semibold text-primary leading-none">cmi</span>
          <span className="hidden sm:block border-l border-primary/40 pl-3 text-[0.65rem] uppercase tracking-[0.18em] leading-tight text-primary/80">
            Chennai
            <br />
            Mathematical
            <br />
            Institute
          </span>
          <span className="font-serif text-2xl font-bold text-primary">Notes Archive</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link to="/" className={linkCls}>Courses</Link>
          <Link to="/upload" className={linkCls}>Upload</Link>
          <Link to="/about" className={linkCls}>About</Link>
          {isAdmin && <Link to="/admin" className={linkCls}>Review</Link>}
          {user ? (
            <button
              className={linkCls}
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
            >
              Sign out
            </button>
          ) : (
            <Link to="/auth" className={linkCls}>Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

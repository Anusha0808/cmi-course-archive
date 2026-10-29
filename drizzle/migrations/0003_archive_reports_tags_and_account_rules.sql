ALTER TABLE public.resources ADD COLUMN section text NOT NULL DEFAULT 'course' CHECK (section IN ('course', 'miscellaneous'));
ALTER TABLE public.resources ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
CREATE TABLE public.resource_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
 reporter_id uuid NOT NULL,
 reason text NOT NULL CHECK (reason IN ('spam', 'scam')),
 details text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'removed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (resource_id, reporter_id)
);
GRANT SELECT, INSERT ON public.resource_reports TO authenticated;
GRANT UPDATE ON public.resource_reports TO authenticated;
GRANT ALL ON public.resource_reports TO service_role;
ALTER TABLE public.resource_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reporters read own reports" ON public.resource_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY "verified users report visible resources" ON public.resource_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND status = 'open' AND EXISTS (SELECT 1 FROM public.resources WHERE id = resource_id));
CREATE POLICY "moderators read reports" ON public.resource_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "moderators resolve reports" ON public.resource_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.archive_email_allowed(email text) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$ SELECT lower(btrim(email)) ~ '^[^@[:space:]]+@cmi\.ac\.in$' OR lower(btrim(email)) = 'anuzrella@gmail.com' $$;
CREATE OR REPLACE FUNCTION public.enforce_archive_email() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN IF NOT public.archive_email_allowed(NEW.email) THEN RAISE EXCEPTION 'Use your @cmi.ac.in email address. Only the designated moderator Gmail is allowed.'; END IF; RETURN NEW; END $$;
CREATE TRIGGER archive_email_allowlist BEFORE INSERT OR UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.enforce_archive_email();
CREATE OR REPLACE FUNCTION public.handle_new_user_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN IF lower(NEW.email) = 'anuzrella@gmail.com' AND NEW.email_confirmed_at IS NOT NULL THEN INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT (user_id, role) DO NOTHING; END IF; RETURN NEW; END $$;
CREATE TRIGGER archive_verified_moderator AFTER UPDATE OF email_confirmed_at, email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles r JOIN auth.users u ON u.id = r.user_id WHERE r.user_id = _user_id AND r.role = _role AND public.archive_email_allowed(u.email) AND u.email_confirmed_at IS NOT NULL AND (_role <> 'admin' OR lower(u.email) = 'anuzrella@gmail.com')) $$;
INSERT INTO public.user_roles (user_id, role) SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'anuzrella@gmail.com' AND email_confirmed_at IS NOT NULL ON CONFLICT (user_id, role) DO NOTHING;
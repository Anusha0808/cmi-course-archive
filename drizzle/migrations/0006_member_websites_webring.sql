CREATE TABLE public.member_websites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
 title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
 url text NOT NULL CHECK (char_length(url) <= 2048 AND url ~ '^https?://[^[:space:]/@]+([/?#][^[:space:]]*)?$'),
 description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 300),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.member_websites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_websites TO authenticated;
GRANT ALL ON public.member_websites TO service_role;
ALTER TABLE public.member_websites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public website directory" ON public.member_websites FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Members add their own website" ON public.member_websites FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Members edit their own website" ON public.member_websites FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Members remove their own website" ON public.member_websites FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Moderators remove unsafe websites" ON public.member_websites FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE FUNCTION public.validate_member_website() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.owner_id IS DISTINCT FROM auth.uid() OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL AND public.archive_email_allowed(email)) THEN
 RAISE EXCEPTION 'Only verified archive members can share their own website';
 END IF;
 IF TG_OP = 'UPDATE' AND (NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.id IS DISTINCT FROM OLD.id OR NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
 RAISE EXCEPTION 'Website membership cannot be reassigned';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER validate_member_website BEFORE INSERT OR UPDATE ON public.member_websites FOR EACH ROW EXECUTE FUNCTION public.validate_member_website();
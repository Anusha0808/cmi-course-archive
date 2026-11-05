CREATE TABLE public.course_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL CHECK (char_length(code) BETWEEN 1 AND 20),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 150),
  subject text NOT NULL,
  requested_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.course_requests TO authenticated;
GRANT ALL ON public.course_requests TO service_role;
ALTER TABLE public.course_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read" ON public.course_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users request" ON public.course_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid() AND status = 'pending');
CREATE POLICY "admin update" ON public.course_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.resources ADD COLUMN course_request_id uuid REFERENCES public.course_requests(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.approve_course_request(_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.course_requests; cid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Only moderators can approve course requests'; END IF;
  SELECT * INTO r FROM public.course_requests WHERE id = _id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  SELECT id INTO cid FROM public.courses WHERE upper(code) = upper(r.code);
  IF cid IS NULL THEN
    INSERT INTO public.courses (code, name, subject) VALUES (upper(r.code), r.name, r.subject) RETURNING id INTO cid;
  END IF;
  UPDATE public.resources SET course_id = cid WHERE course_request_id = _id;
  UPDATE public.course_requests SET status = 'approved' WHERE id = _id;
  RETURN cid;
END $$;
REVOKE ALL ON FUNCTION public.approve_course_request(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.approve_course_request(uuid) TO authenticated;
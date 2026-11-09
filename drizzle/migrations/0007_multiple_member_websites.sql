ALTER TABLE public.member_websites DROP CONSTRAINT member_websites_owner_id_key;
CREATE INDEX member_websites_owner_id_idx ON public.member_websites (owner_id);
COMMENT ON TABLE public.member_websites IS 'Personal websites in the CMI webring. Members may own multiple listings; verified-owner triggers and RLS govern every listing.';
-- Only the owner administers the team, invitations and company settings.
-- (Role changes go through set_member_role; this covers invite/remove/rename.)
CREATE OR REPLACE FUNCTION public.is_company_admin(cid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = cid AND user_id = auth.uid() AND role = 'owner'
  );
$$;

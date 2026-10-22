-- Invite-only joining: once a workspace exists, a signed-in user can no longer
-- create their own. They must be invited (handle_new_user / accept_invitations
-- place them in the inviter's company). create_company still bootstraps the very
-- first workspace, and returns the existing one for members (idempotent).
CREATE OR REPLACE FUNCTION public.create_company(p_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM public.company_members WHERE user_id = uid) THEN
    RETURN (SELECT company_id FROM public.company_members WHERE user_id = uid ORDER BY created_at LIMIT 1);
  END IF;
  IF EXISTS (SELECT 1 FROM public.companies) THEN
    RAISE EXCEPTION 'Joining is invite-only. Ask your workspace owner to invite your email.';
  END IF;
  INSERT INTO public.companies (name, created_by)
    VALUES (COALESCE(NULLIF(trim(p_name), ''), 'My Company'), uid) RETURNING id INTO cid;
  INSERT INTO public.company_members (company_id, user_id, role, title, color_id)
    VALUES (cid, uid, 'owner', 'Owner', 'p1');
  RETURN cid;
END;
$$;

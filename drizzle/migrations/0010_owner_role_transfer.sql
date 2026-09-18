-- Only the company owner may change roles. Setting someone to 'owner' transfers
-- ownership: the current owner is demoted to manager, so there is always exactly
-- one owner and the previous owner loses the ability to change roles.
CREATE OR REPLACE FUNCTION public.set_member_role(p_member_id uuid, p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  cid uuid;
  target_uid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF p_role NOT IN ('owner', 'manager', 'contributor', 'viewer') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;

  SELECT company_id, user_id INTO cid, target_uid
  FROM public.company_members WHERE id = p_member_id;
  IF cid IS NULL THEN RAISE EXCEPTION 'member not found'; END IF;

  -- Caller must be the owner of that company.
  IF NOT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = cid AND user_id = uid AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'only the owner can change roles';
  END IF;

  IF p_role = 'owner' THEN
    -- Transfer ownership: demote every current owner, then promote the target.
    UPDATE public.company_members SET role = 'manager'
      WHERE company_id = cid AND role = 'owner';
    UPDATE public.company_members SET role = 'owner' WHERE id = p_member_id;
  ELSE
    -- The owner can't demote themselves directly (would leave no owner);
    -- they must hand ownership to someone else instead.
    IF target_uid = uid THEN
      RAISE EXCEPTION 'transfer ownership to someone else before changing your own role';
    END IF;
    UPDATE public.company_members SET role = p_role WHERE id = p_member_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_member_role(uuid, text) TO authenticated;

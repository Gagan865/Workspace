-- Let teammates read each other's basic profile (name/email) so the member list
-- and task assignees can show real people. Writes stay self-only.

CREATE OR REPLACE FUNCTION public.shares_company(other uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members a
    JOIN public.company_members b ON a.company_id = b.company_id
    WHERE a.user_id = auth.uid() AND b.user_id = other
  );
$$;
GRANT EXECUTE ON FUNCTION public.shares_company(uuid) TO authenticated;

CREATE POLICY "read co-member profiles" ON public.profiles FOR SELECT TO authenticated
  USING (shares_company(id));

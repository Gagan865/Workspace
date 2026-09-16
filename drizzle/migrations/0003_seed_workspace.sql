CREATE OR REPLACE FUNCTION public.seed_workspace()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  m_riya uuid; m_adam uuid; m_jo uuid; m_dana uuid;
  proj uuid;
  s1 uuid; s2 uuid; s3 uuid; s4 uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM public.projects WHERE owner_id = uid) THEN RETURN; END IF;

  INSERT INTO public.reminder_settings (user_id) VALUES (uid) ON CONFLICT DO NOTHING;
  DELETE FROM public.members WHERE owner_id = uid;

  INSERT INTO public.members (owner_id, name, email, title, role, color_id) VALUES
    (uid, 'Riya Sharma', 'riya@company.com', 'Ops Lead', 'manager', 'p8') RETURNING id INTO m_riya;
  INSERT INTO public.members (owner_id, name, email, title, role, color_id) VALUES
    (uid, 'Adam Moore', 'adam@company.com', 'Designer', 'contributor', 'p3') RETURNING id INTO m_adam;
  INSERT INTO public.members (owner_id, name, email, title, role, color_id) VALUES
    (uid, 'Jo Kim', 'jo@company.com', 'People Partner', 'manager', 'p5') RETURNING id INTO m_jo;
  INSERT INTO public.members (owner_id, name, email, title, role, color_id) VALUES
    (uid, 'Dana Nkosi', 'dana@company.com', 'Product', 'owner', 'p11') RETURNING id INTO m_dana;

  -- Warehouse Revamp
  INSERT INTO public.projects (owner_id, name) VALUES (uid, 'Warehouse Revamp') RETURNING id INTO proj;
  INSERT INTO public.stages (owner_id, project_id, label, position) VALUES (uid, proj, 'Backlog', 0) RETURNING id INTO s1;
  INSERT INTO public.stages (owner_id, project_id, label, position) VALUES (uid, proj, 'To Do', 1) RETURNING id INTO s2;
  INSERT INTO public.stages (owner_id, project_id, label, position) VALUES (uid, proj, 'In Progress', 2) RETURNING id INTO s3;
  INSERT INTO public.stages (owner_id, project_id, label, position) VALUES (uid, proj, 'Done', 3) RETURNING id INTO s4;
  INSERT INTO public.tasks (owner_id, project_id, stage_id, title, description, tag, member_id, due, priority, logged, remaining) VALUES
    (uid, proj, s1, 'Vendor consolidation study', 'Compare the three shortlisted suppliers on cost and lead time.', 'Ops', m_riya, '2026-10-02', 'medium', 3, 9),
    (uid, proj, s3, 'Warehouse dashboard v2', 'Live stock levels with alerts for low-inventory SKUs.', 'Product', m_dana, '2026-09-19', 'high', 14, 6),
    (uid, proj, s3, 'Annual security review', 'Access audit across all internal tools and shared drives.', 'IT', m_riya, '2026-09-22', 'medium', 8, 4);

  -- Brand Refresh
  INSERT INTO public.projects (owner_id, name) VALUES (uid, 'Brand Refresh') RETURNING id INTO proj;
  INSERT INTO public.stages (owner_id, project_id, label, position) VALUES (uid, proj, 'Backlog', 0) RETURNING id INTO s1;
  INSERT INTO public.stages (owner_id, project_id, label, position) VALUES (uid, proj, 'To Do', 1) RETURNING id INTO s2;
  INSERT INTO public.stages (owner_id, project_id, label, position) VALUES (uid, proj, 'In Progress', 2) RETURNING id INTO s3;
  INSERT INTO public.stages (owner_id, project_id, label, position) VALUES (uid, proj, 'Done', 3) RETURNING id INTO s4;
  INSERT INTO public.tasks (owner_id, project_id, stage_id, title, description, tag, member_id, due, priority, logged, remaining) VALUES
    (uid, proj, s1, 'Brand refresh guidelines', 'Document logo usage, colour and type for the new identity.', 'Brand', m_adam, '2026-10-09', 'low', 0, 16),
    (uid, proj, s2, 'Customer onboarding audit', 'Walk the first-week journey and log every friction point.', 'Growth', m_adam, '2026-09-29', 'medium', 2, 10);

  -- Q4 Hiring
  INSERT INTO public.projects (owner_id, name) VALUES (uid, 'Q4 Hiring') RETURNING id INTO proj;
  INSERT INTO public.stages (owner_id, project_id, label, position) VALUES (uid, proj, 'Backlog', 0) RETURNING id INTO s1;
  INSERT INTO public.stages (owner_id, project_id, label, position) VALUES (uid, proj, 'To Do', 1) RETURNING id INTO s2;
  INSERT INTO public.stages (owner_id, project_id, label, position) VALUES (uid, proj, 'In Progress', 2) RETURNING id INTO s3;
  INSERT INTO public.stages (owner_id, project_id, label, position) VALUES (uid, proj, 'Done', 3) RETURNING id INTO s4;
  INSERT INTO public.tasks (owner_id, project_id, stage_id, title, description, tag, member_id, due, priority, logged, remaining) VALUES
    (uid, proj, s2, 'Q4 hiring plan', 'Headcount, levels and budget for two new squads.', 'People', m_jo, '2026-09-24', 'high', 4, 6),
    (uid, proj, s4, 'Partner contract renewal', 'Signed and filed with legal.', 'Legal', m_jo, '2026-09-12', 'low', 6, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_workspace() TO authenticated;

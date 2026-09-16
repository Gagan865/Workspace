-- Multi-tenant companies + memberships + invitations, membership-based RLS,
-- and a private per-user planner. Migrates the existing single-owner data into
-- one company owned by the current sole user; demo members are dropped.

-- ============================================================
-- 1. Core team tables
-- ============================================================
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'contributor',
  title text NOT NULL DEFAULT '',
  color_id text NOT NULL DEFAULT 'p1',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
CREATE INDEX ON public.company_members (user_id);
CREATE INDEX ON public.company_members (company_id);

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'contributor',
  title text NOT NULL DEFAULT '',
  color_id text NOT NULL DEFAULT 'p1',
  invited_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (company_id, email)
);
CREATE INDEX ON public.invitations (lower(email));

-- ============================================================
-- 2. Helper functions (SECURITY DEFINER -> bypass RLS, so membership
--    checks inside policies never recurse into the same table)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_company_member(cid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = cid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(cid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = cid AND user_id = auth.uid() AND role IN ('owner','manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT company_id FROM public.company_members
  WHERE user_id = auth.uid()
  ORDER BY created_at
  LIMIT 1;
$$;

-- ============================================================
-- 3. RLS for the team tables
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies, public.company_members, public.invitations TO authenticated;
GRANT ALL ON public.companies, public.company_members, public.invitations TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own company" ON public.companies FOR SELECT TO authenticated
  USING (is_company_member(id));
CREATE POLICY "create company" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "admin update company" ON public.companies FOR UPDATE TO authenticated
  USING (is_company_admin(id)) WITH CHECK (is_company_admin(id));

CREATE POLICY "read co-members" ON public.company_members FOR SELECT TO authenticated
  USING (is_company_member(company_id));
CREATE POLICY "admin manage members" ON public.company_members FOR ALL TO authenticated
  USING (is_company_admin(company_id)) WITH CHECK (is_company_admin(company_id));
CREATE POLICY "update own membership" ON public.company_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin manage invitations" ON public.invitations FOR ALL TO authenticated
  USING (is_company_admin(company_id)) WITH CHECK (is_company_admin(company_id));

-- ============================================================
-- 4. Add company_id to the shared (company-wide) tables
-- ============================================================
ALTER TABLE public.projects           ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.stages             ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.tasks              ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.task_updates       ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.quotes             ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.quote_items        ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.agreements         ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.payment_milestones ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- ============================================================
-- 5. Migrate existing single-owner data into one company
-- ============================================================
DO $$
DECLARE u uuid; cnt int; cid uuid;
BEGIN
  SELECT count(*) INTO cnt FROM auth.users;
  IF cnt = 1 THEN
    SELECT id INTO u FROM auth.users LIMIT 1;
    INSERT INTO public.companies (name, created_by) VALUES ('My Company', u) RETURNING id INTO cid;
    INSERT INTO public.company_members (company_id, user_id, role, title, color_id)
      VALUES (cid, u, 'owner', 'Owner', 'p1');
    UPDATE public.projects           SET company_id = cid WHERE owner_id = u;
    UPDATE public.stages             SET company_id = cid WHERE owner_id = u;
    UPDATE public.tasks              SET company_id = cid WHERE owner_id = u;
    UPDATE public.task_updates       SET company_id = cid WHERE owner_id = u;
    UPDATE public.quotes             SET company_id = cid WHERE owner_id = u;
    UPDATE public.quote_items        SET company_id = cid WHERE owner_id = u;
    UPDATE public.agreements         SET company_id = cid WHERE owner_id = u;
    UPDATE public.payment_milestones SET company_id = cid WHERE owner_id = u;
  END IF;
END $$;

-- ============================================================
-- 6. Assignees become real company members; drop the demo members
-- ============================================================
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_member_id_fkey;
UPDATE public.tasks SET member_id = NULL;   -- demo assignees are not real logins
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES public.company_members(id) ON DELETE SET NULL;

DROP FUNCTION IF EXISTS public.seed_workspace();
DROP TABLE IF EXISTS public.members;

-- ============================================================
-- 7. Default company_id to the caller's company; enforce not-null
-- ============================================================
ALTER TABLE public.projects           ALTER COLUMN company_id SET DEFAULT current_company_id();
ALTER TABLE public.stages             ALTER COLUMN company_id SET DEFAULT current_company_id();
ALTER TABLE public.tasks              ALTER COLUMN company_id SET DEFAULT current_company_id();
ALTER TABLE public.task_updates       ALTER COLUMN company_id SET DEFAULT current_company_id();
ALTER TABLE public.quotes             ALTER COLUMN company_id SET DEFAULT current_company_id();
ALTER TABLE public.quote_items        ALTER COLUMN company_id SET DEFAULT current_company_id();
ALTER TABLE public.agreements         ALTER COLUMN company_id SET DEFAULT current_company_id();
ALTER TABLE public.payment_milestones ALTER COLUMN company_id SET DEFAULT current_company_id();

ALTER TABLE public.projects           ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.stages             ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.tasks              ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.task_updates       ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.quotes             ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.quote_items        ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.agreements         ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.payment_milestones ALTER COLUMN company_id SET NOT NULL;

CREATE INDEX ON public.projects (company_id);
CREATE INDEX ON public.stages (company_id);
CREATE INDEX ON public.tasks (company_id);
CREATE INDEX ON public.quotes (company_id);
CREATE INDEX ON public.agreements (company_id);

-- ============================================================
-- 8. Swap shared tables from owner-based to membership-based RLS
-- ============================================================
DROP POLICY IF EXISTS "own rows" ON public.projects;
DROP POLICY IF EXISTS "own rows" ON public.stages;
DROP POLICY IF EXISTS "own rows" ON public.tasks;
DROP POLICY IF EXISTS "own rows" ON public.task_updates;
DROP POLICY IF EXISTS "own rows" ON public.quotes;
DROP POLICY IF EXISTS "own rows" ON public.quote_items;
DROP POLICY IF EXISTS "own rows" ON public.agreements;
DROP POLICY IF EXISTS "own rows" ON public.payment_milestones;

CREATE POLICY "company rows" ON public.projects FOR ALL TO authenticated
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
CREATE POLICY "company rows" ON public.stages FOR ALL TO authenticated
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
CREATE POLICY "company rows" ON public.tasks FOR ALL TO authenticated
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
CREATE POLICY "company rows" ON public.task_updates FOR ALL TO authenticated
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
CREATE POLICY "company rows" ON public.quotes FOR ALL TO authenticated
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
CREATE POLICY "company rows" ON public.quote_items FOR ALL TO authenticated
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
CREATE POLICY "company rows" ON public.agreements FOR ALL TO authenticated
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));
CREATE POLICY "company rows" ON public.payment_milestones FOR ALL TO authenticated
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));

-- ============================================================
-- 9. Private per-user planner (never shared; not company-scoped)
-- ============================================================
CREATE TABLE public.planner_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT current_date,
  notes text NOT NULL DEFAULT '',
  water int NOT NULL DEFAULT 0,
  rating int NOT NULL DEFAULT 0,
  schedule jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);

CREATE TABLE public.planner_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT current_date,
  kind text NOT NULL,                       -- 'priority' | 'todo' | 'contact' | 'expense'
  text text NOT NULL DEFAULT '',
  done boolean NOT NULL DEFAULT false,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,   -- contacts: {"kind":"call"} ; expenses: {"amount":"4.50"}
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.planner_items (user_id, day);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_days, public.planner_items TO authenticated;
GRANT ALL ON public.planner_days, public.planner_items TO service_role;
ALTER TABLE public.planner_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own planner days" ON public.planner_days FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own planner items" ON public.planner_items FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 10. Signup: create profile + settings and auto-accept invites; never a company
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.reminder_settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  -- Auto-join any company that invited this email.
  INSERT INTO public.company_members (company_id, user_id, role, title, color_id)
  SELECT i.company_id, NEW.id, i.role, i.title, i.color_id
  FROM public.invitations i
  WHERE lower(i.email) = lower(NEW.email) AND i.accepted_at IS NULL
  ON CONFLICT (company_id, user_id) DO NOTHING;

  UPDATE public.invitations SET accepted_at = now()
  WHERE lower(email) = lower(NEW.email) AND accepted_at IS NULL;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 11. RPCs: create a company (first run) / accept invites (existing users)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_company(p_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM public.company_members WHERE user_id = uid) THEN
    RETURN (SELECT company_id FROM public.company_members WHERE user_id = uid ORDER BY created_at LIMIT 1);
  END IF;
  INSERT INTO public.companies (name, created_by)
    VALUES (COALESCE(NULLIF(trim(p_name), ''), 'My Company'), uid) RETURNING id INTO cid;
  INSERT INTO public.company_members (company_id, user_id, role, title, color_id)
    VALUES (cid, uid, 'owner', 'Owner', 'p1');
  RETURN cid;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_invitations()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); em text := lower(auth.jwt() ->> 'email'); n int := 0;
BEGIN
  IF uid IS NULL OR em IS NULL THEN RETURN 0; END IF;
  INSERT INTO public.company_members (company_id, user_id, role, title, color_id)
  SELECT i.company_id, uid, i.role, i.title, i.color_id
  FROM public.invitations i
  WHERE lower(i.email) = em AND i.accepted_at IS NULL
  ON CONFLICT (company_id, user_id) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE public.invitations SET accepted_at = now() WHERE lower(email) = em AND accepted_at IS NULL;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_company_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_company(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitations() TO authenticated;

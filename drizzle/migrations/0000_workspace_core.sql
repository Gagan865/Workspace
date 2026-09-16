-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.reminder_settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Members
CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'contributor',
  color_id text NOT NULL DEFAULT 'p1',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Quotes
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  number text NOT NULL DEFAULT '',
  client_name text NOT NULL DEFAULT '',
  client_company text NOT NULL DEFAULT '',
  client_email text NOT NULL DEFAULT '',
  client_address text NOT NULL DEFAULT '',
  issue_date date,
  valid_until date,
  currency text NOT NULL DEFAULT 'USD',
  discount numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  terms text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  project_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ADD CONSTRAINT quotes_project_fk FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE TABLE public.stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label text NOT NULL,
  position int NOT NULL DEFAULT 0
);

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  tag text NOT NULL DEFAULT '',
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  due date,
  priority text NOT NULL DEFAULT 'medium',
  logged numeric NOT NULL DEFAULT 0,
  remaining numeric NOT NULL DEFAULT 0,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  last_update_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.task_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 1,
  rate numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  position int NOT NULL DEFAULT 0
);

CREATE TABLE public.agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT '',
  party_a text NOT NULL DEFAULT '',
  party_b text NOT NULL DEFAULT '',
  client_email text NOT NULL DEFAULT '',
  scope text NOT NULL DEFAULT '',
  start_date date,
  end_date date,
  fee numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  payment_schedule text NOT NULL DEFAULT '',
  clauses jsonb NOT NULL DEFAULT '[]'::jsonb,
  signature_a text NOT NULL DEFAULT '',
  signature_b text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  label text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  due_date date,
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE CASCADE,
  agreement_id uuid REFERENCES public.agreements(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reminder_settings (
  user_id uuid PRIMARY KEY,
  daily_enabled boolean NOT NULL DEFAULT true,
  daily_time text NOT NULL DEFAULT '18:00',
  payment_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  due_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.payment_milestones(id) ON DELETE CASCADE,
  dedupe_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, dedupe_key)
);

CREATE TABLE public.job_state (
  name text PRIMARY KEY,
  paused boolean NOT NULL DEFAULT false,
  failures int NOT NULL DEFAULT 0,
  lease_until timestamptz,
  last_run_at timestamptz,
  last_error text
);
GRANT SELECT ON public.job_state TO authenticated;
GRANT ALL ON public.job_state TO service_role;
ALTER TABLE public.job_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no client writes" ON public.job_state FOR SELECT TO authenticated USING (true);
INSERT INTO public.job_state (name) VALUES ('reminders');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.members, public.projects, public.stages, public.tasks,
  public.task_updates, public.quotes, public.quote_items, public.agreements,
  public.payment_milestones, public.reminders TO authenticated;
GRANT ALL ON public.members, public.projects, public.stages, public.tasks,
  public.task_updates, public.quotes, public.quote_items, public.agreements,
  public.payment_milestones, public.reminders TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.reminder_settings TO authenticated;
GRANT ALL ON public.reminder_settings TO service_role;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows" ON public.members FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own rows" ON public.projects FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own rows" ON public.stages FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own rows" ON public.tasks FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own rows" ON public.task_updates FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own rows" ON public.quotes FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own rows" ON public.quote_items FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own rows" ON public.agreements FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own rows" ON public.payment_milestones FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own rows" ON public.reminders FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own settings" ON public.reminder_settings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX ON public.tasks (project_id);
CREATE INDEX ON public.stages (project_id);
CREATE INDEX ON public.reminders (status, due_at);

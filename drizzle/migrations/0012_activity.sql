-- Company activity feed: who did what, for the Notifications section.
CREATE TABLE public.activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL DEFAULT '',
  entity text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  project_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.activity (company_id, created_at DESC);

GRANT SELECT, INSERT ON public.activity TO authenticated;
GRANT ALL ON public.activity TO service_role;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read company activity" ON public.activity FOR SELECT TO authenticated
  USING (is_company_member(company_id));
CREATE POLICY "insert own activity" ON public.activity FOR INSERT TO authenticated
  WITH CHECK (is_company_member(company_id) AND actor_id = auth.uid());

-- Enable Supabase Realtime for live notifications.
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity;

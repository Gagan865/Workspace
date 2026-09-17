-- Projects are either software or business; business projects get a leads tracker.
ALTER TABLE public.projects ADD COLUMN kind text NOT NULL DEFAULT 'business';

-- One row per project per day holding that day's lead count.
CREATE TABLE public.lead_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT current_date,
  count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, day)
);
CREATE INDEX ON public.lead_counts (company_id);
CREATE INDEX ON public.lead_counts (project_id, day);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_counts TO authenticated;
GRANT ALL ON public.lead_counts TO service_role;
ALTER TABLE public.lead_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company rows" ON public.lead_counts FOR ALL TO authenticated
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));

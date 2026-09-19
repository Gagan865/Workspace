import { supabase } from "@/integrations/supabase/client";

export type Activity = {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  summary: string;
  projectId: string | null;
  createdAt: string;
};

type ActivityRow = {
  id: string;
  actor_id: string;
  action: string;
  entity: string;
  summary: string;
  project_id: string | null;
  created_at: string;
};

export function mapActivity(r: ActivityRow): Activity {
  return {
    id: r.id,
    actorId: r.actor_id,
    action: r.action,
    entity: r.entity,
    summary: r.summary,
    projectId: r.project_id ?? null,
    createdAt: r.created_at,
  };
}

// Fire-and-forget: record a company activity. company_id and actor_id default
// server-side (current company + auth.uid()).
export function logActivity(a: {
  action: string;
  entity: string;
  summary: string;
  projectId?: string | null;
}) {
  void supabase
    .from("activity")
    .insert({ action: a.action, entity: a.entity, summary: a.summary, project_id: a.projectId ?? null });
}

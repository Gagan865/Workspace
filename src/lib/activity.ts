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

export type ActivityInput = {
  action: string;
  entity: string;
  summary: string;
  projectId?: string | null;
};

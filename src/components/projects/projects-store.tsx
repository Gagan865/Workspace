import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";

import {
  defaultStages,
  nextColorId,
  type Invite,
  type LeadDay,
  type Member,
  type PersonColorId,
  type Project,
  type ProjectKind,
  type Stage,
  type Task,
  type TeamRole,
} from "./types";

type Store = {
  ready: boolean;
  hasCompany: boolean;
  companyId: string | null;
  companyName: string;
  myRole: TeamRole | null;
  isAdmin: boolean;
  projects: Project[];
  members: Member[];
  invites: Invite[];
  tasks: Task[];
  leadDays: LeadDay[];
  createCompany: (name: string) => Promise<void>;
  renameCompany: (name: string) => Promise<void>;
  addProject: (name: string, kind?: ProjectKind) => Promise<Project | null>;
  setProjectKind: (id: string, kind: ProjectKind) => Promise<void>;
  setLeadCount: (projectId: string, day: string, count: number) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  setProjectStages: (id: string, stages: Stage[], removedStageId?: string) => Promise<void>;
  inviteMember: (invite: Omit<Invite, "id">) => Promise<void>;
  cancelInvite: (id: string) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  setMemberColor: (id: string, colorId: PersonColorId) => Promise<void>;
  saveTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, stageId: string) => Promise<void>;
  logTaskUpdate: (taskId: string, note: string) => Promise<void>;
  freeColorId: () => PersonColorId;
  refresh: () => Promise<void>;
};

const ProjectsContext = createContext<Store | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [myRole, setMyRole] = useState<TeamRole | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leadDays, setLeadDays] = useState<LeadDay[]>([]);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const myId = userData.user?.id;
    if (!myId) return;

    // Pick up any invitation issued to this email while I already had an account.
    await supabase.rpc("accept_invitations");

    const { data: memberRows } = await supabase.from("company_members").select("*");
    if (!memberRows || memberRows.length === 0) {
      setCompanyId(null);
      setCompanyName("");
      setMyRole(null);
      setProjects([]);
      setMembers([]);
      setInvites([]);
      setTasks([]);
      setLeadDays([]);
      return;
    }

    const cid = memberRows.find((m) => m.user_id === myId)?.company_id ?? memberRows[0]!.company_id;
    setCompanyId(cid);
    setMyRole((memberRows.find((m) => m.user_id === myId)?.role ?? null) as TeamRole | null);

    const [companyRes, profileRes, inviteRes, projectRes, stageRes, taskRes, leadRes] = await Promise.all([
      supabase.from("companies").select("*").eq("id", cid).maybeSingle(),
      supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", memberRows.map((m) => m.user_id)),
      supabase.from("invitations").select("*").is("accepted_at", null),
      supabase.from("projects").select("*").order("created_at"),
      supabase.from("stages").select("*").order("position"),
      supabase.from("tasks").select("*").order("created_at"),
      supabase.from("lead_counts").select("*").order("day"),
    ]);

    setCompanyName(companyRes.data?.name ?? "");

    const profiles = profileRes.data ?? [];
    setMembers(
      memberRows.map((m) => {
        const p = profiles.find((x) => x.id === m.user_id);
        return {
          id: m.id,
          userId: m.user_id,
          name: p?.display_name || p?.email || "Teammate",
          email: p?.email || "",
          title: m.title,
          role: m.role as TeamRole,
          colorId: m.color_id as PersonColorId,
        };
      }),
    );

    setInvites(
      (inviteRes.data ?? []).map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role as TeamRole,
        title: i.title,
        colorId: i.color_id as PersonColorId,
      })),
    );

    const stages = stageRes.data ?? [];
    setProjects(
      (projectRes.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        kind: ((p as { kind?: string }).kind as ProjectKind) ?? "business",
        quoteId: p.quote_id ?? undefined,
        stages: stages
          .filter((s) => s.project_id === p.id)
          .map((s) => ({ id: s.id, label: s.label })),
      })),
    );
    setLeadDays(
      (leadRes.data ?? []).map((l) => ({
        projectId: l.project_id,
        day: l.day,
        count: Number(l.count),
      })),
    );
    setTasks(
      (taskRes.data ?? []).map((t) => ({
        id: t.id,
        projectId: t.project_id,
        stageId: t.stage_id,
        title: t.title,
        description: t.description,
        tag: t.tag,
        ownerId: t.member_id ?? "",
        due: t.due ?? "",
        priority: t.priority as Task["priority"],
        logged: Number(t.logged),
        remaining: Number(t.remaining),
        lastUpdateAt: t.last_update_at,
      })),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await load();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const isAdmin = myRole === "owner" || myRole === "manager";

  const value = useMemo<Store>(
    () => ({
      ready,
      hasCompany: companyId !== null,
      companyId,
      companyName,
      myRole,
      isAdmin,
      projects,
      members,
      invites,
      tasks,
      leadDays,
      refresh: async () => {
        await load();
      },
      createCompany: async (name) => {
        await supabase.rpc("create_company", { p_name: name });
        await load();
      },
      renameCompany: async (name) => {
        if (!companyId) return;
        setCompanyName(name);
        await supabase.from("companies").update({ name }).eq("id", companyId);
      },
      addProject: async (name, kind = "business") => {
        const { data: row } = await supabase
          .from("projects")
          .insert({ name, kind })
          .select()
          .single();
        if (!row) return null;
        const { data: stageRows } = await supabase
          .from("stages")
          .insert(
            defaultStages().map((s, index) => ({
              project_id: row.id,
              label: s.label,
              position: index,
            })),
          )
          .select();
        const project: Project = {
          id: row.id,
          name: row.name,
          kind: ((row as { kind?: string }).kind as ProjectKind) ?? kind,
          stages: (stageRows ?? [])
            .sort((a, b) => a.position - b.position)
            .map((s) => ({ id: s.id, label: s.label })),
        };
        setProjects((prev) => [...prev, project]);
        return project;
      },
      setProjectKind: async (id, kind) => {
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, kind } : p)));
        await supabase.from("projects").update({ kind }).eq("id", id);
      },
      setLeadCount: async (projectId, day, count) => {
        setLeadDays((prev) => {
          const idx = prev.findIndex((l) => l.projectId === projectId && l.day === day);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { projectId, day, count };
            return next;
          }
          return [...prev, { projectId, day, count }];
        });
        await supabase
          .from("lead_counts")
          .upsert({ project_id: projectId, day, count }, { onConflict: "project_id,day" });
      },
      renameProject: async (id, name) => {
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
        await supabase.from("projects").update({ name }).eq("id", id);
      },
      removeProject: async (id) => {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setTasks((prev) => prev.filter((t) => t.projectId !== id));
        await supabase.from("projects").delete().eq("id", id);
      },
      setProjectStages: async (id, stages, removedStageId) => {
        const project = projects.find((p) => p.id === id);
        const existing = project?.stages ?? [];
        const kept = stages.filter((s) => existing.some((e) => e.id === s.id));
        const added = stages.filter((s) => !existing.some((e) => e.id === s.id));
        const removed = existing.filter((e) => !stages.some((s) => s.id === e.id));

        for (const stage of kept) {
          await supabase
            .from("stages")
            .update({ label: stage.label, position: stages.indexOf(stage) })
            .eq("id", stage.id);
        }
        let inserted: Stage[] = [];
        if (added.length) {
          const { data } = await supabase
            .from("stages")
            .insert(
              added.map((s) => ({
                project_id: id,
                label: s.label,
                position: stages.indexOf(s),
              })),
            )
            .select();
          inserted = (data ?? []).map((s) => ({ id: s.id, label: s.label }));
        }
        const fallback = kept[0]?.id ?? inserted[0]?.id;
        if (removedStageId && fallback) {
          await supabase.from("tasks").update({ stage_id: fallback }).eq("stage_id", removedStageId);
        }
        for (const stage of removed) {
          await supabase.from("stages").delete().eq("id", stage.id);
        }
        await load();
      },
      inviteMember: async (invite) => {
        if (!companyId) return;
        await supabase.from("invitations").insert({
          company_id: companyId,
          email: invite.email.trim().toLowerCase(),
          role: invite.role,
          title: invite.title,
          color_id: invite.colorId,
        });
        await load();
      },
      cancelInvite: async (id) => {
        setInvites((prev) => prev.filter((i) => i.id !== id));
        await supabase.from("invitations").delete().eq("id", id);
      },
      removeMember: async (id) => {
        // Unassign this person's tasks, then remove their membership (admin only, per RLS).
        setMembers((prev) => prev.filter((m) => m.id !== id));
        setTasks((prev) => prev.map((t) => (t.ownerId === id ? { ...t, ownerId: "" } : t)));
        await supabase.from("tasks").update({ member_id: null }).eq("member_id", id);
        await supabase.from("company_members").delete().eq("id", id);
      },
      setMemberColor: async (id, colorId) => {
        setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, colorId } : m)));
        await supabase.from("company_members").update({ color_id: colorId }).eq("id", id);
      },
      saveTask: async (task) => {
        const payload = {
          project_id: task.projectId,
          stage_id: task.stageId,
          title: task.title,
          description: task.description,
          tag: task.tag,
          member_id: task.ownerId || null,
          due: task.due || null,
          priority: task.priority,
          logged: task.logged,
          remaining: task.remaining,
          last_update_at: new Date().toISOString(),
        };
        if (tasks.some((t) => t.id === task.id)) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id ? { ...task, lastUpdateAt: payload.last_update_at } : t,
            ),
          );
          await supabase.from("tasks").update(payload).eq("id", task.id);
        } else {
          const { data } = await supabase.from("tasks").insert(payload).select().single();
          if (data) {
            setTasks((prev) => [...prev, { ...task, id: data.id, lastUpdateAt: data.last_update_at }]);
          }
        }
      },
      deleteTask: async (id) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        await supabase.from("tasks").delete().eq("id", id);
      },
      moveTask: async (id, stageId) => {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, stageId } : t)));
        await supabase.from("tasks").update({ stage_id: stageId }).eq("id", id);
      },
      logTaskUpdate: async (taskId, note) => {
        const now = new Date().toISOString();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, lastUpdateAt: now } : t)));
        await supabase.from("task_updates").insert({ task_id: taskId, note });
        await supabase.from("tasks").update({ last_update_at: now }).eq("id", taskId);
      },
      freeColorId: () =>
        nextColorId([...members.map((m) => m.colorId), ...invites.map((i) => i.colorId)]),
    }),
    [ready, companyId, companyName, myRole, isAdmin, projects, members, invites, tasks, leadDays, load],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used inside ProjectsProvider");
  return ctx;
}

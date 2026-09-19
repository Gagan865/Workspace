import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { logActivity, mapActivity, type Activity } from "@/lib/activity";
import { armAudio, playChime } from "@/lib/chime";
import { supabase } from "@/integrations/supabase/client";

import {
  defaultStages,
  nextColorId,
  PERSON_COLORS,
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
  isOwner: boolean;
  projects: Project[];
  members: Member[];
  invites: Invite[];
  tasks: Task[];
  leadDays: LeadDay[];
  notifications: Activity[];
  unreadCount: number;
  myUserId: string | null;
  markNotificationsSeen: () => void;
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
  setMemberRole: (id: string, role: TeamRole) => Promise<void>;
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
  const [notifications, setNotifications] = useState<Activity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const membersRef = useRef<Member[]>([]);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const myId = userData.user?.id;
    if (!myId) return;
    setMyUserId(myId);

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
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const cid = memberRows.find((m) => m.user_id === myId)?.company_id ?? memberRows[0]!.company_id;
    setCompanyId(cid);
    setMyRole((memberRows.find((m) => m.user_id === myId)?.role ?? null) as TeamRole | null);

    const [companyRes, profileRes, inviteRes, projectRes, stageRes, taskRes, leadRes, activityRes] =
      await Promise.all([
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
      supabase.from("activity").select("*").order("created_at", { ascending: false }).limit(100),
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
    setNotifications((activityRes.data ?? []).map((a) => mapActivity(a)));
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
        createdAt: t.created_at,
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

  useEffect(() => {
    armAudio();
  }, []);

  // Live notifications: play the actor's chime and bump the unread badge.
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`activity-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const a = mapActivity(payload.new as Parameters<typeof mapActivity>[0]);
          setNotifications((prev) =>
            prev.some((x) => x.id === a.id) ? prev : [a, ...prev].slice(0, 200),
          );
          if (a.actorId !== myUserId) {
            setUnreadCount((n) => n + 1);
            const member = membersRef.current.find((m) => m.userId === a.actorId);
            const seed = member ? PERSON_COLORS.findIndex((c) => c.id === member.colorId) + 1 : 1;
            playChime(seed);
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [companyId, myUserId]);

  const isAdmin = myRole === "owner" || myRole === "manager";
  const isOwner = myRole === "owner";

  const value = useMemo<Store>(
    () => ({
      ready,
      hasCompany: companyId !== null,
      companyId,
      companyName,
      myRole,
      isAdmin,
      isOwner,
      projects,
      members,
      invites,
      tasks,
      leadDays,
      notifications,
      unreadCount,
      myUserId,
      markNotificationsSeen: () => setUnreadCount(0),
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
        logActivity({
          action: "created",
          entity: "project",
          summary: `created the project “${project.name}”`,
          projectId: project.id,
        });
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
        const pname = projects.find((p) => p.id === projectId)?.name ?? "a project";
        logActivity({
          action: "updated",
          entity: "lead",
          summary: `updated leads for “${pname}” (${count} today)`,
          projectId,
        });
      },
      renameProject: async (id, name) => {
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
        await supabase.from("projects").update({ name }).eq("id", id);
      },
      removeProject: async (id) => {
        const name = projects.find((p) => p.id === id)?.name ?? "a project";
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setTasks((prev) => prev.filter((t) => t.projectId !== id));
        await supabase.from("projects").delete().eq("id", id);
        logActivity({ action: "deleted", entity: "project", summary: `deleted the project “${name}”` });
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
        logActivity({
          action: "invited",
          entity: "member",
          summary: `invited ${invite.email.trim().toLowerCase()} to the team`,
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
        const gone = members.find((m) => m.id === id)?.name ?? "a teammate";
        await supabase.from("tasks").update({ member_id: null }).eq("member_id", id);
        await supabase.from("company_members").delete().eq("id", id);
        logActivity({ action: "removed", entity: "member", summary: `removed ${gone} from the team` });
      },
      setMemberRole: async (id, role) => {
        // Owner-only, enforced by the set_member_role RPC. Setting 'owner'
        // transfers ownership and demotes the current owner.
        const who = members.find((m) => m.id === id)?.name ?? "a teammate";
        await supabase.rpc("set_member_role", { p_member_id: id, p_role: role });
        logActivity({
          action: "updated",
          entity: "member",
          summary: role === "owner" ? `made ${who} the owner` : `set ${who}'s access to ${role}`,
        });
        await load();
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
          logActivity({
            action: "updated",
            entity: "task",
            summary: `updated the task “${task.title}”`,
            projectId: task.projectId,
          });
        } else {
          const { data } = await supabase.from("tasks").insert(payload).select().single();
          if (data) {
            setTasks((prev) => [...prev, { ...task, id: data.id, lastUpdateAt: data.last_update_at }]);
            logActivity({
              action: "created",
              entity: "task",
              summary: `added the task “${task.title}”`,
              projectId: task.projectId,
            });
          }
        }
      },
      deleteTask: async (id) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        await supabase.from("tasks").delete().eq("id", id);
      },
      moveTask: async (id, stageId) => {
        const task = tasks.find((t) => t.id === id);
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, stageId } : t)));
        await supabase.from("tasks").update({ stage_id: stageId }).eq("id", id);
        logActivity({
          action: "moved",
          entity: "task",
          summary: task ? `moved the task “${task.title}” on the board` : `moved a task on the board`,
          projectId: task?.projectId ?? null,
        });
      },
      logTaskUpdate: async (taskId, note) => {
        const now = new Date().toISOString();
        const task = tasks.find((t) => t.id === taskId);
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, lastUpdateAt: now } : t)));
        await supabase.from("task_updates").insert({ task_id: taskId, note });
        await supabase.from("tasks").update({ last_update_at: now }).eq("id", taskId);
        logActivity({
          action: "updated",
          entity: "task",
          summary: task ? `posted an update on “${task.title}”` : `posted a task update`,
          projectId: task?.projectId ?? null,
        });
      },
      freeColorId: () =>
        nextColorId([...members.map((m) => m.colorId), ...invites.map((i) => i.colorId)]),
    }),
    [ready, companyId, companyName, myRole, isAdmin, isOwner, projects, members, invites, tasks, leadDays, notifications, unreadCount, myUserId, load],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used inside ProjectsProvider");
  return ctx;
}

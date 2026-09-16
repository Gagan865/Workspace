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
  SEED_MEMBERS,
  SEED_PROJECTS,
  defaultStages,
  nextColorId,
  type Member,
  type PersonColorId,
  type Project,
  type Stage,
  type Task,
} from "./types";

type Store = {
  ready: boolean;
  projects: Project[];
  members: Member[];
  tasks: Task[];
  addProject: (name: string) => Promise<Project | null>;
  renameProject: (id: string, name: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  setProjectStages: (id: string, stages: Stage[], removedStageId?: string) => Promise<void>;
  addMember: (member: Omit<Member, "id">) => Promise<void>;
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const load = useCallback(async () => {
    const [projectRes, stageRes, memberRes, taskRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at"),
      supabase.from("stages").select("*").order("position"),
      supabase.from("members").select("*").order("created_at"),
      supabase.from("tasks").select("*").order("created_at"),
    ]);

    const stages = stageRes.data ?? [];
    setProjects(
      (projectRes.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        quoteId: p.quote_id ?? undefined,
        stages: stages
          .filter((s) => s.project_id === p.id)
          .map((s) => ({ id: s.id, label: s.label })),
      })),
    );
    setMembers(
      (memberRes.data ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        title: m.title,
        role: m.role as Member["role"],
        colorId: m.color_id as PersonColorId,
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
    return { projects: projectRes.data ?? [], members: memberRes.data ?? [] };
  }, []);

  const seed = useCallback(async () => {
    await supabase.rpc("seed_workspace");
  }, []);


  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const first = await load();
      if (cancelled) return;
      if (first.projects.length === 0) {
        await seed();
        if (!cancelled) await load();
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [load, seed]);

  const value = useMemo<Store>(
    () => ({
      ready,
      projects,
      members,
      tasks,
      refresh: async () => {
        await load();
      },
      addProject: async (name) => {
        const { data: row } = await supabase.from("projects").insert({ name }).select().single();
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
          stages: (stageRows ?? [])
            .sort((a, b) => a.position - b.position)
            .map((s) => ({ id: s.id, label: s.label })),
        };
        setProjects((prev) => [...prev, project]);
        return project;
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
          await supabase
            .from("tasks")
            .update({ stage_id: fallback })
            .eq("stage_id", removedStageId);
        }
        for (const stage of removed) {
          await supabase.from("stages").delete().eq("id", stage.id);
        }
        await load();
      },
      addMember: async (member) => {
        const { data } = await supabase
          .from("members")
          .insert({
            name: member.name,
            email: member.email,
            title: member.title,
            role: member.role,
            color_id: member.colorId,
          })
          .select()
          .single();
        if (data) {
          setMembers((prev) => [
            ...prev,
            {
              id: data.id,
              name: data.name,
              email: data.email,
              title: data.title,
              role: data.role as Member["role"],
              colorId: data.color_id as PersonColorId,
            },
          ]);
        }
      },
      setMemberColor: async (id, colorId) => {
        setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, colorId } : m)));
        await supabase.from("members").update({ color_id: colorId }).eq("id", id);
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
            setTasks((prev) => [
              ...prev,
              { ...task, id: data.id, lastUpdateAt: data.last_update_at },
            ]);
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
      freeColorId: () => nextColorId(members.map((m) => m.colorId)),
    }),
    [ready, projects, members, tasks, load],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used inside ProjectsProvider");
  return ctx;
}

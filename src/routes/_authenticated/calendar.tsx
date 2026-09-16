import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useProjects } from "@/components/projects/projects-store";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Workspace" },
      {
        name: "description",
        content:
          "One timeline of task due dates, payment due dates and pending reminders, by day and time.",
      },
      { property: "og:title", content: "Calendar — Workspace" },
      {
        property: "og:description",
        content: "Task deadlines, payment dates and reminders on a single timeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

type Entry = {
  key: string;
  date: string;
  time: string;
  kind: "task" | "payment" | "reminder";
  title: string;
  detail: string;
  projectId?: string;
};

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

function CalendarPage() {
  const { tasks, projects } = useProjects();
  const [milestones, setMilestones] = useState<
    { id: string; label: string; amount: number; currency: string; due_date: string | null; paid: boolean }[]
  >([]);
  const [reminders, setReminders] = useState<
    { id: string; title: string; body: string; due_at: string; status: string }[]
  >([]);

  const load = useCallback(async () => {
    const [m, r] = await Promise.all([
      supabase.from("payment_milestones").select("*").eq("paid", false),
      supabase.from("reminders").select("*").order("due_at"),
    ]);
    setMilestones((m.data ?? []) as never);
    setReminders((r.data ?? []) as never);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = useMemo(() => {
    const out: Entry[] = [];
    for (const task of tasks) {
      if (!task.due) continue;
      out.push({
        key: `t-${task.id}`,
        date: task.due,
        time: "09:00",
        kind: "task",
        title: task.title,
        detail: projects.find((p) => p.id === task.projectId)?.name ?? "Project",
        projectId: task.projectId,
      });
    }
    for (const m of milestones) {
      if (!m.due_date) continue;
      out.push({
        key: `m-${m.id}`,
        date: m.due_date,
        time: "10:00",
        kind: "payment",
        title: m.label,
        detail: money(Number(m.amount), m.currency),
      });
    }
    for (const r of reminders) {
      const at = new Date(r.due_at);
      out.push({
        key: `r-${r.id}`,
        date: at.toISOString().slice(0, 10),
        time: at.toTimeString().slice(0, 5),
        kind: "reminder",
        title: r.title,
        detail: r.status === "sent" ? "Reminder sent" : "Reminder pending",
      });
    }
    return out.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [tasks, milestones, reminders, projects]);

  const days = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries) {
      const list = map.get(entry.date) ?? [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return [...map.entries()];
  }, [entries]);

  const tone: Record<Entry["kind"], string> = {
    task: "bg-brand-soft text-foreground",
    payment: "bg-duo-soft text-foreground",
    reminder: "bg-muted text-muted-foreground",
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <h1 className="font-display text-xl font-semibold">Calendar</h1>
      <p className="text-xs text-muted-foreground">
        Task deadlines, payment dates and reminders, by day and time.
      </p>

      <div className="mt-6 space-y-6">
        {days.map(([date, list]) => (
          <section key={date}>
            <h2 className="font-display text-sm font-semibold">{dayLabel(date)}</h2>
            <ul className="mt-2 divide-y divide-border rounded-2xl border border-border bg-card">
              {list.map((entry) => (
                <li key={entry.key} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-12 shrink-0 text-xs text-muted-foreground">{entry.time}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone[entry.kind]}`}
                  >
                    {entry.kind}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{entry.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{entry.detail}</p>
                  </div>
                  {entry.projectId ? (
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: entry.projectId }}
                      className="text-xs text-brand hover:underline"
                    >
                      Open
                    </Link>
                  ) : (
                    <Link to="/money" className="text-xs text-brand hover:underline">
                      Open
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {days.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
        )}
      </div>
    </div>
  );
}

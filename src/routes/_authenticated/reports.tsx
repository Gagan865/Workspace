import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { useProjects } from "@/components/projects/projects-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Workspace" },
      {
        name: "description",
        content:
          "Owner overview: daily, weekly and monthly summary of every project with its tasks and leads.",
      },
      { property: "og:title", content: "Reports — Workspace" },
      { property: "og:description", content: "Daily, weekly and monthly project, task and lead report." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ReportsPage,
});

type Period = "daily" | "weekly" | "monthly";
const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: "daily", label: "Daily", days: 1 },
  { id: "weekly", label: "Weekly", days: 7 },
  { id: "monthly", label: "Monthly", days: 30 },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
const dayStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ReportsPage() {
  const { ready, isAdmin, projects, tasks, leadDays } = useProjects();
  const [period, setPeriod] = useState<Period>("daily");

  const days = PERIODS.find((p) => p.id === period)!.days;

  const { start, startMs, startDay } = useMemo(() => {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    s.setDate(s.getDate() - (days - 1));
    return { start: s, startMs: s.getTime(), startDay: dayStr(s) };
  }, [days]);

  const inTs = (iso?: string) => (iso ? new Date(iso).getTime() >= startMs : false);
  const inDay = (d: string) => d >= startDay;

  const rows = useMemo(
    () =>
      projects.map((p) => {
        const pt = tasks.filter((t) => t.projectId === p.id);
        return {
          project: p,
          newTasks: pt.filter((t) => inTs(t.createdAt)).length,
          updated: pt.filter((t) => inTs(t.lastUpdateAt)).length,
          open: pt.filter((t) => t.remaining > 0).length,
          logged: pt.reduce((s, t) => s + t.logged, 0),
          remaining: pt.reduce((s, t) => s + t.remaining, 0),
          leads:
            p.kind === "business"
              ? leadDays
                  .filter((l) => l.projectId === p.id && inDay(l.day))
                  .reduce((s, l) => s + l.count, 0)
              : null,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, tasks, leadDays, startMs, startDay],
  );

  const totals = rows.reduce(
    (a, r) => ({
      newTasks: a.newTasks + r.newTasks,
      updated: a.updated + r.updated,
      open: a.open + r.open,
      logged: a.logged + r.logged,
      leads: a.leads + (r.leads ?? 0),
    }),
    { newTasks: 0, updated: 0, open: 0, logged: 0, leads: 0 },
  );
  const businessCount = projects.filter((p) => p.kind === "business").length;
  const softwareCount = projects.length - businessCount;
  const rangeLabel = days === 1 ? fmt(new Date()) : `${fmt(start)} – ${fmt(new Date())}`;

  if (ready && !isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-6 py-10 text-center">
        <h1 className="font-display text-xl font-semibold">Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This overview is available to company owners and managers only.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="font-display text-xl font-semibold">Reports</h1>
          <p className="text-xs text-muted-foreground">{rangeLabel}</p>
        </div>
        <div className="flex rounded-xl border border-border/70 bg-card/80 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              aria-pressed={period === p.id}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                period === p.id
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Projects"
          value={projects.length}
          sub={`${businessCount} business · ${softwareCount} software`}
        />
        <Stat label="New tasks" value={totals.newTasks} sub="created in period" />
        <Stat label="Tasks updated" value={totals.updated} sub="touched in period" />
        <Stat label="Leads" value={totals.leads} sub="business projects, in period" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-4">Project</th>
              <th className="p-4">Type</th>
              <th className="p-4 text-right">New tasks</th>
              <th className="p-4 text-right">Updated</th>
              <th className="p-4 text-right">Open</th>
              <th className="p-4 text-right">Logged (h)</th>
              <th className="p-4 text-right">Remaining (h)</th>
              <th className="p-4 text-right">Leads</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  No projects yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.project.id} className="border-b border-border/60">
                  <td className="p-4 font-medium">{r.project.name}</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] capitalize",
                        r.project.kind === "business"
                          ? "bg-brand-soft text-brand"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {r.project.kind}
                    </span>
                  </td>
                  <td className="p-4 text-right">{r.newTasks}</td>
                  <td className="p-4 text-right">{r.updated}</td>
                  <td className="p-4 text-right">{r.open}</td>
                  <td className="p-4 text-right">{r.logged}</td>
                  <td className="p-4 text-right">{r.remaining}</td>
                  <td className="p-4 text-right">{r.leads ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t border-border font-semibold">
              <tr>
                <td className="p-4">Total</td>
                <td className="p-4" />
                <td className="p-4 text-right">{totals.newTasks}</td>
                <td className="p-4 text-right">{totals.updated}</td>
                <td className="p-4 text-right">{totals.open}</td>
                <td className="p-4 text-right">{totals.logged}</td>
                <td className="p-4 text-right">{rows.reduce((s, r) => s + r.remaining, 0)}</td>
                <td className="p-4 text-right">{totals.leads}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        New/updated tasks and leads are counted within the selected period. Open, logged and
        remaining are current totals across all tasks.
      </p>
    </div>
  );
}

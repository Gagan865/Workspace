import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useProjects } from "./projects-store";

const localDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDay = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">{label}</p>
      <p className={`mt-1 font-display text-3xl font-semibold ${accent ? "text-brand" : ""}`}>
        {value}
      </p>
    </div>
  );
}

export function LeadsView({ projectId }: { projectId: string }) {
  const { leadDays, setLeadCount } = useProjects();
  const today = localDay();
  const monthPrefix = today.slice(0, 7);

  const days = useMemo(
    () =>
      leadDays
        .filter((l) => l.projectId === projectId)
        .slice()
        .sort((a, b) => b.day.localeCompare(a.day)),
    [leadDays, projectId],
  );

  const todayCount = days.find((l) => l.day === today)?.count ?? 0;
  const monthCount = days.filter((l) => l.day.startsWith(monthPrefix)).reduce((s, l) => s + l.count, 0);
  const totalCount = days.reduce((s, l) => s + l.count, 0);

  const [draft, setDraft] = useState(String(todayCount));
  useEffect(() => setDraft(String(todayCount)), [todayCount]);

  const saveToday = (n: number) => setLeadCount(projectId, today, Math.max(0, n));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Leads today" value={todayCount} accent />
        <Stat label="This month" value={monthCount} />
        <Stat label="Total leads" value={totalCount} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-semibold">Log today’s leads</p>
        <p className="text-xs text-muted-foreground">{fmtDay(today)}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease"
            onClick={() => saveToday(todayCount - 1)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-input text-muted-foreground hover:text-foreground"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            aria-label="Leads today"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => saveToday(Number(draft) || 0)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveToday(Number(draft) || 0);
            }}
            className="h-10 w-24 rounded-xl border border-input bg-background px-3 text-center text-lg font-semibold outline-none focus:border-brand"
          />
          <button
            type="button"
            aria-label="Increase"
            onClick={() => saveToday(todayCount + 1)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
          </button>
          <span className="ml-1 text-xs text-muted-foreground">
            enter today’s total, or use − / +
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold">History</p>
        {days.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads logged yet.</p>
        ) : (
          <ul className="divide-y divide-border/70">
            {days.map((l) => (
              <li key={l.day} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm">
                  {fmtDay(l.day)}
                  {l.day === today && (
                    <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] text-brand">
                      Today
                    </span>
                  )}
                </span>
                <input
                  type="number"
                  aria-label={`Leads on ${l.day}`}
                  value={l.count}
                  onChange={(e) => setLeadCount(projectId, l.day, Math.max(0, Number(e.target.value) || 0))}
                  className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-right text-sm outline-none focus:border-brand"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

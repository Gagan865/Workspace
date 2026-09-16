import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { PersonAvatar } from "./person-avatar";
import { formatDue, progressOf, type Member, type Stage, type Task } from "./types";

type SortKey = "title" | "stage" | "owner" | "tag" | "due" | "logged" | "remaining" | "progress";

type Props = {
  stages: Stage[];
  tasks: Task[];
  members: Member[];
  onOpen: (task: Task) => void;
};

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "title", label: "Task" },
  { key: "stage", label: "Stage" },
  { key: "owner", label: "Owner" },
  { key: "tag", label: "Tag" },
  { key: "due", label: "Due" },
  { key: "logged", label: "Logged", numeric: true },
  { key: "remaining", label: "Remaining", numeric: true },
  { key: "progress", label: "Progress", numeric: true },
];

export function TaskTable({ stages, tasks, members, onOpen }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "stage", dir: 1 });

  const rows = useMemo(() => {
    const value = (t: Task): string | number => {
      switch (sort.key) {
        case "title":
          return t.title.toLowerCase();
        case "stage":
          return stages.findIndex((s) => s.id === t.stageId);
        case "owner":
          return (members.find((m) => m.id === t.ownerId)?.name ?? "").toLowerCase();
        case "tag":
          return t.tag.toLowerCase();
        case "due":
          return t.due || "9999";
        case "logged":
          return t.logged;
        case "remaining":
          return t.remaining;
        case "progress":
          return progressOf(t);
      }
    };
    return [...tasks].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av < bv) return -sort.dir;
      if (av > bv) return sort.dir;
      return 0;
    });
  }, [tasks, sort, stages, members]);

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  return (
    <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card/70 backdrop-blur-sm">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-border/70">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn("px-4 py-3", col.numeric ? "text-right" : "text-left")}
              >
                <button
                  type="button"
                  onClick={() => toggle(col.key)}
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-medium tracking-[0.1em] uppercase transition-colors hover:text-foreground",
                    sort.key === col.key ? "text-brand" : "text-muted-foreground",
                  )}
                >
                  {col.label}
                  {sort.key === col.key &&
                    (sort.dir === 1 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    ))}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((task) => {
            const owner = members.find((m) => m.id === task.ownerId);
            const stage = stages.find((s) => s.id === task.stageId);
            const pct = progressOf(task);
            return (
              <tr
                key={task.id}
                onClick={() => onOpen(task)}
                className="cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-muted/50"
              >
                <td className="max-w-[280px] px-4 py-3">
                  <p className="truncate font-medium">{task.title}</p>
                  {task.description && (
                    <p className="truncate text-xs text-muted-foreground">{task.description}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {stage?.label ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <PersonAvatar member={owner} size="sm" />
                    <span className="truncate text-xs">{owner?.name ?? "Unassigned"}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] tracking-wide text-brand uppercase">
                    {task.tag}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDue(task.due)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{task.logged}h</td>
                <td className="px-4 py-3 text-right tabular-nums">{task.remaining}h</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-xs text-muted-foreground">
                No tasks yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

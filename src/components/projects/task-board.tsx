import { CalendarDays, MoreHorizontal, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PersonAvatar } from "./person-avatar";
import { formatDue, personVars, progressOf, type Member, type Stage, type Task } from "./types";

type Props = {
  stages: Stage[];
  tasks: Task[];
  members: Member[];
  drafts: Record<string, string>;
  onDraftChange: (stageId: string, value: string) => void;
  onQuickAdd: (stageId: string) => void;
  onMove: (id: string, stageId: string) => void;
  onOpen: (task: Task) => void;
  onDelete: (id: string) => void;
  onLogUpdate: (id: string, note: string) => void;
};

const needsUpdate = (task: Task) => {
  if (!task.lastUpdateAt) return false;
  return Date.now() - new Date(task.lastUpdateAt).getTime() > 24 * 60 * 60 * 1000;
};

export function TaskBoard({
  stages,
  tasks,
  members,
  drafts,
  onDraftChange,
  onQuickAdd,
  onMove,
  onOpen,
  onDelete,
  onLogUpdate,
}: Props) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {stages.map((stage, index) => {
        const stageTasks = tasks.filter((t) => t.stageId === stage.id);
        return (
          <section
            key={stage.id}
            className="flex flex-col rounded-3xl border border-border/70 bg-card/60 p-4 backdrop-blur-sm"
          >
            <header className="mb-3 flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  index === stages.length - 1 ? "bg-duo" : "bg-brand",
                )}
              />
              <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{stage.label}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {stageTasks.length}
              </span>
            </header>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onQuickAdd(stage.id);
              }}
              className="mb-3 flex gap-2"
            >
              <input
                value={drafts[stage.id] ?? ""}
                onChange={(e) => onDraftChange(stage.id, e.target.value)}
                placeholder="Add a task…"
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <button
                type="submit"
                aria-label={`Add task to ${stage.label}`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            <ul className="flex flex-1 flex-col gap-3">
              {stageTasks.map((task) => {
                const owner = members.find((m) => m.id === task.ownerId);
                const pct = progressOf(task);
                return (
                  <li
                    key={task.id}
                    className="rounded-2xl border border-border/70 border-l-4 bg-card p-4 shadow-soft transition-shadow hover:shadow-lift"
                    style={{ borderLeftColor: owner ? personVars(owner.colorId).solid : undefined }}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                      <button
                        type="button"
                        onClick={() => onOpen(task)}
                        className="min-w-0 text-left"
                      >
                        <span className="inline-block rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium tracking-wide text-brand uppercase">
                          {task.tag}
                        </span>
                        <h3 className="mt-2 text-sm font-semibold break-words">{task.title}</h3>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label="Task actions"
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onOpen(task)}>
                            Edit task
                          </DropdownMenuItem>
                          {stages
                            .filter((s) => s.id !== task.stageId)
                            .map((s) => (
                              <DropdownMenuItem key={s.id} onClick={() => onMove(task.id, s.id)}>
                                Move to {s.label}
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuItem
                            onClick={() => onDelete(task.id)}
                            className="text-destructive"
                          >
                            Delete task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {task.description && (
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{task.logged}h logged</span>
                        <span>{task.remaining}h left</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <PersonAvatar member={owner} size="md" />
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatDue(task.due)}
                      </span>
                      {needsUpdate(task) && (
                        <button
                          type="button"
                          onClick={() => {
                            const note = window.prompt("Today's update on this task?");
                            if (note && note.trim()) onLogUpdate(task.id, note.trim());
                          }}
                          className="ml-auto rounded-full bg-duo-soft px-2 py-0.5 text-[10px] font-medium text-foreground"
                        >
                          Needs update
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
              {stageTasks.length === 0 && (
                <li className="rounded-2xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                  Nothing here
                </li>
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

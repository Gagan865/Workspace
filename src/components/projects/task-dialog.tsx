import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PersonAvatar } from "./person-avatar";
import {
  PRIORITIES,
  type Member,
  type Priority,
  type Stage,
  type Task,
  uid,
} from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  projectId: string;
  defaultStageId: string;
  stages: Stage[];
  members: Member[];
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
};

const emptyTask = (projectId: string, stageId: string, ownerId: string): Task => ({
  id: "",
  projectId,
  title: "",
  description: "",
  tag: "General",
  ownerId,
  due: "",
  priority: "medium",
  stageId,
  logged: 0,
  remaining: 4,
});

function HourField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  hint: string;
}) {
  const step = (delta: number) => onChange(Math.max(0, Math.round((value + delta) * 2) / 2));
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/40 p-3">
      <Label className="text-xs tracking-wide text-muted-foreground uppercase">{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => step(-0.5)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-background transition-colors hover:bg-muted"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <Input
          type="number"
          min={0}
          step={0.5}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="h-9 text-center"
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => step(0.5)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-background transition-colors hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  projectId,
  defaultStageId,
  stages,
  members,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<Task>(() =>
    emptyTask(projectId, defaultStageId, members[0]?.id ?? ""),
  );

  useEffect(() => {
    if (!open) return;
    setDraft(task ?? emptyTask(projectId, defaultStageId, members[0]?.id ?? ""));
  }, [open, task, projectId, defaultStageId, members]);

  const total = draft.logged + draft.remaining;
  const pct = total === 0 ? 0 : Math.round((draft.logged / total) * 100);

  const submit = () => {
    const title = draft.title.trim();
    if (!title) return;
    onSave({ ...draft, title, id: draft.id || uid("task") });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            Describe the work, set an owner and estimate the time it takes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="What needs doing?"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Context, links, acceptance criteria…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select
                value={draft.stageId}
                onValueChange={(v) => setDraft((d) => ({ ...d, stageId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select
                value={draft.ownerId}
                onValueChange={(v) => setDraft((d) => ({ ...d, ownerId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <PersonAvatar member={m} size="sm" />
                        {m.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-tag">Tag</Label>
              <Input
                id="task-tag"
                value={draft.tag}
                onChange={(e) => setDraft((d) => ({ ...d, tag: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={draft.due}
                onChange={(e) => setDraft((d) => ({ ...d, due: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Priority</Label>
              <Select
                value={draft.priority}
                onValueChange={(v) => setDraft((d) => ({ ...d, priority: v as Priority }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <HourField
              label="Time Logged"
              value={draft.logged}
              onChange={(v) => setDraft((d) => ({ ...d, logged: v }))}
              hint="Hours already spent on this task."
            />
            <HourField
              label="Time Remaining"
              value={draft.remaining}
              onChange={(v) => setDraft((d) => ({ ...d, remaining: v }))}
              hint="Hours still estimated to finish."
            />
          </div>

          <div className="rounded-2xl border border-border/70 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {draft.logged}h logged · {draft.remaining}h left
              </span>
              <span className="font-medium text-foreground">
                {pct}% of {total}h
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {task ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(task.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={!draft.title.trim()}>
              Save task
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

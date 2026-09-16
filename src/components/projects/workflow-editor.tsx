import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

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
import type { Stage } from "./types";
import { uid } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: Stage[];
  counts: Record<string, number>;
  onChange: (stages: Stage[], removedId?: string) => void;
};

export function WorkflowEditor({ open, onOpenChange, stages, counts, onChange }: Props) {
  const [draft, setDraft] = useState("");

  const rename = (id: string, label: string) =>
    onChange(stages.map((s) => (s.id === id ? { ...s, label } : s)));

  const move = (index: number, delta: number) => {
    const next = [...stages];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    onChange(next);
  };

  const remove = (id: string) => {
    if (stages.length <= 1) return;
    onChange(
      stages.filter((s) => s.id !== id),
      id,
    );
  };

  const add = () => {
    const label = draft.trim();
    if (!label) return;
    onChange([...stages, { id: uid("stage"), label }]);
    setDraft("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Workflow stages</DialogTitle>
          <DialogDescription>
            Rename, reorder or remove stages. Removing a stage moves its tasks to the first stage.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {stages.map((stage, i) => (
            <li key={stage.id} className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
              <Input
                value={stage.label}
                onChange={(e) => rename(stage.id, e.target.value)}
                className="h-9 min-w-0 flex-1"
              />
              <span className="w-8 shrink-0 text-center text-xs text-muted-foreground">
                {counts[stage.id] ?? 0}
              </span>
              <button
                type="button"
                aria-label={`Move ${stage.label} earlier`}
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border transition-colors hover:bg-muted disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Move ${stage.label} later`}
                onClick={() => move(i, 1)}
                disabled={i === stages.length - 1}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border transition-colors hover:bg-muted disabled:opacity-40"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Remove ${stage.label}`}
                onClick={() => remove(stage.id)}
                disabled={stages.length <= 1}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-destructive transition-colors hover:bg-muted disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="flex gap-2 pt-1"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="New stage name…"
            className="h-9"
          />
          <Button type="submit" variant="outline" disabled={!draft.trim()}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </form>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

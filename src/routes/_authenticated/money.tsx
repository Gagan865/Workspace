import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useProjects } from "@/components/projects/projects-store";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCIES, formatDate, money } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/money")({
  head: () => ({
    meta: [
      { title: "Money — Workspace" },
      {
        name: "description",
        content:
          "Track payment milestones, see what is due, overdue and collected, and get reminders before money slips.",
      },
      { property: "og:title", content: "Money — Workspace" },
      {
        property: "og:description",
        content: "Payment milestones with due, overdue and collected totals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MoneyPage,
});

type Milestone = {
  id: string;
  label: string;
  amount: number;
  currency: string;
  due_date: string | null;
  paid: boolean;
  project_id: string | null;
};

const field =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand";

function MoneyPage() {
  const { projects } = useProjects();
  const [rows, setRows] = useState<Milestone[]>([]);
  const [draft, setDraft] = useState({
    label: "",
    amount: 0,
    currency: "USD",
    due_date: new Date().toISOString().slice(0, 10),
    project_id: "",
  });

  const load = useCallback(async () => {
    const { data } = await supabase.from("payment_milestones").select("*").order("due_date");
    setRows((data ?? []) as unknown as Milestone[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const now = new Date().toISOString().slice(0, 10);
    let due = 0;
    let overdue = 0;
    let collected = 0;
    for (const row of rows) {
      const amount = Number(row.amount);
      if (row.paid) collected += amount;
      else if (row.due_date && row.due_date < now) overdue += amount;
      else due += amount;
    }
    return { due, overdue, collected };
  }, [rows]);

  const add = async () => {
    if (!draft.label.trim()) return;
    await supabase.from("payment_milestones").insert({
      label: draft.label,
      amount: draft.amount,
      currency: draft.currency,
      due_date: draft.due_date,
      project_id: draft.project_id || null,
    });
    setDraft({ ...draft, label: "", amount: 0 });
    await load();
  };

  const togglePaid = async (row: Milestone) => {
    await supabase
      .from("payment_milestones")
      .update({ paid: !row.paid, paid_at: row.paid ? null : new Date().toISOString() })
      .eq("id", row.id);
    await load();
  };

  const currency = rows[0]?.currency ?? "USD";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <h1 className="font-display text-xl font-semibold">Money</h1>
      <p className="text-xs text-muted-foreground">
        Payments from accepted quotes land here automatically. Add your own any time.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Due", value: totals.due },
          { label: "Overdue", value: totals.overdue },
          { label: "Collected", value: totals.collected },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 font-display text-lg font-semibold">
              {money(card.value, currency)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-2 sm:grid-cols-[1fr_7rem_6rem_9rem_1fr_auto]">
          <input
            className={field}
            placeholder="What is this payment for?"
            aria-label="Payment label"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
          <input
            className={field}
            type="number"
            aria-label="Amount"
            value={draft.amount}
            onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
          />
          <select
            className={field}
            aria-label="Currency"
            value={draft.currency}
            onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            className={field}
            type="date"
            aria-label="Due date"
            value={draft.due_date}
            onChange={(e) => setDraft({ ...draft, due_date: e.target.value })}
          />
          <select
            className={field}
            aria-label="Project"
            value={draft.project_id}
            onChange={(e) => setDraft({ ...draft, project_id: e.target.value })}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={add}
            aria-label="Add payment"
            className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-5 divide-y divide-border">
          {rows.map((row) => {
            const late = !row.paid && row.due_date && row.due_date < today;
            return (
              <li key={row.id} className="flex items-center gap-3 py-3">
                <input
                  type="checkbox"
                  checked={row.paid}
                  onChange={() => togglePaid(row)}
                  aria-label={`Mark ${row.label} paid`}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${row.paid ? "line-through opacity-60" : ""}`}>
                    {row.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDate(row.due_date)}
                    {late && <span className="ml-2 font-medium text-destructive">Overdue</span>}
                    {row.project_id && (
                      <span className="ml-2">
                        · {projects.find((p) => p.id === row.project_id)?.name ?? "Project"}
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-sm font-medium">
                  {money(Number(row.amount), row.currency)}
                </span>
              </li>
            );
          })}
          {rows.length === 0 && (
            <li className="py-6 text-sm text-muted-foreground">Nothing to collect yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

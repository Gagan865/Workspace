import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Droplet,
  Mail,
  Phone,
  Plus,
  Star,
  Trash2,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Personal Planner — Daily Journal & Priorities" },
      {
        name: "description",
        content:
          "A daily journal layout with top priorities, calls and emails, to-dos, an hourly schedule, notes, water and expense tracking, and a day rating.",
      },
      { property: "og:title", content: "Personal Planner — Daily Journal & Priorities" },
      {
        property: "og:description",
        content:
          "Plan your day: priorities, calls, to-dos, hourly schedule, notes, water, expenses and a day rating.",
      },
    ],
  }),
  component: PlannerPage,
});

type Task = { id: string; text: string; done: boolean };
type Contact = { id: string; name: string; kind: "call" | "email"; done: boolean };
type Expense = { id: string; label: string; amount: string };

const uid = () => Math.random().toString(36).slice(2, 9);

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const formatHour = (h: number) =>
  `${((h + 11) % 12) + 1}:00 ${h < 12 ? "AM" : "PM"}`;

function Panel({
  title,
  icon,
  children,
  action,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border/70 bg-card/85 p-5 shadow-soft backdrop-blur-sm",
        className,
      )}
    >
      <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <h2 className="truncate text-[13px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {title}
          </h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function CheckDot({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={done}
      className={cn(
        "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all",
        done ? "border-brand bg-brand text-brand-foreground" : "border-border hover:border-brand",
      )}
    >
      {done && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  );
}

function PlannerPage() {
  const today = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  const [priorities, setPriorities] = useState<Task[]>([
    { id: uid(), text: "Ship the Q3 roadmap deck", done: false },
    { id: uid(), text: "Review design handoff", done: false },
    { id: uid(), text: "45 min deep work block", done: false },
  ]);
  const [contacts, setContacts] = useState<Contact[]>([
    { id: uid(), name: "Priya — budget sign-off", kind: "call", done: false },
    { id: uid(), name: "Marcus — contract draft", kind: "email", done: false },
    { id: uid(), name: "", kind: "call", done: false },
  ]);
  const [todos, setTodos] = useState<Task[]>([
    { id: uid(), text: "Gym at 7pm", done: false },
    { id: uid(), text: "Pick up dry cleaning", done: true },
  ]);
  const [newTodo, setNewTodo] = useState("");
  const [schedule, setSchedule] = useState<Record<number, string>>({
    9: "Standup + inbox",
    11: "Design review",
    15: "1:1 with Ana",
  });
  const [notes, setNotes] = useState("");
  const [water, setWater] = useState(3);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: uid(), label: "Coffee", amount: "4.50" },
    { id: uid(), label: "Commute", amount: "12" },
  ]);
  const [rating, setRating] = useState(0);

  const total = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  return (
    <div className="surface-planner min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <header className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
              Personal Planner
            </p>
            <h1 className="mt-2 truncate text-3xl font-semibold sm:text-4xl">Today</h1>
            <p className="mt-1 text-sm text-muted-foreground">{today}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-right shadow-soft">
            <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">Done</p>
            <p className="font-display text-xl font-semibold">
              {[...priorities, ...todos].filter((t) => t.done).length}
              <span className="text-muted-foreground">/{priorities.length + todos.length}</span>
            </p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            <Panel title="Top Priorities" icon={<Star className="h-4 w-4 text-brand" />}>
              <ul className="space-y-3">
                {priorities.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-brand-soft font-display text-xs font-bold text-brand">
                      {i + 1}
                    </span>
                    <input
                      value={p.text}
                      onChange={(e) =>
                        setPriorities((prev) =>
                          prev.map((x) => (x.id === p.id ? { ...x, text: e.target.value } : x)),
                        )
                      }
                      placeholder="What matters most today?"
                      className={cn(
                        "rule-line min-w-0 flex-1 bg-transparent pb-1.5 text-sm outline-none placeholder:text-muted-foreground/70",
                        p.done && "text-muted-foreground line-through",
                      )}
                    />
                    <CheckDot
                      done={p.done}
                      onClick={() =>
                        setPriorities((prev) =>
                          prev.map((x) => (x.id === p.id ? { ...x, done: !x.done } : x)),
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Calls & Emails" icon={<Phone className="h-4 w-4 text-duo" />}>
              <ul className="space-y-3">
                {contacts.map((c) => (
                  <li key={c.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setContacts((prev) =>
                          prev.map((x) =>
                            x.id === c.id
                              ? { ...x, kind: x.kind === "call" ? "email" : "call" }
                              : x,
                          ),
                        )
                      }
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-duo-soft px-2.5 py-1 text-[11px] font-medium text-duo-foreground"
                    >
                      {c.kind === "call" ? (
                        <Phone className="h-3 w-3" />
                      ) : (
                        <Mail className="h-3 w-3" />
                      )}
                      {c.kind === "call" ? "Call" : "Email"}
                    </button>
                    <input
                      value={c.name}
                      onChange={(e) =>
                        setContacts((prev) =>
                          prev.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)),
                        )
                      }
                      placeholder="Who do you need to reach?"
                      className={cn(
                        "rule-line min-w-0 flex-1 bg-transparent pb-1.5 text-sm outline-none placeholder:text-muted-foreground/70",
                        c.done && "text-muted-foreground line-through",
                      )}
                    />
                    <CheckDot
                      done={c.done}
                      onClick={() =>
                        setContacts((prev) =>
                          prev.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)),
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() =>
                  setContacts((prev) => [...prev, { id: uid(), name: "", kind: "call", done: false }])
                }
                className="mt-4 flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add contact
              </button>
            </Panel>

            <Panel title="Personal To-Do" icon={<Check className="h-4 w-4 text-brand" />}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTodo.trim()) return;
                  setTodos((prev) => [...prev, { id: uid(), text: newTodo.trim(), done: false }]);
                  setNewTodo("");
                }}
                className="mb-4 flex gap-2"
              >
                <input
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="Add something…"
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <button
                  type="submit"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
              <ul className="space-y-2.5">
                {todos.map((t) => (
                  <li key={t.id} className="group flex items-center gap-3">
                    <CheckDot
                      done={t.done}
                      onClick={() =>
                        setTodos((prev) =>
                          prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
                        )
                      }
                    />
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm",
                        t.done && "text-muted-foreground line-through",
                      )}
                    >
                      {t.text}
                    </span>
                    <button
                      type="button"
                      aria-label="Delete"
                      onClick={() => setTodos((prev) => prev.filter((x) => x.id !== t.id))}
                      className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
                {todos.length === 0 && (
                  <li className="text-sm text-muted-foreground">Nothing here yet.</li>
                )}
              </ul>
            </Panel>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            <Panel title="Daily Schedule">
              <ul className="divide-y divide-border/70">
                {HOURS.map((h) => (
                  <li key={h} className="flex items-center gap-3 py-1.5">
                    <span className="w-16 shrink-0 text-[11px] font-medium tracking-wide text-muted-foreground">
                      {formatHour(h)}
                    </span>
                    <input
                      value={schedule[h] ?? ""}
                      onChange={(e) =>
                        setSchedule((prev) => ({ ...prev, [h]: e.target.value }))
                      }
                      className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/50 focus:placeholder:text-transparent"
                      placeholder="—"
                    />
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Thoughts, ideas, things to remember…"
                className="w-full resize-none rounded-2xl border border-border bg-background/60 p-3 text-sm leading-6 outline-none focus:border-brand"
              />
            </Panel>

            <div className="grid gap-5 sm:grid-cols-2">
              <Panel title="Water" icon={<Droplet className="h-4 w-4 text-brand" />}>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 8 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`${i + 1} glasses`}
                      onClick={() => setWater(water === i + 1 ? i : i + 1)}
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-xl border transition-all",
                        i < water
                          ? "border-brand bg-brand text-brand-foreground"
                          : "border-border text-muted-foreground hover:border-brand",
                      )}
                    >
                      <Droplet className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{water} of 8 glasses</p>
              </Panel>

              <Panel title="Expenses" icon={<Wallet className="h-4 w-4 text-duo" />}>
                <ul className="space-y-2">
                  {expenses.map((e) => (
                    <li key={e.id} className="flex items-center gap-2">
                      <input
                        value={e.label}
                        onChange={(ev) =>
                          setExpenses((prev) =>
                            prev.map((x) => (x.id === e.id ? { ...x, label: ev.target.value } : x)),
                          )
                        }
                        placeholder="Item"
                        className="rule-line min-w-0 flex-1 bg-transparent pb-1 text-sm outline-none"
                      />
                      <input
                        value={e.amount}
                        onChange={(ev) =>
                          setExpenses((prev) =>
                            prev.map((x) =>
                              x.id === e.id ? { ...x, amount: ev.target.value } : x,
                            ),
                          )
                        }
                        inputMode="decimal"
                        placeholder="0"
                        className="rule-line w-16 shrink-0 bg-transparent pb-1 text-right text-sm outline-none"
                      />
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() =>
                    setExpenses((prev) => [...prev, { id: uid(), label: "", amount: "" }])
                  }
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Add expense
                </button>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-display font-semibold">{total.toFixed(2)}</span>
                </div>
              </Panel>
            </div>

            <Panel title="Rate Your Day">
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Rate ${n}`}
                    onClick={() => setRating(rating === n ? 0 : n)}
                    className={cn(
                      "grid h-11 flex-1 place-items-center rounded-2xl border transition-all",
                      n <= rating
                        ? "border-duo bg-duo text-duo-foreground"
                        : "border-border text-muted-foreground hover:border-duo",
                    )}
                  >
                    <Star className={cn("h-5 w-5", n <= rating && "fill-current")} />
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {rating === 0 ? "How did today go?" : `${rating} out of 5`}
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

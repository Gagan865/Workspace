import { createFileRoute } from "@tanstack/react-router";
import { Plus, Printer, Copy, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Logo } from "@/components/logo";
import { useProjects } from "@/components/projects/projects-store";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCIES, formatDate, lineTotal, money, quoteTotals, type QuoteItem } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/quotes")({
  head: () => ({
    meta: [
      { title: "Quotations — Workspace" },
      {
        name: "description",
        content:
          "Build client quotations with live document preview, print to PDF, and turn accepted quotes into projects.",
      },
      { property: "og:title", content: "Quotations — Workspace" },
      {
        property: "og:description",
        content: "Quotation builder with live preview, print export and automatic project creation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuotesPage,
});

type Quote = {
  id: string;
  number: string;
  client_name: string;
  client_company: string;
  client_email: string;
  client_address: string;
  issue_date: string | null;
  valid_until: string | null;
  currency: string;
  discount: number;
  deposit: number;
  notes: string;
  terms: string;
  status: string;
  project_id: string | null;
};

// Your company's sender block, shown at the top of every quotation. Edit freely.
const SENDER = {
  tagline: "AI Automation & CRM Solutions",
  location: "Bangalore, Karnataka, India",
  website: "www.prisim.co.in",
};

const STATUSES = ["draft", "sent", "accepted", "declined"] as const;

const today = () => new Date().toISOString().slice(0, 10);

const field =
  "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand";
const labelCls = "block text-xs font-medium text-muted-foreground";

function QuotesPage() {
  const { addProject, refresh, companyName } = useProjects();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [current, setCurrent] = useState<Quote | null>(null);
  const [status, setStatus] = useState("");

  const loadQuotes = useCallback(async (selectId?: string) => {
    const { data } = await supabase.from("quotes").select("*").order("created_at");
    const rows = (data ?? []) as unknown as Quote[];
    setQuotes(rows);
    const pick = rows.find((q) => q.id === selectId) ?? rows[0] ?? null;
    setCurrent(pick);
    if (pick) {
      const { data: itemRows } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", pick.id)
        .order("position");
      setItems(
        (itemRows ?? []).map((i) => ({
          id: i.id,
          description: i.description,
          quantity: Number(i.quantity),
          rate: Number(i.rate),
          tax: Number(i.tax),
        })),
      );
    } else {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void loadQuotes();
  }, [loadQuotes]);

  const totals = useMemo(
    () => quoteTotals(items, Number(current?.discount ?? 0)),
    [items, current?.discount],
  );

  const patch = (changes: Partial<Quote>) =>
    setCurrent((prev) => (prev ? { ...prev, ...changes } : prev));

  const newQuote = async () => {
    const { data } = await supabase
      .from("quotes")
      .insert({
        number: `Q-${String(quotes.length + 1).padStart(4, "0")}`,
        issue_date: today(),
        client_name: "New client",
      })
      .select()
      .single();
    if (data) await loadQuotes(data.id);
  };

  const save = async () => {
    if (!current) return;
    setStatus("Saving…");
    await supabase
      .from("quotes")
      .update({
        number: current.number,
        client_name: current.client_name,
        client_company: current.client_company,
        client_email: current.client_email,
        client_address: current.client_address,
        issue_date: current.issue_date,
        valid_until: current.valid_until,
        currency: current.currency,
        discount: current.discount,
        deposit: current.deposit,
        notes: current.notes,
        terms: current.terms,
        status: current.status,
      })
      .eq("id", current.id);

    await supabase.from("quote_items").delete().eq("quote_id", current.id);
    if (items.length) {
      await supabase.from("quote_items").insert(
        items.map((item, index) => ({
          quote_id: current.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          tax: item.tax,
          position: index,
        })),
      );
    }

    if (current.status === "accepted" && !current.project_id) {
      const project = await addProject(current.client_company || current.client_name || current.number);
      if (project) {
        await supabase
          .from("quotes")
          .update({ project_id: project.id })
          .eq("id", current.id);
        await supabase.from("projects").update({ quote_id: current.id }).eq("id", project.id);
        await supabase.from("payment_milestones").insert({
          label: `${current.number} — full payment`,
          amount: totals.total,
          currency: current.currency,
          due_date: current.valid_until ?? current.issue_date,
          quote_id: current.id,
          project_id: project.id,
        });
        await refresh();
        setStatus(`Saved — project "${project.name}" created and a payment added to Money.`);
      }
    } else {
      setStatus("Saved.");
    }
    await loadQuotes(current.id);
  };

  const duplicate = async () => {
    if (!current) return;
    const { data } = await supabase
      .from("quotes")
      .insert({
        number: `${current.number}-copy`,
        client_name: current.client_name,
        client_company: current.client_company,
        client_email: current.client_email,
        client_address: current.client_address,
        issue_date: today(),
        valid_until: current.valid_until,
        currency: current.currency,
        discount: current.discount,
        deposit: current.deposit,
        notes: current.notes,
        terms: current.terms,
      })
      .select()
      .single();
    if (data && items.length) {
      await supabase.from("quote_items").insert(
        items.map((item, index) => ({
          quote_id: data.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          tax: item.tax,
          position: index,
        })),
      );
    }
    if (data) await loadQuotes(data.id);
  };

  const remove = async () => {
    if (!current) return;
    if (!window.confirm("Delete this quotation?")) return;
    await supabase.from("quotes").delete().eq("id", current.id);
    await loadQuotes();
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">
      <header className="mb-5 flex flex-wrap items-center gap-3 print:hidden">
        <div className="mr-auto">
          <h1 className="font-display text-xl font-semibold">Quotations</h1>
          <p className="text-xs text-muted-foreground">
            Fill the form, watch the document build itself, then print or save as PDF.
          </p>
        </div>
        <select
          value={current?.id ?? ""}
          onChange={(e) => void loadQuotes(e.target.value)}
          aria-label="Choose quotation"
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          {quotes.map((q) => (
            <option key={q.id} value={q.id}>
              {q.number} · {q.client_name || "Untitled"}
            </option>
          ))}
        </select>
        <button
          onClick={newQuote}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New quote
        </button>
      </header>

      {!current ? (
        <p className="text-sm text-muted-foreground">
          No quotations yet — create your first one.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5 print:hidden">
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                Quote number
                <input
                  className={field}
                  value={current.number}
                  onChange={(e) => patch({ number: e.target.value })}
                />
              </label>
              <label className={labelCls}>
                Status
                <select
                  className={field}
                  value={current.status}
                  onChange={(e) => patch({ status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s[0]!.toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelCls}>
                Client name
                <input
                  className={field}
                  value={current.client_name}
                  onChange={(e) => patch({ client_name: e.target.value })}
                />
              </label>
              <label className={labelCls}>
                Company
                <input
                  className={field}
                  value={current.client_company}
                  onChange={(e) => patch({ client_company: e.target.value })}
                />
              </label>
              <label className={labelCls}>
                Email
                <input
                  type="email"
                  className={field}
                  value={current.client_email}
                  onChange={(e) => patch({ client_email: e.target.value })}
                />
              </label>
              <label className={labelCls}>
                Currency
                <select
                  className={field}
                  value={current.currency}
                  onChange={(e) => patch({ currency: e.target.value })}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className={labelCls}>
                Issue date
                <input
                  type="date"
                  className={field}
                  value={current.issue_date ?? ""}
                  onChange={(e) => patch({ issue_date: e.target.value })}
                />
              </label>
              <label className={labelCls}>
                Valid until
                <input
                  type="date"
                  className={field}
                  value={current.valid_until ?? ""}
                  onChange={(e) => patch({ valid_until: e.target.value })}
                />
              </label>
            </div>

            <label className={labelCls}>
              Client address
              <textarea
                rows={2}
                className={field}
                value={current.client_address}
                onChange={(e) => patch({ client_address: e.target.value })}
              />
            </label>

            <div>
              <div className="flex items-center justify-between">
                <span className={labelCls}>Line items</span>
                <button
                  onClick={() =>
                    setItems((prev) => [
                      ...prev,
                      {
                        id: `tmp-${Date.now()}`,
                        description: "",
                        quantity: 1,
                        rate: 0,
                        tax: 0,
                      },
                    ])
                  }
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Add line
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-end gap-2">
                    <input
                      className={`${field} flex-1`}
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((i, n) =>
                            n === index ? { ...i, description: e.target.value } : i,
                          ),
                        )
                      }
                    />
                    <input
                      type="number"
                      aria-label="Quantity"
                      className={`${field} w-16`}
                      value={item.quantity}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((i, n) =>
                            n === index ? { ...i, quantity: Number(e.target.value) } : i,
                          ),
                        )
                      }
                    />
                    <input
                      type="number"
                      aria-label="Rate"
                      className={`${field} w-24`}
                      value={item.rate}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((i, n) =>
                            n === index ? { ...i, rate: Number(e.target.value) } : i,
                          ),
                        )
                      }
                    />
                    <input
                      type="number"
                      aria-label="Tax percent"
                      className={`${field} w-16`}
                      value={item.tax}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((i, n) =>
                            n === index ? { ...i, tax: Number(e.target.value) } : i,
                          ),
                        )
                      }
                    />
                    <button
                      aria-label="Remove line"
                      onClick={() => setItems((prev) => prev.filter((_, n) => n !== index))}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-input text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                Discount
                <input
                  type="number"
                  className={field}
                  value={current.discount}
                  onChange={(e) => patch({ discount: Number(e.target.value) })}
                />
              </label>
              <label className={labelCls}>
                Advance paid
                <input
                  type="number"
                  className={field}
                  value={current.deposit}
                  onChange={(e) => patch({ deposit: Number(e.target.value) })}
                />
              </label>
            </div>

            <label className={labelCls}>
              Notes
              <textarea
                rows={2}
                className={field}
                value={current.notes}
                onChange={(e) => patch({ notes: e.target.value })}
              />
            </label>
            <label className={labelCls}>
              Terms
              <textarea
                rows={3}
                className={field}
                value={current.terms}
                onChange={(e) => patch({ terms: e.target.value })}
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={save}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
              >
                Save
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-input px-3 py-2 text-sm hover:bg-accent"
              >
                <Printer className="h-4 w-4" /> Print / Save as PDF
              </button>
              <button
                onClick={duplicate}
                className="inline-flex items-center gap-1.5 rounded-xl border border-input px-3 py-2 text-sm hover:bg-accent"
              >
                <Copy className="h-4 w-4" /> Duplicate
              </button>
              <button
                onClick={remove}
                className="ml-auto text-xs text-muted-foreground hover:text-destructive"
              >
                Delete
              </button>
            </div>
            {status && <p className="text-xs text-muted-foreground">{status}</p>}
            <p className="text-[11px] text-muted-foreground">
              Setting the status to Accepted and saving creates a project for this client and adds
              the payment to Money.
            </p>
          </section>

          <section className="print-area rounded-2xl border border-border bg-card p-8 text-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Logo plain className="mb-3 h-14 w-auto max-w-[160px]" />
                <p className="font-display text-2xl font-semibold tracking-tight">
                  {companyName || "PRISIM"}
                </p>
                <p className="text-xs text-muted-foreground">{SENDER.tagline}</p>
                <p className="text-xs text-muted-foreground">{SENDER.location}</p>
                <p className="text-xs text-muted-foreground">{SENDER.website}</p>
              </div>
              <div className="shrink-0 text-right">
                <h2 className="font-display text-xl font-semibold tracking-wide uppercase">
                  Quotation
                </h2>
                <p className="text-xs text-muted-foreground">{current.number}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Issued {formatDate(current.issue_date)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Valid until {formatDate(current.valid_until)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Prepared for</p>
              <p className="font-medium">{current.client_name || "—"}</p>
              {current.client_company && <p>{current.client_company}</p>}
              {current.client_email && (
                <p className="text-muted-foreground">{current.client_email}</p>
              )}
              {current.client_address && (
                <p className="whitespace-pre-line text-muted-foreground">
                  {current.client_address}
                </p>
              )}
            </div>

            <table className="mt-6 w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Rate</th>
                  <th className="py-2 text-right">Tax</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border/60">
                    <td className="py-2">{item.description || "—"}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">{money(item.rate, current.currency)}</td>
                    <td className="py-2 text-right">{item.tax}%</td>
                    <td className="py-2 text-right">
                      {money(lineTotal(item), current.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 ml-auto w-56 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{money(totals.subtotal, current.currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{money(totals.tax, current.currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span>-{money(Number(current.discount), current.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1 font-semibold">
                <span>Total</span>
                <span>{money(totals.total, current.currency)}</span>
              </div>
              {Number(current.deposit) > 0 && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Advance paid</span>
                    <span>-{money(Number(current.deposit), current.currency)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1 font-semibold">
                    <span>Balance due</span>
                    <span>
                      {money(
                        Math.max(0, totals.total - Number(current.deposit)),
                        current.currency,
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>

            {current.notes && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
                <p className="whitespace-pre-line">{current.notes}</p>
              </div>
            )}
            {current.terms && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Terms</p>
                <p className="whitespace-pre-line text-muted-foreground">{current.terms}</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

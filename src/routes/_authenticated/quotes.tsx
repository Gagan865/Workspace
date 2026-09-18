import { createFileRoute } from "@tanstack/react-router";
import { Copy, Plus, Printer, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Logo } from "@/components/logo";
import { useProjects } from "@/components/projects/projects-store";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCIES, formatDate } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/quotes")({
  head: () => ({
    meta: [
      { title: "Quotations — Workspace" },
      {
        name: "description",
        content:
          "Build client quotations with a live invoice preview, print to PDF, and turn accepted quotes into projects.",
      },
      { property: "og:title", content: "Quotations — Workspace" },
      {
        property: "og:description",
        content: "Quotation builder with a branded invoice preview and print export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuotesPage,
});

type Item = { id: string; name: string; description: string; qty: string; amount: string };
type SummaryRow = { description: string; amount: string };
type Plan = { name: string; cycle: string; period: string };

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
  notes: string;
  terms: string;
  status: string;
  project_id: string | null;
  payment_details: string;
  summary: SummaryRow[];
  plans: Plan[];
};

// Your company's "From" block and document footer. Edit freely.
const SENDER = {
  tagline: "AI Automation & CRM Solutions",
  location: "Bangalore, Karnataka, India",
  website: "www.prisim.co.in",
};
const FOOTER = "Save Time. Reduce Costs. Scale Faster.";

const STATUSES = ["draft", "sent", "accepted", "declined"] as const;
const today = () => new Date().toISOString().slice(0, 10);

const field =
  "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand";
const labelCls = "block text-xs font-medium text-muted-foreground";
const tmpId = () => `tmp-${Math.random().toString(36).slice(2, 9)}`;

function QuotesPage() {
  const { addProject, refresh, companyName } = useProjects();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [current, setCurrent] = useState<Quote | null>(null);
  const [status, setStatus] = useState("");

  const asQuote = (row: Record<string, unknown>): Quote => ({
    id: row["id"] as string,
    number: (row["number"] as string) ?? "",
    client_name: (row["client_name"] as string) ?? "",
    client_company: (row["client_company"] as string) ?? "",
    client_email: (row["client_email"] as string) ?? "",
    client_address: (row["client_address"] as string) ?? "",
    issue_date: (row["issue_date"] as string) ?? null,
    valid_until: (row["valid_until"] as string) ?? null,
    currency: (row["currency"] as string) ?? "INR",
    notes: (row["notes"] as string) ?? "",
    terms: (row["terms"] as string) ?? "",
    status: (row["status"] as string) ?? "draft",
    project_id: (row["project_id"] as string) ?? null,
    payment_details: (row["payment_details"] as string) ?? "",
    summary: Array.isArray(row["summary"]) ? (row["summary"] as SummaryRow[]) : [],
    plans: Array.isArray(row["plans"]) ? (row["plans"] as Plan[]) : [],
  });

  const loadQuotes = useCallback(async (selectId?: string) => {
    const { data } = await supabase.from("quotes").select("*").order("created_at");
    const rows = (data ?? []).map((r) => asQuote(r as Record<string, unknown>));
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
          name: (i as { name?: string }).name ?? "",
          description: i.description,
          qty: (i as { qty_text?: string }).qty_text ?? "",
          amount: (i as { amount_text?: string }).amount_text ?? "",
        })),
      );
    } else {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void loadQuotes();
  }, [loadQuotes]);

  const patch = (changes: Partial<Quote>) =>
    setCurrent((prev) => (prev ? { ...prev, ...changes } : prev));

  const newQuote = async () => {
    const { data } = await supabase
      .from("quotes")
      .insert({
        number: `PRS-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(5, "0")}`,
        issue_date: today(),
        currency: "INR",
        client_company: "New client",
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
        notes: current.notes,
        terms: current.terms,
        status: current.status,
        payment_details: current.payment_details,
        summary: current.summary,
        plans: current.plans,
      })
      .eq("id", current.id);

    await supabase.from("quote_items").delete().eq("quote_id", current.id);
    if (items.length) {
      await supabase.from("quote_items").insert(
        items.map((item, index) => ({
          quote_id: current.id,
          name: item.name,
          description: item.description,
          qty_text: item.qty,
          amount_text: item.amount,
          position: index,
        })),
      );
    }

    if (current.status === "accepted" && !current.project_id) {
      const project = await addProject(
        current.client_company || current.client_name || current.number,
      );
      if (project) {
        await supabase.from("quotes").update({ project_id: project.id }).eq("id", current.id);
        await supabase.from("projects").update({ quote_id: current.id }).eq("id", project.id);
        await refresh();
        setStatus(`Saved — project "${project.name}" created.`);
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
        notes: current.notes,
        terms: current.terms,
        payment_details: current.payment_details,
        summary: current.summary,
        plans: current.plans,
      })
      .select()
      .single();
    if (data && items.length) {
      await supabase.from("quote_items").insert(
        items.map((item, index) => ({
          quote_id: data.id,
          name: item.name,
          description: item.description,
          qty_text: item.qty,
          amount_text: item.amount,
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
            Fill the form, watch the invoice build itself, then print or save as PDF.
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
              {q.number} · {q.client_company || q.client_name || "Untitled"}
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
        <p className="text-sm text-muted-foreground">No quotations yet — create your first one.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ---------------- FORM ---------------- */}
          <section className="space-y-5 rounded-2xl border border-border bg-card p-5 print:hidden">
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                Invoice No
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
                Invoice date
                <input
                  type="date"
                  className={field}
                  value={current.issue_date ?? ""}
                  onChange={(e) => patch({ issue_date: e.target.value })}
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
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-foreground">Bill to</p>
              <div className="grid grid-cols-2 gap-3">
                <label className={labelCls}>
                  Client / company
                  <input
                    className={field}
                    value={current.client_company}
                    onChange={(e) => patch({ client_company: e.target.value })}
                  />
                </label>
                <label className={labelCls}>
                  Attn / department
                  <input
                    className={field}
                    value={current.client_name}
                    onChange={(e) => patch({ client_name: e.target.value })}
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
                  Address
                  <input
                    className={field}
                    value={current.client_address}
                    onChange={(e) => patch({ client_address: e.target.value })}
                  />
                </label>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Line items</span>
                <button
                  onClick={() =>
                    setItems((p) => [...p, { id: tmpId(), name: "", description: "", qty: "", amount: "" }])
                  }
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Add line
                </button>
              </div>
              <div className="mt-2 space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="rounded-xl border border-border/70 p-3">
                    <div className="flex items-center gap-2">
                      <input
                        className={`${field} mt-0 flex-1 font-medium`}
                        placeholder="Item name (e.g. AI CRM Dashboard)"
                        value={item.name}
                        onChange={(e) =>
                          setItems((p) => p.map((x, n) => (n === index ? { ...x, name: e.target.value } : x)))
                        }
                      />
                      <button
                        aria-label="Remove line"
                        onClick={() => setItems((p) => p.filter((_, n) => n !== index))}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-input text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      className={`${field} mt-2`}
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        setItems((p) => p.map((x, n) => (n === index ? { ...x, description: e.target.value } : x)))
                      }
                    />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input
                        className={`${field} mt-0`}
                        placeholder="Qty (e.g. 7/month, Included)"
                        value={item.qty}
                        onChange={(e) =>
                          setItems((p) => p.map((x, n) => (n === index ? { ...x, qty: e.target.value } : x)))
                        }
                      />
                      <input
                        className={`${field} mt-0`}
                        placeholder="Amount (e.g. 50,000.00/year)"
                        value={item.amount}
                        onChange={(e) =>
                          setItems((p) => p.map((x, n) => (n === index ? { ...x, amount: e.target.value } : x)))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoice summary */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Invoice summary</span>
                <button
                  onClick={() => patch({ summary: [...current.summary, { description: "", amount: "" }] })}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Add row
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {current.summary.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      className={`${field} mt-0 flex-1`}
                      placeholder="Description (e.g. Subscription Fee)"
                      value={row.description}
                      onChange={(e) =>
                        patch({
                          summary: current.summary.map((r, n) =>
                            n === index ? { ...r, description: e.target.value } : r,
                          ),
                        })
                      }
                    />
                    <input
                      className={`${field} mt-0 w-40`}
                      placeholder="Amount"
                      value={row.amount}
                      onChange={(e) =>
                        patch({
                          summary: current.summary.map((r, n) =>
                            n === index ? { ...r, amount: e.target.value } : r,
                          ),
                        })
                      }
                    />
                    <button
                      aria-label="Remove summary row"
                      onClick={() => patch({ summary: current.summary.filter((_, n) => n !== index) })}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-input text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription plans */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Subscription details</span>
                <button
                  onClick={() => patch({ plans: [...current.plans, { name: "", cycle: "", period: "" }] })}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Add plan
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {current.plans.map((plan, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                    <input
                      className={`${field} mt-0`}
                      placeholder="Plan name"
                      value={plan.name}
                      onChange={(e) =>
                        patch({ plans: current.plans.map((r, n) => (n === index ? { ...r, name: e.target.value } : r)) })
                      }
                    />
                    <input
                      className={`${field} mt-0`}
                      placeholder="Billing cycle"
                      value={plan.cycle}
                      onChange={(e) =>
                        patch({ plans: current.plans.map((r, n) => (n === index ? { ...r, cycle: e.target.value } : r)) })
                      }
                    />
                    <input
                      className={`${field} mt-0`}
                      placeholder="Period"
                      value={plan.period}
                      onChange={(e) =>
                        patch({ plans: current.plans.map((r, n) => (n === index ? { ...r, period: e.target.value } : r)) })
                      }
                    />
                    <button
                      aria-label="Remove plan"
                      onClick={() => patch({ plans: current.plans.filter((_, n) => n !== index) })}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-input text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <label className={labelCls}>
              Payment details
              <textarea
                rows={2}
                className={field}
                placeholder="To be paid before…, Account name…"
                value={current.payment_details}
                onChange={(e) => patch({ payment_details: e.target.value })}
              />
            </label>
            <label className={labelCls}>
              Terms &amp; conditions
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
              Setting the status to Accepted and saving creates a project for this client.
            </p>
          </section>

          {/* ---------------- INVOICE PREVIEW ---------------- */}
          <section className="print-area rounded-2xl border border-border bg-card p-8 text-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  {companyName || "PRISIM"}
                </h2>
                <p className="mt-2 text-xs">Invoice No: {current.number || "—"}</p>
                <p className="text-xs">Invoice Date: {formatDate(current.issue_date)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                <Logo plain className="h-12 w-auto max-w-[120px]" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Bill To
                  </p>
                  <p className="font-medium">{current.client_company || "—"}</p>
                  {current.client_name && <p>{current.client_name}</p>}
                  {current.client_address && (
                    <p className="whitespace-pre-line">{current.client_address}</p>
                  )}
                  {current.client_email && (
                    <p className="text-muted-foreground">{current.client_email}</p>
                  )}
                </div>
              </div>
            </div>

            <hr className="my-4 border-border" />

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                From
              </p>
              <p className="font-medium">{companyName || "PRISIM"}</p>
              <p>{SENDER.tagline}</p>
              <p>{SENDER.location}</p>
              <p>Website: {SENDER.website}</p>
            </div>

            <table className="mt-6 w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Item</th>
                  <th className="py-2 pr-3">Description</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 text-right">Amount ({current.currency})</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-3 text-muted-foreground">
                      No line items yet.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b border-border/60 align-top">
                      <td className="py-2 pr-3 font-medium">{item.name || "—"}</td>
                      <td className="py-2 pr-3 whitespace-pre-line">{item.description}</td>
                      <td className="py-2 pr-3">{item.qty}</td>
                      <td className="py-2 text-right">{item.amount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {current.summary.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-center text-sm font-semibold">Invoice Summary</p>
                <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                  {current.summary.map((row, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-1">
                      <span className="text-muted-foreground">{row.description}</span>
                      <span className="font-medium">{row.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {current.plans.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold">Subscription Details</p>
                <div className="space-y-2">
                  {current.plans.map((plan, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium">
                        Plan {i + 1}: {plan.name}
                      </p>
                      {plan.cycle && (
                        <p className="text-muted-foreground">Billing Cycle: {plan.cycle}</p>
                      )}
                      {plan.period && (
                        <p className="text-muted-foreground">Subscription Period: {plan.period}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {current.payment_details && (
              <div className="mt-6">
                <p className="mb-1 text-sm font-semibold">Payment Details</p>
                <p className="whitespace-pre-line text-muted-foreground">{current.payment_details}</p>
              </div>
            )}

            {current.terms && (
              <div className="mt-6">
                <p className="mb-1 text-sm font-semibold">Terms &amp; Conditions</p>
                <p className="whitespace-pre-line text-muted-foreground">{current.terms}</p>
              </div>
            )}

            <div className="mt-8 border-t border-border pt-4 text-center">
              <p className="font-medium">Thank you for choosing {companyName || "PRISIM"}.</p>
              <p className="text-xs text-muted-foreground">{FOOTER}</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

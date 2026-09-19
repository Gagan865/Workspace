import { createFileRoute } from "@tanstack/react-router";
import { Plus, Printer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useProjects } from "@/components/projects/projects-store";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCIES, currencyLabel, formatDate, money } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/agreements")({
  head: () => ({
    meta: [
      { title: "Agreements — Workspace" },
      {
        name: "description",
        content:
          "Write client agreements with a live document preview, reorderable terms and print-to-PDF export.",
      },
      { property: "og:title", content: "Agreements — Workspace" },
      {
        property: "og:description",
        content: "Agreement builder with live preview, terms clauses and signature blocks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgreementsPage,
});

type Agreement = {
  id: string;
  title: string;
  party_a: string;
  party_b: string;
  client_email: string;
  scope: string;
  start_date: string | null;
  end_date: string | null;
  fee: number;
  currency: string;
  payment_schedule: string;
  clauses: string[];
  signature_a: string;
  signature_b: string;
  status: string;
  project_id: string | null;
};

const STATUSES = ["draft", "sent", "signed"] as const;

// TCCCPR 2018 Undertaking & Declaration — fixed declaration text; placeholders in
// [brackets] are filled per client. Editable after it's created.
const UNDERTAKING_CLAUSES = [
  "The Company solemnly declares that it is not performing any activities which is in violation of the Telecom Commercial Communications Customer Preference Regulations (TCCCPR) 2018 & its terms and conditions (as amended from time to time).",
  "The Company undertakes to ensure that, at all times, there is no misuse/unauthorized use of the voice connectivity provided to it in any manner & will not make Unsolicited Commercial Communication (UCC) to subscribers across various telecom service providers.",
  "Any commercial communication, with or without the consent of the customer, from non-telemarketing numbers is a violation of the provisions of the TCCCPR 2018 regulations.",
  "The company is required to exclusively use the 140 series for all promotional calls, including calls made to customers with valid opt-in/digital consent.",
  "Failure to comply with the TCCCPR 2018 regulations provide for barring the services, for disconnection or blacklisting of the entire account across all operators for up to two years.",
  "The Company agrees that CloudConnect may be required to disclose the information pertaining to a customer to the Government / Regulatory Authority / security agency. CloudConnect reserves the right to disclose the same at its discretion without prior intimation to the customer.",
  "The Company shall be exclusively responsible for any breach of any conditions included in this Undertaking and/or any act/omission pertaining to usage of services in running their Operations, which is directly attributable to it and the Company will bear all financial losses & consequences arising out of such breach/act/omission.",
];

const field =
  "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand";
const labelCls = "block text-xs font-medium text-muted-foreground";

function AgreementsPage() {
  const { projects, logActivity } = useProjects();
  const [list, setList] = useState<Agreement[]>([]);
  const [current, setCurrent] = useState<Agreement | null>(null);
  const [status, setStatus] = useState("");

  const load = useCallback(async (selectId?: string) => {
    const { data } = await supabase.from("agreements").select("*").order("created_at");
    const rows = (data ?? []).map((row) => ({
      ...row,
      clauses: Array.isArray(row.clauses) ? (row.clauses as string[]) : [],
    })) as unknown as Agreement[];
    setList(rows);
    setCurrent(rows.find((a) => a.id === selectId) ?? rows[0] ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = (changes: Partial<Agreement>) =>
    setCurrent((prev) => (prev ? { ...prev, ...changes } : prev));

  const create = async () => {
    const { data } = await supabase
      .from("agreements")
      .insert({
        title: "Services agreement",
        start_date: new Date().toISOString().slice(0, 10),
        clauses: ["Either party may end this agreement with 30 days' written notice."],
      })
      .select()
      .single();
    if (data) await load(data.id);
  };

  const createUndertaking = async () => {
    const { data } = await supabase
      .from("agreements")
      .insert({
        title: "Undertaking and Declaration",
        party_a: "[Your Company Pvt Ltd] — Authorized Signatory",
        party_b:
          "CloudConnect Communications Private Limited\nA1, 2nd Floor, Ofis Square, Sec 3, U.P. 20130, IN",
        start_date: new Date().toISOString().slice(0, 10),
        fee: 0,
        scope:
          "Subject: Undertaking for usage of services as per TCCCPR regulations, 2018.\n\nI, [Name of Authorized Signatory], Authorized signatory of [Name of the Company], having registered office at [Address of the company], hereby declare the following:",
        clauses: UNDERTAKING_CLAUSES,
        signature_a: "[Name] · [Designation] · [Place] · [Date]",
      })
      .select()
      .single();
    if (data) await load(data.id);
  };

  const save = async () => {
    if (!current) return;
    setStatus("Saving…");
    await supabase
      .from("agreements")
      .update({
        title: current.title,
        party_a: current.party_a,
        party_b: current.party_b,
        client_email: current.client_email,
        scope: current.scope,
        start_date: current.start_date,
        end_date: current.end_date,
        fee: current.fee,
        currency: current.currency,
        payment_schedule: current.payment_schedule,
        clauses: current.clauses,
        signature_a: current.signature_a,
        signature_b: current.signature_b,
        status: current.status,
        project_id: current.project_id,
      })
      .eq("id", current.id);
    logActivity({
      action: "updated",
      entity: "agreement",
      summary: `updated the agreement “${current.title || "Untitled"}”`,
    });
    setStatus("Saved.");
    await load(current.id);
  };

  const remove = async () => {
    if (!current || !window.confirm("Delete this agreement?")) return;
    await supabase.from("agreements").delete().eq("id", current.id);
    await load();
  };

  const moveClause = (index: number, delta: number) => {
    if (!current) return;
    const next = [...current.clauses];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    patch({ clauses: next });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">
      <header className="mb-5 flex flex-wrap items-center gap-3 print:hidden">
        <div className="mr-auto">
          <h1 className="font-display text-xl font-semibold">Agreements</h1>
          <p className="text-xs text-muted-foreground">
            Write one any time — on its own, or linked to a project.
          </p>
        </div>
        <select
          value={current?.id ?? ""}
          onChange={(e) => void load(e.target.value)}
          aria-label="Choose agreement"
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          {list.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title || "Untitled"} · {a.party_b || "—"}
            </option>
          ))}
        </select>
        <button
          onClick={createUndertaking}
          className="inline-flex items-center gap-1.5 rounded-xl border border-input px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          <Plus className="h-4 w-4" /> Undertaking (TCCCPR)
        </button>
        <button
          onClick={create}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New agreement
        </button>
      </header>

      {!current ? (
        <p className="text-sm text-muted-foreground">No agreements yet — create your first one.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5 print:hidden">
            <label className={labelCls}>
              Title
              <input
                className={field}
                value={current.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                Your side
                <input
                  className={field}
                  value={current.party_a}
                  onChange={(e) => patch({ party_a: e.target.value })}
                />
              </label>
              <label className={labelCls}>
                Client side
                <input
                  className={field}
                  value={current.party_b}
                  onChange={(e) => patch({ party_b: e.target.value })}
                />
              </label>
              <label className={labelCls}>
                Client email
                <input
                  type="email"
                  className={field}
                  value={current.client_email}
                  onChange={(e) => patch({ client_email: e.target.value })}
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
                Start date
                <input
                  type="date"
                  className={field}
                  value={current.start_date ?? ""}
                  onChange={(e) => patch({ start_date: e.target.value })}
                />
              </label>
              <label className={labelCls}>
                End date
                <input
                  type="date"
                  className={field}
                  value={current.end_date ?? ""}
                  onChange={(e) => patch({ end_date: e.target.value })}
                />
              </label>
              <label className={labelCls}>
                Fee
                <input
                  type="number"
                  className={field}
                  value={current.fee}
                  onChange={(e) => patch({ fee: Number(e.target.value) })}
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
                    <option key={c} value={c}>
                      {currencyLabel(c)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className={labelCls}>
              Linked project
              <select
                className={field}
                value={current.project_id ?? ""}
                onChange={(e) => patch({ project_id: e.target.value || null })}
              >
                <option value="">Not linked</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelCls}>
              Scope of work
              <textarea
                rows={4}
                className={field}
                value={current.scope}
                onChange={(e) => patch({ scope: e.target.value })}
              />
            </label>
            <label className={labelCls}>
              Payment schedule
              <textarea
                rows={2}
                className={field}
                value={current.payment_schedule}
                onChange={(e) => patch({ payment_schedule: e.target.value })}
              />
            </label>

            <div>
              <div className="flex items-center justify-between">
                <span className={labelCls}>Terms</span>
                <button
                  onClick={() => patch({ clauses: [...current.clauses, ""] })}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Add clause
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {current.clauses.map((clause, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <textarea
                      rows={2}
                      className={`${field} flex-1`}
                      value={clause}
                      onChange={(e) =>
                        patch({
                          clauses: current.clauses.map((c, n) =>
                            n === index ? e.target.value : c,
                          ),
                        })
                      }
                    />
                    <div className="mt-1 flex flex-col gap-1">
                      <button
                        aria-label="Move clause up"
                        onClick={() => moveClause(index, -1)}
                        className="rounded-lg border border-input px-2 text-xs"
                      >
                        ↑
                      </button>
                      <button
                        aria-label="Move clause down"
                        onClick={() => moveClause(index, 1)}
                        className="rounded-lg border border-input px-2 text-xs"
                      >
                        ↓
                      </button>
                      <button
                        aria-label="Remove clause"
                        onClick={() =>
                          patch({ clauses: current.clauses.filter((_, n) => n !== index) })
                        }
                        className="rounded-lg border border-input px-2 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                Signature — your side
                <input
                  className={field}
                  value={current.signature_a}
                  onChange={(e) => patch({ signature_a: e.target.value })}
                />
              </label>
              <label className={labelCls}>
                Signature — client
                <input
                  className={field}
                  value={current.signature_b}
                  onChange={(e) => patch({ signature_b: e.target.value })}
                />
              </label>
            </div>

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
                onClick={remove}
                className="ml-auto text-xs text-muted-foreground hover:text-destructive"
              >
                Delete
              </button>
            </div>
            {status && <p className="text-xs text-muted-foreground">{status}</p>}
          </section>

          <section className="print-area rounded-2xl border border-border bg-card p-8 text-sm">
            <h2 className="font-display text-2xl font-semibold">{current.title || "Agreement"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(current.start_date)} — {formatDate(current.end_date)}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Between</p>
                <p className="font-medium">{current.party_a || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">And</p>
                <p className="font-medium whitespace-pre-line">{current.party_b || "—"}</p>
                {current.client_email && (
                  <p className="text-muted-foreground">{current.client_email}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Scope of work</p>
              <p className="whitespace-pre-line">{current.scope || "—"}</p>
            </div>

            {(Number(current.fee) > 0 || current.payment_schedule) && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Fee</p>
                {Number(current.fee) > 0 && <p>{money(Number(current.fee), current.currency)}</p>}
                {current.payment_schedule && (
                  <p className="whitespace-pre-line text-muted-foreground">
                    {current.payment_schedule}
                  </p>
                )}
              </div>
            )}

            {current.clauses.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Terms</p>
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  {current.clauses.map((clause, index) => (
                    <li key={index} className="whitespace-pre-line">
                      {clause}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mt-10 grid grid-cols-2 gap-8">
              <div>
                <div className="h-10 border-b border-border" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {current.signature_a || current.party_a || "Signature"}
                </p>
              </div>
              <div>
                <div className="h-10 border-b border-border" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {current.signature_b || current.party_b || "Signature"}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

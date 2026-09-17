import { useState, type ReactNode } from "react";

import { useProjects } from "@/components/projects/projects-store";
import { supabase } from "@/integrations/supabase/client";

// Blocks the workspace until the signed-in user belongs to a company. Invited
// teammates auto-join on sign-in, so this only appears for someone starting fresh.
export function CompanyGate({ children }: { children: ReactNode }) {
  const { ready, hasCompany, createCompany } = useProjects();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    );
  }

  if (hasCompany) return <>{children}</>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await createCompany(name.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-soft">
            <span className="font-display text-sm font-bold">P</span>
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold">Create your company</h1>
            <p className="text-xs text-muted-foreground">Your team’s shared workspace</p>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <label className="block text-xs font-medium text-muted-foreground">
            Company name
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Co"
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="mt-4 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create company"}
          </button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Were you invited? Ask your admin to add your email, then sign in with it — you’ll land
            straight in their company.
          </p>
        </form>

        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/auth";
          }}
          className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

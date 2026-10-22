import { useEffect, useState, type ReactNode } from "react";

import { Logo } from "@/components/logo";
import { useProjects } from "@/components/projects/projects-store";
import { supabase } from "@/integrations/supabase/client";

// Invite-only: a signed-in user who hasn't been invited to a workspace can't
// create their own — they wait for an invite. Invited users auto-join on sign-in.
export function CompanyGate({ children }: { children: ReactNode }) {
  const { ready, hasCompany, refresh } = useProjects();
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    );
  }

  if (hasCompany) return <>{children}</>;

  const checkAgain = async () => {
    setChecking(true);
    try {
      await refresh();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <Logo className="h-11 w-11" />
          <div>
            <h1 className="font-display text-lg font-semibold">You’re not in a workspace yet</h1>
            <p className="text-xs text-muted-foreground">Joining is invite-only</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <p className="text-sm text-foreground">
            Ask your workspace owner to invite{" "}
            {email ? <span className="font-medium">{email}</span> : "your email"} from{" "}
            <span className="whitespace-nowrap">Settings → Team</span>. Once they do, come back here
            and check again — you’ll land straight in their workspace.
          </p>

          <button
            type="button"
            onClick={checkAgain}
            disabled={checking}
            className="mt-4 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {checking ? "Checking…" : "I’ve been invited — check again"}
          </button>
        </div>

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

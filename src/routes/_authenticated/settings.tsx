import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { OnboardingDialog } from "@/components/projects/onboarding-dialog";
import { PersonAvatar } from "@/components/projects/person-avatar";
import { useProjects } from "@/components/projects/projects-store";
import { ROLES } from "@/components/projects/types";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Workspace" },
      {
        name: "description",
        content:
          "Manage your team, choose when daily task reminders arrive, switch payment reminders on or off, and manage your account.",
      },
      { property: "og:title", content: "Settings — Workspace" },
      {
        property: "og:description",
        content: "Team, reminder timing, payment reminders and account controls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const roleLabel = (id: string) => ROLES.find((r) => r.id === id)?.label ?? id;

function SettingsPage() {
  const navigate = useNavigate();
  const store = useProjects();
  const [email, setEmail] = useState("");
  const [dailyEnabled, setDailyEnabled] = useState(true);
  const [dailyTime, setDailyTime] = useState("18:00");
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [status, setStatus] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [companyDraft, setCompanyDraft] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      setEmail(userData.user?.email ?? "");
      const { data } = await supabase.from("reminder_settings").select("*").maybeSingle();
      if (data) {
        setDailyEnabled(data.daily_enabled);
        setDailyTime(data.daily_time);
        setPaymentEnabled(data.payment_enabled);
      }
    })();
  }, []);

  useEffect(() => {
    setCompanyDraft(store.companyName);
  }, [store.companyName]);

  const save = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase.from("reminder_settings").upsert({
      user_id: userData.user.id,
      daily_enabled: dailyEnabled,
      daily_time: dailyTime,
      payment_enabled: paymentEnabled,
    });
    setStatus("Saved.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-6">
      <h1 className="font-display text-xl font-semibold">Settings</h1>
      <p className="text-xs text-muted-foreground">Signed in as {email}</p>

      {/* Team */}
      <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Team</h2>
          {store.isAdmin && (
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:opacity-90"
            >
              <UserPlus className="h-3.5 w-3.5" /> Invite teammate
            </button>
          )}
        </div>

        {store.isAdmin ? (
          <label className="block text-xs font-medium text-muted-foreground">
            Company name
            <div className="mt-1 flex gap-2">
              <input
                value={companyDraft}
                onChange={(e) => setCompanyDraft(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
              <button
                onClick={() => store.renameCompany(companyDraft.trim() || store.companyName)}
                className="rounded-xl border border-input px-3 py-2 text-xs hover:bg-accent"
              >
                Rename
              </button>
            </div>
          </label>
        ) : (
          <p className="text-sm">
            <span className="text-muted-foreground">Company:</span> {store.companyName}
          </p>
        )}

        <div>
          <p className="mb-2 text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
            Members ({store.members.length})
          </p>
          <ul className="space-y-2">
            {store.members.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <PersonAvatar member={m} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.title || "Team member"} · {m.email}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {roleLabel(m.role)}
                </span>
                {store.isAdmin && m.email !== email && (
                  <button
                    aria-label={`Remove ${m.name}`}
                    onClick={() => {
                      if (window.confirm(`Remove ${m.name} from ${store.companyName}? Their tasks become unassigned.`))
                        store.removeMember(m.id);
                    }}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {store.invites.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
              Pending invites ({store.invites.length})
            </p>
            <ul className="space-y-2">
              {store.invites.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{i.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {roleLabel(i.role)} · awaiting sign-in
                    </p>
                  </div>
                  {store.isAdmin && (
                    <button
                      aria-label={`Cancel invite for ${i.email}`}
                      onClick={() => store.cancelInvite(i.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Reminders */}
      <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-5">
        <label className="flex items-center justify-between gap-3 text-sm">
          Daily task update reminders
          <input
            type="checkbox"
            checked={dailyEnabled}
            onChange={(e) => setDailyEnabled(e.target.checked)}
            className="h-4 w-4 accent-[var(--brand)]"
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          Reminder time
          <input
            type="time"
            value={dailyTime}
            onChange={(e) => setDailyTime(e.target.value)}
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          Payment collection reminders
          <input
            type="checkbox"
            checked={paymentEnabled}
            onChange={(e) => setPaymentEnabled(e.target.checked)}
            className="h-4 w-4 accent-[var(--brand)]"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
          >
            Save
          </button>
          {status && <span className="text-xs text-muted-foreground">{status}</span>}
        </div>
      </div>

      <button
        onClick={signOut}
        className="mt-6 rounded-xl border border-input px-4 py-2 text-sm hover:bg-accent"
      >
        Sign out
      </button>

      <OnboardingDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        suggestedColorId={store.freeColorId()}
        onInvite={store.inviteMember}
      />
    </div>
  );
}

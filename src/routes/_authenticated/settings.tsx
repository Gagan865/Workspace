import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Workspace" },
      {
        name: "description",
        content:
          "Choose when daily task reminders arrive, switch payment reminders on or off, and manage your account.",
      },
      { property: "og:title", content: "Settings — Workspace" },
      {
        property: "og:description",
        content: "Reminder timing, payment reminders and account controls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [dailyEnabled, setDailyEnabled] = useState(true);
  const [dailyTime, setDailyTime] = useState("18:00");
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [status, setStatus] = useState("");

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
    </div>
  );
}

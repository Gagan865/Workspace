import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Workspace" },
      {
        name: "description",
        content:
          "Sign in to your workspace for company projects, quotations, agreements and your daily planner.",
      },
      { property: "og:title", content: "Sign in — Workspace" },
      {
        property: "og:description",
        content: "Projects, quotations, agreements, money reminders and a daily planner.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/planner", replace: true });
    });
  }, [navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpError) setError(signUpError.message);
      else if (data.session) navigate({ to: "/planner" });
      else setMessage("Check your email to confirm your account, then sign in.");
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message);
      else navigate({ to: "/planner" });
    }
    setBusy(false);
  };

  const google = async () => {
    setError("");
    // Native Supabase OAuth: this redirects the browser to Google, then back to
    // redirectTo, where the client picks up the session via detectSessionInUrl.
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) {
      setError("Google sign-in could not be completed. Please try again.");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-soft">
            <span className="font-display text-sm font-bold">W</span>
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold">Workspace</h1>
            <p className="text-xs text-muted-foreground">
              Projects, quotations and your daily planner
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-base font-semibold">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h2>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block text-xs font-medium text-muted-foreground">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={google}
            className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Continue with Google
          </button>

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
          {message && <p className="mt-3 text-xs text-muted-foreground">{message}</p>}

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

import { PersonAvatar } from "@/components/projects/person-avatar";
import { useProjects } from "@/components/projects/projects-store";
import { type Activity } from "@/lib/activity";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Workspace" },
      {
        name: "description",
        content: "Live company activity feed: who updated projects, leads, quotes and agreements.",
      },
      { property: "og:title", content: "Notifications — Workspace" },
      { property: "og:description", content: "Live company activity feed." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: NotificationsPage,
});

const relTime = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

function ViewLink({ a }: { a: Activity }) {
  const cls = "shrink-0 text-xs font-medium text-brand hover:underline";
  if (a.projectId)
    return (
      <Link to="/projects/$projectId" params={{ projectId: a.projectId }} className={cls}>
        View →
      </Link>
    );
  if (a.entity === "quote")
    return (
      <Link to="/quotes" className={cls}>
        View →
      </Link>
    );
  if (a.entity === "agreement")
    return (
      <Link to="/agreements" className={cls}>
        View →
      </Link>
    );
  if (a.entity === "member")
    return (
      <Link to="/settings" className={cls}>
        View →
      </Link>
    );
  return null;
}

function NotificationsPage() {
  const { notifications, members, myUserId, markNotificationsSeen, companyName } = useProjects();

  useEffect(() => {
    markNotificationsSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  return (
    <div className="mx-auto flex h-[calc(100vh-1px)] max-w-2xl flex-col px-4 py-6 md:h-screen">
      <header className="mb-4">
        <h1 className="font-display text-xl font-semibold">Notifications</h1>
        <p className="text-xs text-muted-foreground">
          Live activity in {companyName || "your company"} · a sound plays when a teammate acts
        </p>
      </header>

      <div className="flex flex-1 flex-col-reverse gap-3 overflow-y-auto rounded-2xl border border-border bg-card/60 p-4">
        {notifications.length === 0 ? (
          <p className="m-auto text-sm text-muted-foreground">
            No activity yet. When someone updates the board, leads, a quote or an agreement, it
            shows up here.
          </p>
        ) : (
          notifications.map((a) => {
            const actor = members.find((m) => m.userId === a.actorId);
            const mine = a.actorId === myUserId;
            const name = mine ? "You" : actor?.name ?? "A teammate";
            return (
              <div
                key={a.id}
                className={cn("flex items-end gap-2", mine ? "flex-row-reverse" : "flex-row")}
              >
                {!mine && <PersonAvatar member={actor} size="sm" />}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-soft",
                    mine
                      ? "rounded-br-sm bg-brand text-brand-foreground"
                      : "rounded-bl-sm bg-background",
                  )}
                >
                  {!mine && (
                    <p className="mb-0.5 text-xs font-semibold text-brand">{name}</p>
                  )}
                  <p className="leading-snug">
                    <span className={cn(mine ? "" : "font-medium")}>{mine ? "You " : ""}</span>
                    {a.summary}
                  </p>
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-3",
                      mine ? "justify-end" : "justify-between",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px]",
                        mine ? "text-brand-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {relTime(a.createdAt)}
                    </span>
                    {!mine && <ViewLink a={a} />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

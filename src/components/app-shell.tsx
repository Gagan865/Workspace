import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  FileSignature,
  FileText,
  KanbanSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Sun,
  Wallet,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/logo";
import { useProjects } from "@/components/projects/projects-store";
import { type ProjectKind } from "@/components/projects/types";
import { ACCENTS, useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/projects", label: "Company Projects", hint: "Kanban board", icon: KanbanSquare },
  { to: "/quotes", label: "Quotations", hint: "Build & send quotes", icon: FileText },
  { to: "/agreements", label: "Agreements", hint: "Contracts & terms", icon: FileSignature },
  { to: "/money", label: "Money", hint: "Payments & collection", icon: Wallet },
  { to: "/reports", label: "Reports", hint: "Owner overview", icon: BarChart3 },
  { to: "/calendar", label: "Calendar", hint: "Due dates & reminders", icon: CalendarDays },
  { to: "/planner", label: "Personal Planner", hint: "Daily journal", icon: CalendarCheck },
  { to: "/settings", label: "Settings", hint: "Reminders & account", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [newProject, setNewProject] = useState("");
  const [newKind, setNewKind] = useState<ProjectKind>("business");
  const { projects, addProject, isAdmin } = useProjects();
  const navigate = useNavigate();
  const { mode, toggleMode, accent, setAccent } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = NAV.filter((item) => item.to !== "/reports" || isAdmin);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out md:flex",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-5">
          <Logo className="h-10 w-10" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold">PRISIM</p>
              <p className="truncate text-xs text-muted-foreground">Projects & planner</p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <div key={item.to}>
                <Link
                  to={item.to}
                  title={item.label}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-brand-soft text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn("h-[18px] w-[18px] shrink-0", active && "text-brand")}
                    strokeWidth={2}
                  />
                  {!collapsed && (
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{item.label}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {item.hint}
                      </span>
                    </span>
                  )}
                  {!collapsed && active && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                </Link>

                {item.to === "/projects" && !collapsed && (
                  <div className="mt-1 mb-2 ml-4 space-y-0.5 border-l border-sidebar-border pl-3">
                    {projects.map((project) => {
                      const current = pathname === `/projects/${project.id}`;
                      return (
                        <Link
                          key={project.id}
                          to="/projects/$projectId"
                          params={{ projectId: project.id }}
                          className={cn(
                            "block truncate rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                            current
                              ? "bg-sidebar-accent font-medium text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {project.name}
                        </Link>
                      );
                    })}
                    <div className="flex gap-1 pt-1.5" role="group" aria-label="New project type">
                      {(["business", "software"] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setNewKind(k)}
                          aria-pressed={newKind === k}
                          className={cn(
                            "flex-1 rounded-lg px-2 py-1 text-[10px] font-medium capitalize transition-colors",
                            newKind === k
                              ? "bg-brand text-brand-foreground"
                              : "border border-sidebar-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const name = newProject.trim();
                        if (!name) return;
                        setNewProject("");
                        const created = await addProject(name, newKind);
                        if (!created) return;
                        navigate({
                          to: "/projects/$projectId",
                          params: { projectId: created.id },
                        });
                      }}
                      className="flex items-center gap-1 pt-1"
                    >
                      <input
                        value={newProject}
                        onChange={(e) => setNewProject(e.target.value)}
                        placeholder="New project…"
                        aria-label="New project name"
                        className="min-w-0 flex-1 rounded-lg border border-sidebar-border bg-transparent px-2 py-1.5 text-xs outline-none focus:border-brand"
                      />
                      <button
                        type="submit"
                        aria-label="Add project"
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-brand-foreground transition-opacity hover:opacity-90"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="space-y-4 border-t border-sidebar-border p-3">
          <div className={cn("flex flex-wrap gap-2", collapsed && "justify-center")}>
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccent(a.id)}
                title={a.label}
                aria-label={`Use ${a.label} accent`}
                aria-pressed={accent === a.id}
                className={cn(
                  "h-6 w-6 rounded-full ring-offset-2 ring-offset-sidebar transition-transform hover:scale-110",
                  accent === a.id && "ring-2 ring-foreground/60",
                )}
                style={{ backgroundColor: a.swatch }}
              />
            ))}
          </div>

          <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
            <button
              type="button"
              onClick={toggleMode}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sidebar-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              {mode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {!collapsed && <span>{mode === "dark" ? "Dark" : "Light"}</span>}
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-sidebar-border text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border bg-sidebar px-4 py-3 md:hidden">
          <Logo className="h-9 w-9 rounded-xl" />
          <div className="flex min-w-0 flex-1 gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex-1 truncate rounded-lg px-2 py-2 text-center text-xs font-medium",
                  pathname.startsWith(item.to)
                    ? "bg-brand-soft text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.label.split(" ").at(-1)}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleMode}
            aria-label="Toggle dark mode"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground"
          >
            {mode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

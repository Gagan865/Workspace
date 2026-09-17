import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KanbanSquare, MoreHorizontal, Plus, Settings2, Table2, UserPlus } from "lucide-react";
import { useState } from "react";

import { MemberColorPicker } from "@/components/projects/member-color-picker";
import { OnboardingDialog } from "@/components/projects/onboarding-dialog";
import { useProjects } from "@/components/projects/projects-store";
import { TaskBoard } from "@/components/projects/task-board";
import { TaskDialog } from "@/components/projects/task-dialog";
import { TaskTable } from "@/components/projects/task-table";
import { WorkflowEditor } from "@/components/projects/workflow-editor";
import { uid, type Stage, type Task } from "@/components/projects/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project board — Company Projects" },
      {
        name: "description",
        content:
          "Run a single project with its own workflow stages, a kanban board, a sortable task table, time logged versus remaining, and colour-coded teammates.",
      },
      { property: "og:title", content: "Project board — Company Projects" },
      {
        property: "og:description",
        content:
          "Switch between board and table views, edit this project's stages, track time, and see who owns what by colour.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const store = useProjects();

  const project = store.projects.find((p) => p.id === projectId);
  const tasks = store.tasks.filter((t) => t.projectId === projectId);
  const members = store.members;

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [view, setView] = useState<"board" | "table">("board");
  const [taskOpen, setTaskOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  if (!project) {
    return (
      <div className="surface-board flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Project not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick another project from the sidebar.
          </p>
        </div>
      </div>
    );
  }

  const stages = project.stages;
  const counts: Record<string, number> = {};
  for (const stage of stages) counts[stage.id] = tasks.filter((t) => t.stageId === stage.id).length;

  const openNew = () => {
    setEditing(null);
    setTaskOpen(true);
  };

  const openTask = (task: Task) => {
    setEditing(task);
    setTaskOpen(true);
  };

  const quickAdd = (stageId: string) => {
    const title = (drafts[stageId] ?? "").trim();
    if (!title) return;
    store.saveTask({
      id: uid("task"),
      projectId: project.id,
      title,
      description: "",
      tag: "New",
      ownerId: members[0]?.id ?? "",
      due: "",
      priority: "medium",
      stageId,
      logged: 0,
      remaining: 4,
    });
    setDrafts((prev) => ({ ...prev, [stageId]: "" }));
  };

  const changeStages = (next: Stage[], removedId?: string) =>
    store.setProjectStages(project.id, next, removedId);

  const removeProject = () => {
    if (!window.confirm(`Delete “${project.name}” and all of its tasks?`)) return;
    const remaining = store.projects.filter((p) => p.id !== project.id);
    store.removeProject(project.id);
    const next = remaining[0];
    if (next) navigate({ to: "/projects/$projectId", params: { projectId: next.id } });
    else navigate({ to: "/planner" });
  };

  const totalLogged = tasks.reduce((sum, t) => sum + t.logged, 0);
  const totalRemaining = tasks.reduce((sum, t) => sum + t.remaining, 0);

  return (
    <div className="surface-board min-h-screen">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-8 sm:py-12">
        <header className="mb-8 space-y-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
                Company Projects
              </p>
              <div className="mt-2 flex items-center gap-2">
                {renaming ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = nameDraft.trim();
                      if (name) store.renameProject(project.id, name);
                      setRenaming(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      autoFocus
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      className="h-10 w-64 text-lg font-semibold"
                    />
                    <Button type="submit" size="sm">
                      Save
                    </Button>
                  </form>
                ) : (
                  <h1 className="truncate text-3xl font-semibold sm:text-4xl">{project.name}</h1>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label="Project actions"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => {
                        setNameDraft(project.name);
                        setRenaming(true);
                      }}
                    >
                      Rename project
                    </DropdownMenuItem>
                    {store.isAdmin && (
                      <DropdownMenuItem onClick={removeProject} className="text-destructive">
                        Delete project
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {tasks.length} tasks across {stages.length} stages · {totalLogged}h logged ·{" "}
                {totalRemaining}h remaining
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-border/70 bg-card/80 p-1">
                {(
                  [
                    { id: "board", label: "Board", icon: KanbanSquare },
                    { id: "table", label: "Table", icon: Table2 },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setView(option.id)}
                    aria-pressed={view === option.id}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      view === option.id
                        ? "bg-brand text-brand-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <option.icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setWorkflowOpen(true)}>
                <Settings2 className="mr-1.5 h-4 w-4" />
                Workflow
              </Button>
              <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="mr-1.5 h-4 w-4" />
                Invite team
              </Button>
              <Button size="sm" onClick={openNew}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add task
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
              Team
            </span>
            <ul className="flex flex-wrap items-center gap-1.5">
              {members.map((m) => (
                <li key={m.id}>
                  <MemberColorPicker
                    member={m}
                    onPick={(colorId) => store.setMemberColor(m.id, colorId)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </header>

        {view === "board" ? (
          <TaskBoard
            stages={stages}
            tasks={tasks}
            members={members}
            drafts={drafts}
            onDraftChange={(stageId, value) => setDrafts((p) => ({ ...p, [stageId]: value }))}
            onQuickAdd={quickAdd}
            onMove={store.moveTask}
            onOpen={openTask}
            onDelete={store.deleteTask}
            onLogUpdate={store.logTaskUpdate}
          />
        ) : (
          <TaskTable stages={stages} tasks={tasks} members={members} onOpen={openTask} />
        )}
      </div>

      <TaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        task={editing}
        projectId={project.id}
        defaultStageId={stages[0]?.id ?? ""}
        stages={stages}
        members={members}
        onSave={store.saveTask}
        onDelete={store.deleteTask}
      />
      <WorkflowEditor
        open={workflowOpen}
        onOpenChange={setWorkflowOpen}
        stages={stages}
        counts={counts}
        onChange={changeStages}
      />
      <OnboardingDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        suggestedColorId={store.freeColorId()}
        onInvite={store.inviteMember}
      />
    </div>
  );
}

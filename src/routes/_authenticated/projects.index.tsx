import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useProjects } from "@/components/projects/projects-store";

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectsIndex,
});

function ProjectsIndex() {
  const { ready, projects } = useProjects();
  const navigate = useNavigate();

  useEffect(() => {
    const first = projects[0];
    if (ready && first) {
      navigate({ to: "/projects/$projectId", params: { projectId: first.id }, replace: true });
    }
  }, [ready, projects, navigate]);

  return (
    <div className="p-10 text-sm text-muted-foreground">
      {ready && projects.length === 0
        ? "No projects yet — add one from the sidebar."
        : "Loading projects…"}
    </div>
  );
}

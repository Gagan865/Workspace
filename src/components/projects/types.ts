export type Stage = { id: string; label: string };

export type Priority = "low" | "medium" | "high";

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  tag: string;
  ownerId: string;
  due: string;
  priority: Priority;
  stageId: string;
  logged: number;
  remaining: number;
  lastUpdateAt?: string | undefined;
};

export type TeamRole = "owner" | "manager" | "contributor" | "viewer";

export type PersonColorId =
  | "p1"
  | "p2"
  | "p3"
  | "p4"
  | "p5"
  | "p6"
  | "p7"
  | "p8"
  | "p9"
  | "p10"
  | "p11"
  | "p12";

export type Member = {
  id: string; // company_members.id — also the task assignee id
  userId: string; // the person's auth user id
  name: string;
  email: string;
  title: string;
  role: TeamRole;
  colorId: PersonColorId;
};

export type Invite = {
  id: string;
  email: string;
  role: TeamRole;
  title: string;
  colorId: PersonColorId;
};

export type ProjectKind = "software" | "business";

export type Project = {
  id: string;
  name: string;
  kind: ProjectKind;
  stages: Stage[];
  quoteId?: string | undefined;
};

// A single day's lead count for a business project.
export type LeadDay = { projectId: string; day: string; count: number };

export const PERSON_COLORS: { id: PersonColorId; label: string; index: number }[] = [
  { id: "p1", label: "Ruby", index: 1 },
  { id: "p2", label: "Ember", index: 2 },
  { id: "p3", label: "Amber", index: 3 },
  { id: "p4", label: "Olive", index: 4 },
  { id: "p5", label: "Emerald", index: 5 },
  { id: "p6", label: "Teal", index: 6 },
  { id: "p7", label: "Sky", index: 7 },
  { id: "p8", label: "Cobalt", index: 8 },
  { id: "p9", label: "Indigo", index: 9 },
  { id: "p10", label: "Violet", index: 10 },
  { id: "p11", label: "Magenta", index: 11 },
  { id: "p12", label: "Rose", index: 12 },
];

export const personVars = (colorId: PersonColorId | undefined) => {
  const found = PERSON_COLORS.find((c) => c.id === colorId) ?? PERSON_COLORS[0]!;
  return {
    solid: `var(--person-${found.index})`,
    soft: `var(--person-${found.index}-soft)`,
    ink: `var(--person-${found.index}-ink)`,
  };
};

export const nextColorId = (taken: PersonColorId[]): PersonColorId =>
  PERSON_COLORS.find((c) => !taken.includes(c.id))?.id ?? PERSON_COLORS[0]!.id;

export const ROLES: { id: TeamRole; label: string; blurb: string }[] = [
  { id: "owner", label: "Owner", blurb: "Full control, including billing and team." },
  { id: "manager", label: "Manager", blurb: "Can edit the workflow and every task." },
  { id: "contributor", label: "Contributor", blurb: "Can create and update their own tasks." },
  { id: "viewer", label: "Viewer", blurb: "Read-only access to boards and reports." },
];

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

let counter = 0;
export const uid = (prefix = "id") => `${prefix}-${++counter}`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "—";

export const defaultStages = (): Stage[] => [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To Do" },
  { id: "doing", label: "In Progress" },
  { id: "done", label: "Done" },
];

export const formatDue = (value: string) => {
  if (!value) return "No date";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[m - 1]} ${d}`;
};

export const progressOf = (task: Task) => {
  const total = task.logged + task.remaining;
  return total === 0 ? 0 : Math.round((task.logged / total) * 100);
};

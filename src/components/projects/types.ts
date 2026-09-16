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
  id: string;
  name: string;
  email: string;
  title: string;
  role: TeamRole;
  colorId: PersonColorId;
};

export type Project = {
  id: string;
  name: string;
  stages: Stage[];
  quoteId?: string | undefined;
};

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

export type SeedMember = Omit<Member, "id">;

export const SEED_MEMBERS: SeedMember[] = [
  {
    name: "Riya Sharma",
    email: "riya@company.com",
    title: "Ops Lead",
    role: "manager",
    colorId: "p8",
  },
  {
    name: "Adam Moore",
    email: "adam@company.com",
    title: "Designer",
    role: "contributor",
    colorId: "p3",
  },
  {
    name: "Jo Kim",
    email: "jo@company.com",
    title: "People Partner",
    role: "manager",
    colorId: "p5",
  },
  {
    name: "Dana Nkosi",
    email: "dana@company.com",
    title: "Product",
    role: "owner",
    colorId: "p11",
  },
];

export type SeedTask = {
  title: string;
  description: string;
  tag: string;
  memberIndex: number;
  stageIndex: number;
  due: string;
  priority: Priority;
  logged: number;
  remaining: number;
};

export const SEED_PROJECTS: { name: string; tasks: SeedTask[] }[] = [
  {
    name: "Warehouse Revamp",
    tasks: [
      {
        title: "Vendor consolidation study",
        description: "Compare the three shortlisted suppliers on cost and lead time.",
        tag: "Ops",
        memberIndex: 0,
        stageIndex: 0,
        due: "2026-10-02",
        priority: "medium",
        logged: 3,
        remaining: 9,
      },
      {
        title: "Warehouse dashboard v2",
        description: "Live stock levels with alerts for low-inventory SKUs.",
        tag: "Product",
        memberIndex: 3,
        stageIndex: 2,
        due: "2026-09-19",
        priority: "high",
        logged: 14,
        remaining: 6,
      },
      {
        title: "Annual security review",
        description: "Access audit across all internal tools and shared drives.",
        tag: "IT",
        memberIndex: 0,
        stageIndex: 2,
        due: "2026-09-22",
        priority: "medium",
        logged: 8,
        remaining: 4,
      },
    ],
  },
  {
    name: "Brand Refresh",
    tasks: [
      {
        title: "Brand refresh guidelines",
        description: "Document logo usage, colour and type for the new identity.",
        tag: "Brand",
        memberIndex: 1,
        stageIndex: 0,
        due: "2026-10-09",
        priority: "low",
        logged: 0,
        remaining: 16,
      },
      {
        title: "Customer onboarding audit",
        description: "Walk the first-week journey and log every friction point.",
        tag: "Growth",
        memberIndex: 1,
        stageIndex: 1,
        due: "2026-09-29",
        priority: "medium",
        logged: 2,
        remaining: 10,
      },
    ],
  },
  {
    name: "Q4 Hiring",
    tasks: [
      {
        title: "Q4 hiring plan",
        description: "Headcount, levels and budget for two new squads.",
        tag: "People",
        memberIndex: 2,
        stageIndex: 1,
        due: "2026-09-24",
        priority: "high",
        logged: 4,
        remaining: 6,
      },
      {
        title: "Partner contract renewal",
        description: "Signed and filed with legal.",
        tag: "Legal",
        memberIndex: 2,
        stageIndex: 3,
        due: "2026-09-12",
        priority: "low",
        logged: 6,
        remaining: 0,
      },
    ],
  },
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

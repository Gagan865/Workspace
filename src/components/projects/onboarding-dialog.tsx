import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PersonAvatar } from "./person-avatar";
import {
  PERSON_COLORS,
  ROLES,
  personVars,
  uid,
  type Member,
  type PersonColorId,
  type TeamRole,
} from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (member: Member) => void;
  suggestedColorId: PersonColorId;
};

const STEPS = ["Person", "Access", "Review"];

export function OnboardingDialog({ open, onOpenChange, onAdd, suggestedColorId }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<TeamRole>("contributor");
  const [colorId, setColorId] = useState<PersonColorId>(suggestedColorId);

  useEffect(() => {
    if (open) {
      setStep(0);
      setName("");
      setEmail("");
      setTitle("");
      setRole("contributor");
      setColorId(suggestedColorId);
    }
  }, [open, suggestedColorId]);

  const canContinue = step !== 0 || (name.trim().length > 1 && email.includes("@"));

  const finish = () => {
    onAdd({
      id: uid("member"),
      name: name.trim(),
      email: email.trim(),
      title: title.trim() || "Team member",
      role,
      colorId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Invite a teammate</DialogTitle>
          <DialogDescription>Three quick steps to add someone to this project.</DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                  i <= step ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  "truncate text-xs",
                  i === step ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <PersonAvatar
                member={{
                  id: "preview",
                  name: name || "New Person",
                  email,
                  title,
                  role,
                  colorId,
                }}
                size="lg"
              />
              <p className="text-xs text-muted-foreground">
                Their initials and colour appear on every card they own.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Their colour</Label>
              <div className="flex flex-wrap gap-2">
                {PERSON_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    aria-label={`Use ${c.label}`}
                    aria-pressed={colorId === c.id}
                    onClick={() => setColorId(c.id)}
                    className={cn(
                      "h-6 w-6 rounded-full transition-transform hover:scale-110",
                      colorId === c.id &&
                        "ring-2 ring-foreground/60 ring-offset-2 ring-offset-background",
                    )}
                    style={{ backgroundColor: personVars(c.id).solid }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-name">Full name</Label>
              <Input
                id="member-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-email">Work email</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-title">Role title</Label>
              <Input
                id="member-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product Designer"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <ul className="space-y-2">
            {ROLES.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setRole(r.id)}
                  aria-pressed={role === r.id}
                  className={cn(
                    "w-full rounded-2xl border p-3 text-left transition-colors",
                    role === r.id
                      ? "border-brand bg-brand-soft"
                      : "border-border hover:bg-muted/60",
                  )}
                >
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.blurb}</p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {step === 2 && (
          <div className="rounded-2xl border border-border/70 p-4">
            <div className="flex items-center gap-3">
              <PersonAvatar
                member={{ id: "preview", name: name || "Unnamed", email, title, role, colorId }}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name || "Unnamed"}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Role title</dt>
                <dd className="truncate">{title || "Team member"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Access</dt>
                <dd>{ROLES.find((r) => r.id === role)?.label}</dd>
              </div>
            </dl>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => (step === 0 ? onOpenChange(false) : setStep((s) => s - 1))}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          <Button
            type="button"
            disabled={!canContinue}
            onClick={() => (step === 2 ? finish() : setStep((s) => s + 1))}
          >
            {step === 2 ? "Add to team" : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

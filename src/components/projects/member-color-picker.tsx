import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PersonAvatar } from "./person-avatar";
import { PERSON_COLORS, personVars, type Member, type PersonColorId } from "./types";

type Props = {
  member: Member;
  onPick: (colorId: PersonColorId) => void;
};

export function MemberColorPicker({ member, onPick }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Change colour for ${member.name}`}
        className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 py-1 pr-3 pl-1 transition-colors hover:bg-muted/60"
      >
        <PersonAvatar member={member} size="sm" />
        <span className="text-xs">{member.name}</span>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <p className="text-xs font-medium">{member.name}</p>
        <p className="mb-3 text-[11px] text-muted-foreground">{member.title}</p>
        <div className="grid grid-cols-6 gap-2">
          {PERSON_COLORS.map((c) => {
            const vars = personVars(c.id);
            return (
              <button
                key={c.id}
                type="button"
                title={c.label}
                aria-label={`Use ${c.label}`}
                aria-pressed={member.colorId === c.id}
                onClick={() => onPick(c.id)}
                className={cn(
                  "h-6 w-6 rounded-full transition-transform hover:scale-110",
                  member.colorId === c.id && "ring-2 ring-foreground/60 ring-offset-2 ring-offset-popover",
                )}
                style={{ backgroundColor: vars.solid }}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

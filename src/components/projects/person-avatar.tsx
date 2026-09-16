import { cn } from "@/lib/utils";
import { initials, personVars, type Member } from "./types";

type Props = {
  member?: Member | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-7 w-7 text-[10px]",
  lg: "h-11 w-11 text-sm",
};

export function PersonAvatar({ member, size = "md", className }: Props) {
  const colors = personVars(member?.colorId);
  return (
    <span
      title={member?.name}
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        SIZES[size],
        className,
      )}
      style={
        member
          ? { backgroundColor: colors.soft, color: colors.ink, boxShadow: `inset 0 0 0 1px ${colors.solid}` }
          : undefined
      }
    >
      {member ? initials(member.name) : "—"}
    </span>
  );
}

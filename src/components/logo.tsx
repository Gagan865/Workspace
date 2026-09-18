import { useState } from "react";

import { cn } from "@/lib/utils";

// Renders the company logo from /public/logo.png. Default: a white chip (so a dark
// mark stays visible in both themes) with a "P" fallback. `plain`: just the image
// (for documents), rendering nothing if the file is absent.
export function Logo({ className, plain }: { className?: string; plain?: boolean }) {
  const [ok, setOk] = useState(true);

  if (plain) {
    if (!ok) return null;
    return (
      <img
        src="/logo.png"
        alt="PRISIM"
        onError={() => setOk(false)}
        className={cn("object-contain", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-2xl shadow-soft",
        ok ? "bg-white" : "bg-brand text-brand-foreground",
        className,
      )}
    >
      {ok ? (
        <img
          src="/logo.png"
          alt="PRISIM"
          onError={() => setOk(false)}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        <span className="font-display text-sm font-bold">P</span>
      )}
    </span>
  );
}

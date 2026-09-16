// App error reporting hook. Currently logs to the console; swap in a real
// provider (Sentry, etc.) here without touching call sites.
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  // Loaders and server fns commonly throw a raw Response; String(it) is the
  // opaque "[object Response]", so pull out the status and URL instead.
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error("[app error]", message, {
    route: window.location.pathname,
    ...context,
    ...(stack !== undefined && { stack }),
  });
}

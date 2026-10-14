/** The sentence to show for each HTTP category, by endpoint outside `/auth`. Each refusal is mapped to its category in `src/host/http.ts`. */
const messages: Record<string, Record<string, string>> = {
  "/reports/file": {
    INVALID_REQUEST: "Check the form: pick a category, write a description, and choose at least one building.",
    CONFLICT: "That report already has a location.",
  },
  "/reports/claim": {
    CONFLICT: "Someone already claimed this item.",
    FORBIDDEN: "You can't claim your own report.",
    NOT_FOUND: "This item is no longer available.",
  },
  "/notifications/read": { NOT_FOUND: "That notice is already gone." },
};

/** The sentence to show when the endpoint at `path` returns `error`. */
export function messageFor(path: string, error: string): string {
  return messages[path]?.[error] ?? "Something went wrong. Try again.";
}

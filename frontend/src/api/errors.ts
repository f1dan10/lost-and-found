/** The sentence to show for each HTTP category, by endpoint outside `/auth`. Each refusal is mapped to its category in `src/host/http.ts`. */
const messages: Record<string, Record<string, string>> = {
  "/reports/file": {
    INVALID_REQUEST: "Check the form: pick a category, write a description, and choose at least one building.",
    CONFLICT: "That report already has a location.",
  },
  "/reports/claim": {
    CONFLICT: "Someone claimed this item a moment before you, so it is no longer in Found.",
    FORBIDDEN: "You can't claim your own report.",
    NOT_FOUND: "Someone just claimed this item, or its finder removed it. The list is up to date now.",
  },
  "/reports/withdraw": {
    CONFLICT: "This report is already closed, so there is nothing to remove.",
    NOT_FOUND: "You can only remove your own reports.",
  },
  "/reports/resolve": {
    CONFLICT: "This report is already closed.",
    NOT_FOUND: "You can only close your own reports.",
  },
  "/reports/renew": {
    CONFLICT: "This report is closed, so it can't be renewed.",
    NOT_FOUND: "You can only renew your own reports.",
  },
  "/claims/collect": {
    CONFLICT: "You already marked this item as picked up.",
    NOT_FOUND: "You can only mark an item you claimed as picked up.",
  },
  "/thanks/send": {
    INVALID_REQUEST: "Keep the note under 140 characters, or send your thanks with no note.",
    CONFLICT: "You already thanked the finder for this item.",
    NOT_FOUND: "You can only thank the finder of an item you claimed.",
  },
  "/notifications/read": { NOT_FOUND: "That notice is already gone." },
};

/** The sentence to show when the endpoint at `path` returns `error`. */
export function messageFor(path: string, error: string): string {
  return messages[path]?.[error] ?? "Something went wrong. Try again.";
}

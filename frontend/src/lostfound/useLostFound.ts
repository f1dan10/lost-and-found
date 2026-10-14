import { ref } from "vue";
import type { LostFoundWireHttp } from "../../../generated/wire.ts";
import { api } from "../api/client.ts";
import { messageFor } from "../api/errors.ts";
import { useSession } from "../reusable/session.ts";

type Wire = LostFoundWireHttp;
type Path = keyof Wire;
export type Reports = Pick<Wire["/reports/list"]["output"], "found" | "lost">;
/** A report card. A card has no kind: the kind is the list it sits in. */
export type Card = Reports["found"][number];
export type Place = Wire["/places/list"]["output"]["places"][number];
export type Notification = Wire["/notifications/list"]["output"]["notifications"][number];
export type ReportId = Card["report"];
export type NotificationId = Notification["notification"];
export type FileInput = Wire["/reports/file"]["input"];
export type Tab = "found" | "lost" | "board";

const POLL_MS = 8_000;
const FOLLOW_UP_MS = 400;

const reports = ref<Reports>({ found: [], lost: [] });
const places = ref<Place[]>([]);
const notifications = ref<Notification[]>([]);
const tab = ref<Tab>("found");
/** The report to point out on the screen, such as the one a notice is about. */
const highlight = ref<ReportId | null>(null);
/** False until the first refresh finishes, so the page can say "Loading…" instead of "Nothing found yet". */
const loaded = ref(false);
const error = ref<string | null>(null);
/** True while `change` waits for a call and the refresh after it. */
const working = ref(false);

let timer: ReturnType<typeof setInterval> | undefined;
let followUp: ReturnType<typeof setTimeout> | undefined;
/** Counts sign-outs, so a reply that arrives after `reset` is dropped and doesn't show the last person's data. */
let session = 0;

/**
 * Waits for an endpoint call and returns its output, or `{ error }` with the sentence to show.
 * `path` picks the sentence. UNAUTHORIZED means the session ended, so the sign-in screen is shown.
 */
async function call<T extends object>(path: Path, request: Promise<T | { error: string }>): Promise<T | { error: string }> {
  const result = await request;
  if (!("error" in result)) return result;
  if (result.error === "UNAUTHORIZED") useSession().sessionEnded();
  return { error: messageFor(path, result.error) };
}

/** Loads the reports, the places, and my notifications at once. */
async function refresh() {
  const mine = session;
  const [list, where, notices] = await Promise.all([
    call("/reports/list", api.reports.list()),
    call("/places/list", api.places.list()),
    call("/notifications/list", api.notifications.list()),
  ]);
  if (mine !== session) return;
  if ("error" in list) error.value = list.error;
  else reports.value = { found: list.found, lost: list.lost };
  if ("error" in where) error.value = where.error;
  else places.value = where.places;
  if ("error" in notices) error.value = notices.error;
  else notifications.value = notices.notifications;
  loaded.value = true;
}

/**
 * Waits for a call to an endpoint that changes data, then refreshes. A refusal is shown in the banner.
 * Controls are disabled until the refresh finishes, so a second click can't send the request again.
 * Returns whether the call was accepted.
 */
async function change<T extends object>(path: Path, request: Promise<T | { error: string }>): Promise<boolean> {
  working.value = true;
  const result = await call(path, request);
  const accepted = !("error" in result);
  if (accepted) error.value = null;
  else error.value = result.error;
  await refresh();
  working.value = false;
  return accepted;
}

/** Reactions finish after the endpoint answers, so a refresh a moment later shows what they did. */
function refreshAgain() {
  const mine = session;
  clearTimeout(followUp);
  followUp = setTimeout(() => {
    if (mine === session) void refresh();
  }, FOLLOW_UP_MS);
}

/** Files a report. A photo or spot that is empty is left out of the request, never sent as an empty string. */
async function fileReport(input: FileInput): Promise<boolean> {
  const { photo, spot, ...required } = input;
  const request: FileInput = { ...required };
  if (photo !== undefined && photo !== "") request.photo = photo;
  if (spot !== undefined && spot.trim() !== "") request.spot = spot.trim();
  const accepted = await change("/reports/file", api.reports.file(request));
  refreshAgain();
  return accepted;
}

/** Claims a found report. A refusal reloads the lists, which no longer show a report that was taken. */
async function claim(report: ReportId): Promise<boolean> {
  const accepted = await change("/reports/claim", api.reports.claim({ report }));
  refreshAgain();
  return accepted;
}

async function markRead(notification: NotificationId): Promise<boolean> {
  return change("/notifications/read", api.notifications.read({ notification }));
}

/** Refreshes every few seconds while the tab is visible, and when the window gets focus. Call `startPolling` once the person is signed in. */
function startPolling() {
  stopPolling();
  void refresh();
  timer = setInterval(() => {
    if (document.visibilityState === "visible") void refresh();
  }, POLL_MS);
  window.addEventListener("focus", onFocus);
}

function stopPolling() {
  clearInterval(timer);
  timer = undefined;
  window.removeEventListener("focus", onFocus);
}

function onFocus() {
  void refresh();
}

/** Clears everything when my session ends, so the next person to sign in on this tab doesn't see it. */
function reset() {
  session += 1;
  stopPolling();
  clearTimeout(followUp);
  reports.value = { found: [], lost: [] };
  places.value = [];
  notifications.value = [];
  tab.value = "found";
  highlight.value = null;
  loaded.value = false;
  error.value = null;
  working.value = false;
}

/**
 * The lists, shared by every component under LostFoundPage, and the functions that call endpoints for them.
 * LostFoundPage calls `startPolling` when it mounts and `stopPolling` when it unmounts.
 */
export function useLostFound() {
  return {
    reports,
    places,
    notifications,
    tab,
    highlight,
    loaded,
    error,
    working,
    call,
    refresh,
    change,
    fileReport,
    claim,
    markRead,
    startPolling,
    stopPolling,
    reset,
  };
}

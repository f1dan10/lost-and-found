import { computed, ref } from "vue";
import { api } from "../api/client.ts";
import { messageFor } from "../api/errors.ts";
import { useSession } from "../reusable/session.ts";
import { rowsFor, type Section } from "./sections.ts";
import type {
  ClaimedCard,
  FileInput,
  Lists,
  MyClaim,
  MyReport,
  Notification,
  NotificationId,
  Path,
  Place,
  ReportId,
  Reports,
} from "./types.ts";

export type { Card, CardLike, ClaimedCard, FileInput, MyClaim, MyReport, Notification, NotificationId, Place, ReportId, Reports } from "./types.ts";
export type { Section } from "./sections.ts";

const POLL_MS = 8_000;
const FOLLOW_UP_MS = 400;
const TOAST_MS = 5_000;

const reports = ref<Reports>({ found: [], lost: [] });
const places = ref<Place[]>([]);
const notifications = ref<Notification[]>([]);
const claims = ref<ClaimedCard[]>([]);
const myClaims = ref<MyClaim[]>([]);
const mine = ref<MyReport[]>([]);
/** A short confirmation at the bottom of the screen, such as "Posted.", which goes away by itself. */
const toast = ref<string | null>(null);
/** The section of the app on screen, such as Found or Waiting on you. */
const section = ref<Section>("found");
/** The item chosen in a section, which the detail panel shows; null when nothing is chosen. */
const selected = ref<{ section: Section; report: ReportId } | null>(null);
/** What is typed in the search box. */
const query = ref("");
/** The item just claimed, so its claim view can say "It's yours" once and offer to close a matching lost report. */
const justClaimed = ref<ReportId | null>(null);
/** The report form that is open, if any: what the person is reporting. */
const reporting = ref<"found" | "lost" | null>(null);
/** False until the first refresh finishes, so the page can say "Loading…" instead of "Nothing found yet". */
const loaded = ref(false);
const error = ref<string | null>(null);
/** True while `change` waits for a call and the refresh after it. */
const working = ref(false);

let timer: ReturnType<typeof setInterval> | undefined;
let followUp: ReturnType<typeof setTimeout> | undefined;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
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

/** Loads the reports, the places, the recent claims, my own reports and claims, and my notifications at once. */
async function refresh() {
  const current = session;
  const [list, where, notices, recent, myClaimList, myReportList] = await Promise.all([
    call("/reports/list", api.reports.list()),
    call("/places/list", api.places.list()),
    call("/notifications/list", api.notifications.list()),
    call("/claims/list", api.claims.list()),
    call("/claims/mine", api.claims.mine()),
    call("/reports/mine", api.reports.mine()),
  ]);
  if (current !== session) return;
  if ("error" in list) error.value = list.error;
  else reports.value = { found: list.found, lost: list.lost };
  if ("error" in where) error.value = where.error;
  else places.value = where.places;
  if ("error" in notices) error.value = notices.error;
  else notifications.value = notices.notifications;
  if ("error" in recent) error.value = recent.error;
  else claims.value = recent.claims;
  if ("error" in myClaimList) error.value = myClaimList.error;
  else myClaims.value = myClaimList.claims;
  if ("error" in myReportList) error.value = myReportList.error;
  else mine.value = myReportList.reports;
  keepSelection();
  loaded.value = true;
}

/** Everything loaded, as one value the sections are computed from. */
const lists = computed<Lists>(() => ({
  reports: reports.value,
  claims: claims.value,
  myClaims: myClaims.value,
  mine: mine.value,
  notifications: notifications.value,
}));

/** Shows a section and chooses an item in it, such as the report a notice is about. */
function show(where: Section, report: ReportId | null = null) {
  section.value = where;
  selected.value = report === null ? null : { section: where, report };
}

/**
 * Forgets the chosen item once it is no longer in its section, such as a found item someone else just claimed,
 * so the detail panel never shows something the list doesn't.
 */
function keepSelection() {
  const chosen = selected.value;
  if (chosen === null) return;
  const me = useSession().me.value?.username ?? null;
  if (!rowsFor(chosen.section, lists.value, me).some((row) => row.report === chosen.report)) selected.value = null;
}

/** Shows a confirmation for a few seconds. */
function showToast(message: string) {
  toast.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = null), TOAST_MS);
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
  const current = session;
  clearTimeout(followUp);
  followUp = setTimeout(() => {
    if (current === session) void refresh();
  }, FOLLOW_UP_MS);
}

/**
 * Files a report and returns its id, or `{ error }` with the sentence to show. A refusal is returned to the form
 * rather than put in the page's banner, so the form can show it and keep what the person typed.
 * A photo or spot that is empty is left out of the request, never sent as an empty string.
 */
async function fileReport(input: FileInput): Promise<{ report: ReportId } | { error: string }> {
  const { photo, spot, ...required } = input;
  const request: FileInput = { ...required };
  if (photo !== undefined && photo !== "") request.photo = photo;
  if (spot !== undefined && spot.trim() !== "") request.spot = spot.trim();
  working.value = true;
  const result = await call("/reports/file", api.reports.file(request));
  if (!("error" in result)) {
    error.value = null;
    await refresh();
    refreshAgain();
  }
  working.value = false;
  return result;
}

/** Claims a found report. A refusal reloads the lists, which no longer show a report that was taken. */
async function claim(report: ReportId): Promise<boolean> {
  const accepted = await change("/reports/claim", api.reports.claim({ report }));
  if (accepted) {
    // The item leaves Found once it is claimed, so the choice follows it to Your claims.
    justClaimed.value = report;
    show("claims", report);
  }
  refreshAgain();
  return accepted;
}

async function markRead(notification: NotificationId): Promise<boolean> {
  return change("/notifications/read", api.notifications.read({ notification }));
}

/** Removes my report from the lists. It is withdrawn, not deleted, so claims and notices about it still make sense. */
async function withdraw(report: ReportId): Promise<boolean> {
  const accepted = await change("/reports/withdraw", api.reports.withdraw({ report }));
  if (accepted) showToast("Removed. It no longer shows in the lists.");
  return accepted;
}

/** Closes my report because the item is back with its owner, such as "I got it back". */
async function resolve(report: ReportId): Promise<boolean> {
  const accepted = await change("/reports/resolve", api.reports.resolve({ report }));
  if (accepted) showToast("Closed. Glad it's back.");
  return accepted;
}

/** Keeps my report open for two more weeks. */
async function renew(report: ReportId): Promise<boolean> {
  const accepted = await change("/reports/renew", api.reports.renew({ report }));
  if (accepted) showToast("Renewed. It stays up for two more weeks.");
  return accepted;
}

/** Marks an item I claimed as picked up; it moves from Waiting on you to History, and the finder is told. */
async function collect(report: ReportId, finder: string): Promise<boolean> {
  const accepted = await change("/claims/collect", api.claims.collect({ report }));
  if (accepted) {
    showToast(`Marked as picked up. ${finder} will be told.`);
    show("history", report);
    refreshAgain();
  }
  return accepted;
}

/** Thanks the finder of an item I claimed, with an optional note. The finder is told a moment later. */
async function thank(report: ReportId, note: string): Promise<boolean> {
  const trimmed = note.trim();
  const accepted = await change("/thanks/send", api.thanks.send(trimmed ? { report, note: trimmed } : { report }));
  if (accepted) {
    showToast("Thanks sent.");
    refreshAgain();
  }
  return accepted;
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
  clearTimeout(toastTimer);
  reports.value = { found: [], lost: [] };
  places.value = [];
  notifications.value = [];
  claims.value = [];
  myClaims.value = [];
  mine.value = [];
  toast.value = null;
  section.value = "found";
  selected.value = null;
  query.value = "";
  reporting.value = null;
  justClaimed.value = null;
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
    claims,
    myClaims,
    mine,
    toast,
    lists,
    section,
    selected,
    query,
    reporting,
    justClaimed,
    show,
    loaded,
    error,
    working,
    call,
    refresh,
    change,
    fileReport,
    claim,
    markRead,
    withdraw,
    collect,
    resolve,
    renew,
    thank,
    showToast,
    startPolling,
    stopPolling,
    reset,
  };
}

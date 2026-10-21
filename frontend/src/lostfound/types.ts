import type { LostFoundWireHttp } from "../../../generated/wire.ts";

/**
 * The shapes the screens work with, all taken from the generated wire types so they follow the endpoints. This file
 * imports nothing at runtime, so plain functions that use these types can be tested with `bun test`.
 */
type Wire = LostFoundWireHttp;

export type Path = keyof Wire;
export type Reports = Pick<Wire["/reports/list"]["output"], "found" | "lost">;
/** A report card. A card has no kind: the kind is the list it sits in. */
export type Card = Reports["found"][number];
/** A building people can choose, with its position. */
export type Place = Wire["/places/list"]["output"]["places"][number];
export type Notification = Wire["/notifications/list"]["output"]["notifications"][number];
export type ReportId = Card["report"];
export type NotificationId = Notification["notification"];
export type FileInput = Wire["/reports/file"]["input"];
/** An item claimed in the last 30 days, in Returned. It never says who claimed it. */
export type ClaimedCard = Wire["/claims/list"]["output"]["claims"][number];
/** An item I claimed, with who found it, whether I picked it up, and whether I thanked them. */
export type MyClaim = Wire["/claims/mine"]["output"]["claims"][number];
/** A report I filed, open or closed, with its status, who claimed it, when it was picked up, and their thanks. */
export type MyReport = Wire["/reports/mine"]["output"]["reports"][number];
/** What a report card needs: an open card, or one of my own reports, which has no username. */
export type CardLike = Omit<Card, "reporter" | "username"> & { username?: string };

/** Everything the page has loaded, in one value, so the sections can be computed from it. */
export interface Lists {
  reports: Reports;
  claims: ClaimedCard[];
  myClaims: MyClaim[];
  mine: MyReport[];
  notifications: Notification[];
}

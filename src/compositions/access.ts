import { view, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Reporting, Claiming } = concepts;

/** In Lost&Found, whoever filed a report owns it. */
export const owns = view("(user) owns (report)", ({ user, report }) =>
  where(Reporting._getReport({ report }).is({ reporter: user })),
).holds();

/** A found report is open until its finder resolves or withdraws it, someone claims it, or it expires unrenewed. */
export const isOpenFound = view("(report) is an open found report", ({ report }) =>
  where(Reporting._getOpen({ kind: "FOUND" }).is({ report })),
).holds();

/** Only the person who claimed an item can thank its finder for it. */
export const claimed = view("(user) claimed (report)", ({ user, report }) =>
  where(Claiming._getClaimant({ item: report }).is({ claimant: user })),
).holds();

export const composition = {
  permissions: { owns, isOpenFound, claimed },
};

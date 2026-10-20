import { view, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Reporting } = concepts;

/** In Lost&Found, whoever filed a report owns it. */
export const owns = view("(user) owns (report)", ({ user, report }) =>
  where(Reporting._getReport({ report }).is({ reporter: user })),
).holds();

/** A found report is open until its finder resolves or withdraws it, someone claims it, or it expires unrenewed. */
export const isOpenFound = view("(report) is an open found report", ({ report }) =>
  where(Reporting._getOpen({ kind: "FOUND" }).is({ report })),
).holds();

export const composition = {
  permissions: { owns, isOpenFound },
};

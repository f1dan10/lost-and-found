import { view, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Reporting } = concepts;

/** In Lost&Found, whoever filed a report owns it. */
export const owns = view("(user) owns (report)", ({ user, report }) =>
  where(Reporting._getReport({ report }).is({ reporter: user })),
).holds();

/** A found report is still open until its finder resolves or withdraws it, or someone claims it. */
export const isOpenFound = view("(report) is an open found report", ({ report }) =>
  where(Reporting._getReport({ report }).is({ kind: "FOUND", status: "OPEN" })),
).holds();

export const composition = {
  permissions: { owns, isOpenFound },
};

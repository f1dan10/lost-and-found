import { describe, expect, test } from "bun:test";
import {
  InvalidReport,
  NotOpen,
  ReportNotFound,
  ReportingConcept,
  type Report,
} from "../../src/concepts/Reporting/Reporting.ts";
import { testDatabase } from "../support/reusable/mongo.ts";

const MAYA = "maya";
const SAM = "sam";

/** A concept whose clock moves one minute with each reading, so reports are filed in a known order. */
async function setup() {
  let minute = 0;
  const clock = () => new Date(Date.UTC(2026, 9, 13, 12, minute++));
  return { reporting: new ReportingConcept<string>(await testDatabase(), "Reporting", clock) };
}

const bottle = { reporter: MAYA, kind: "FOUND", category: "BOTTLE", description: "Blue Hydro Flask" } as const;

describe("Reporting", () => {
  test("its principle: Maya files a found bottle, Sam finds it among the open bottles, and resolving it removes it", async () => {
    const { reporting } = await setup();
    const { report } = await reporting.file({ ...bottle, photo: "data:image/jpeg;base64,AAAA" });

    expect(await reporting._getOpen({ kind: "FOUND", category: "BOTTLE" })).toEqual([{ report }]);
    expect(await reporting._getOpen({ kind: "FOUND", category: "KEYS_ID" })).toEqual([]);
    expect(await reporting._getOpen({ kind: "LOST", category: "BOTTLE" })).toEqual([]);
    expect(await reporting._getReport({ report })).toEqual([
      {
        reporter: MAYA,
        kind: "FOUND",
        category: "BOTTLE",
        description: "Blue Hydro Flask",
        filedAt: new Date(Date.UTC(2026, 9, 13, 12, 0)),
        status: "OPEN",
      },
    ]);

    await reporting.resolve({ report });
    expect(await reporting._getOpen({ kind: "FOUND" })).toEqual([]);
    expect(await reporting._getReport({ report })).toMatchObject([{ status: "RESOLVED" }]);
    await expect(reporting.resolve({ report })).rejects.toThrow("This report is no longer open.");
  });

  test("a withdrawn report leaves the open reports too", async () => {
    const { reporting } = await setup();
    const { report } = await reporting.file(bottle);
    await reporting.withdraw({ report });
    expect(await reporting._getOpen({ kind: "FOUND" })).toEqual([]);
    expect(await reporting._getReport({ report })).toMatchObject([{ status: "WITHDRAWN" }]);
  });

  test("a report with a blank or over-long description, a bad kind or category, or an oversized photo is refused", async () => {
    const { reporting } = await setup();
    const refused = [
      { ...bottle, description: "" },
      { ...bottle, description: "   " },
      { ...bottle, description: "x".repeat(501) },
      { ...bottle, kind: "MISSING" },
      { ...bottle, category: "FOOD" },
      { ...bottle, photo: "x".repeat(2_000_001) },
    ];
    for (const report of refused) {
      await expect(reporting.file(report as never)).rejects.toThrow(InvalidReport);
    }
    expect(await reporting._getOpen({ kind: "FOUND" })).toEqual([]);

    await reporting.file({ ...bottle, description: "x".repeat(500), photo: "x".repeat(2_000_000) });
  });

  test("resolving or withdrawing an unknown report is refused with REPORT_NOT_FOUND", async () => {
    const { reporting } = await setup();
    await expect(reporting.resolve({ report: "nothing" as Report })).rejects.toThrow(ReportNotFound);
    await expect(reporting.withdraw({ report: "nothing" as Report })).rejects.toThrow(ReportNotFound);
  });

  test("resolving or withdrawing a report that is not open is refused with NOT_OPEN", async () => {
    const { reporting } = await setup();
    const { report: resolved } = await reporting.file(bottle);
    const { report: withdrawn } = await reporting.file(bottle);
    await reporting.resolve({ report: resolved });
    await reporting.withdraw({ report: withdrawn });

    for (const report of [resolved, withdrawn]) {
      await expect(reporting.resolve({ report })).rejects.toThrow(NotOpen);
      await expect(reporting.withdraw({ report })).rejects.toThrow(NotOpen);
    }
    expect(await reporting._getReport({ report: resolved })).toMatchObject([{ status: "RESOLVED" }]);
    expect(await reporting._getReport({ report: withdrawn })).toMatchObject([{ status: "WITHDRAWN" }]);
  });

  test("the open reports come newest first, across categories and for the one category asked for", async () => {
    const { reporting } = await setup();
    const { report: first } = await reporting.file(bottle);
    const { report: second } = await reporting.file({ ...bottle, category: "BAG" });
    const { report: third } = await reporting.file({ ...bottle, reporter: SAM });
    await reporting.file({ ...bottle, kind: "LOST" });

    expect(await reporting._getOpen({ kind: "FOUND" })).toEqual([{ report: third }, { report: second }, { report: first }]);
    expect(await reporting._getOpen({ kind: "FOUND", category: "BOTTLE" })).toEqual([{ report: third }, { report: first }]);
  });

  test("a reporter's own reports come newest first, whatever their status, and never another reporter's", async () => {
    const { reporting } = await setup();
    const { report: first } = await reporting.file(bottle);
    const { report: second } = await reporting.file({ ...bottle, kind: "LOST" });
    const { report: third } = await reporting.file(bottle);
    await reporting.file({ ...bottle, reporter: SAM });
    await reporting.withdraw({ report: first });
    await reporting.resolve({ report: third });

    expect(await reporting._getByReporter({ reporter: MAYA })).toEqual([{ report: third }, { report: second }, { report: first }]);
    expect(await reporting._getByReporter({ reporter: "nobody" })).toEqual([]);
  });

  test("a photo comes back exactly as filed, and a report with no photo, or an unknown one, has none", async () => {
    const { reporting } = await setup();
    const photo = "data:image/png;base64,iVBORw0KGgo=";
    const { report: withPhoto } = await reporting.file({ ...bottle, photo });
    const { report: without } = await reporting.file(bottle);

    expect(await reporting._getPhoto({ report: withPhoto })).toEqual([{ photo }]);
    expect(await reporting._getPhoto({ report: without })).toEqual([]);
    expect(await reporting._getPhoto({ report: "nothing" as Report })).toEqual([]);
    expect(await reporting._getReport({ report: "nothing" as Report })).toEqual([]);
  });
});

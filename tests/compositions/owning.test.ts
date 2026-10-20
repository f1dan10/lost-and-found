import { describe, expect, test } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { lostFoundPolicy } from "../../src/host/http.ts";
import { startLostFound } from "../support/app.ts";
import { ok } from "../support/reusable/results.ts";

async function setup() {
  const app = await startLostFound();
  const { application, register, addPlace } = app;
  const { Reporting, Locating } = application.concepts;
  const tom = await register("tom");
  const tamar = await register("tamar");
  const sam = await register("sam");
  const b2 = await addPlace("Building 2");

  async function file(reporter: string, kind: "FOUND" | "LOST", description = "a bottle") {
    const { report } = ok(await Reporting.file({ reporter: reporter as never, kind, category: "BOTTLE", description }));
    ok(await Locating.locate({ item: report, places: [b2] as never, spot: "by the lobby bench" }));
    await application.whenIdle();
    await Bun.sleep(5);
    return report;
  }
  const status = async (report: string) =>
    ((await Reporting._getReport({ report: report as never })) as { status: string }[])[0]?.status;
  return { ...app, tom, tamar, sam, b2, file, status };
}

describe("Closing your own report", () => {
  test("Tom removes his found report: it is withdrawn, leaves the list, and can no longer be claimed", async () => {
    const { api, tom, tamar, file, status } = await setup();
    const bottle = await file(tom.user, "FOUND");

    expect(await api.reports.withdraw({ session: tom.session, report: bottle })).toEqual({ report: bottle });
    expect(await status(bottle)).toBe("WITHDRAWN");
    expect(ok(await api.reports.list({ session: tamar.session })).found).toEqual([]);
    expect(await api.reports.claim({ session: tamar.session, report: bottle })).toEqual({ error: "NOT_FOUND" });
  });

  test("Tamar got her bottle back: she resolves her lost report, it leaves the list, and a new find no longer notifies her", async () => {
    const { api, application, tom, tamar, file, status } = await setup();
    const lost = await file(tamar.user, "LOST");

    expect(await api.reports.resolve({ session: tamar.session, report: lost })).toEqual({ report: lost });
    expect(await status(lost)).toBe("RESOLVED");
    expect(ok(await api.reports.list({ session: tamar.session })).lost).toEqual([]);

    await file(tom.user, "FOUND");
    expect(await application.concepts.Notifying._getUnread({ recipient: tamar.user as never })).toEqual([]);
  });

  test("Sam can't withdraw or resolve Tom's report, an unknown id gets the same answer, and nothing changes", async () => {
    const { api, tom, sam, file, status } = await setup();
    const bottle = await file(tom.user, "FOUND");

    for (const report of [bottle, "no-such-report"] as never[]) {
      expect(await api.reports.withdraw({ session: sam.session, report })).toEqual({ error: "NOT_FOUND" });
      expect(await api.reports.resolve({ session: sam.session, report })).toEqual({ error: "NOT_FOUND" });
    }
    expect(await status(bottle)).toBe("OPEN");
    expect(ok(await api.reports.list({ session: sam.session })).found).toHaveLength(1);
  });

  test("a report that is already closed is refused with NOT_OPEN and keeps its status", async () => {
    const { api, tom, file, status } = await setup();
    const bottle = await file(tom.user, "FOUND");
    ok(await api.reports.withdraw({ session: tom.session, report: bottle }));

    expect(await api.reports.withdraw({ session: tom.session, report: bottle })).toEqual({ error: "NOT_OPEN" });
    expect(await api.reports.resolve({ session: tom.session, report: bottle })).toEqual({ error: "NOT_OPEN" });
    expect(await status(bottle)).toBe("WITHDRAWN");
  });

  test("once Tamar claims Tom's item, Tom can't withdraw it", async () => {
    const { api, application, tom, tamar, file, status } = await setup();
    const bottle = await file(tom.user, "FOUND");
    ok(await api.reports.claim({ session: tamar.session, report: bottle }));
    await application.whenIdle();

    expect(await api.reports.withdraw({ session: tom.session, report: bottle })).toEqual({ error: "NOT_OPEN" });
    expect(await status(bottle)).toBe("RESOLVED");
  });

  test("a request with no session is refused", async () => {
    const { api, tom, file } = await setup();
    const bottle = await file(tom.user, "FOUND");
    await api.auth.logout({ session: tom.session });
    expect(await api.reports.withdraw({ session: tom.session, report: bottle })).toMatchObject({ error: "NOT_SIGNED_IN" });
    expect(await api.reports.mine({ session: tom.session })).toMatchObject({ error: "NOT_SIGNED_IN" });
  });
});

describe("Listing your own reports", () => {
  test("each person sees only their own reports, newest first, open or closed, with kind, status, places, and spot", async () => {
    const { api, tom, tamar, b2, file } = await setup();
    const first = await file(tom.user, "FOUND", "first");
    const second = await file(tom.user, "LOST", "second");
    await file(tamar.user, "LOST", "tamar's");
    ok(await api.reports.withdraw({ session: tom.session, report: first }));

    const { reports } = ok(await api.reports.mine({ session: tom.session }));
    expect(reports.map(({ report }) => report)).toEqual([second, first]);
    expect(reports[1]).toMatchObject({
      kind: "FOUND",
      category: "BOTTLE",
      description: "first",
      status: "WITHDRAWN",
      spot: "by the lobby bench",
      photo: null,
      places: [{ place: b2, name: "Building 2" }],
    });
    expect(reports[0]).toMatchObject({ kind: "LOST", status: "OPEN" });

    expect(ok(await api.reports.mine({ session: tamar.session })).reports.map(({ description }) => description)).toEqual(["tamar's"]);
  });

  test("someone who filed nothing has no reports", async () => {
    const { api, sam } = await setup();
    expect(ok(await api.reports.mine({ session: sam.session })).reports).toEqual([]);
  });
});

describe("Closing over HTTP", () => {
  test("someone else's report is 404, a closed one is 409, and the owner's is 200", async () => {
    const { application, tom, sam, file } = await setup();
    const bottle = await file(tom.user, "FOUND");
    const handle = createHttpHandler({ application, gateway: createGateway({ application }), policy: lostFoundPolicy("http://localhost:3000") });
    const withdraw = async (session: string) =>
      (
        await handle(
          new Request("http://localhost:3000/api/reports/withdraw", {
            method: "POST",
            headers: { "Content-Type": "application/json", Origin: "http://localhost:3000", Cookie: `__Host-lostfound-session=${session}` },
            body: JSON.stringify({ session: null, report: bottle }),
          }),
        )
      ).status;

    expect(await withdraw(sam.session)).toBe(404);
    expect(await withdraw(tom.session)).toBe(200);
    expect(await withdraw(tom.session)).toBe(409);
  });
});

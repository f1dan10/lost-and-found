import { describe, expect, test } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { lostFoundPolicy } from "../../src/host/http.ts";
import { startLostFound } from "../support/app.ts";
import { ok } from "../support/reusable/results.ts";

async function setup() {
  const app = await startLostFound();
  const { application, register, addPlace } = app;
  const { Reporting, Locating, Notifying } = application.concepts;
  const tom = await register("tom");
  const tamar = await register("tamar");
  const sam = await register("sam");
  const b2 = await addPlace("Building 2");

  async function file(reporter: string, kind: "FOUND" | "LOST") {
    const { report } = ok(await Reporting.file({ reporter: reporter as never, kind, category: "BOTTLE", description: "a bottle" }));
    ok(await Locating.locate({ item: report, places: [b2] as never }));
    await application.whenIdle();
    return report;
  }
  const status = async (report: string) =>
    ((await Reporting._getReport({ report: report as never })) as { status: string }[])[0]?.status;
  const unread = async (user: string) => (await Notifying._getUnread({ recipient: user as never })) as { subject: string; message: string }[];
  return { ...app, Reporting, tom, tamar, sam, file, status, unread };
}

describe("Claiming a found item", () => {
  test("Tamar claims Tom's bottle: its report is resolved, leaves the list, and Tom gets one notice and one email", async () => {
    const { api, application, mailer, tom, tamar, file, status, unread } = await setup();
    const bottle = await file(tom.user, "FOUND");
    mailer.sent.length = 0;

    expect(await api.reports.claim({ session: tamar.session, report: bottle })).toEqual({ report: bottle });
    await application.whenIdle();

    expect(await status(bottle)).toBe("RESOLVED");
    expect(ok(await api.reports.list({ session: tamar.session })).found).toEqual([]);
    expect(await unread(tom.user)).toMatchObject([{ subject: bottle, message: "Your found item was claimed." }]);
    expect(mailer.sent).toEqual([{ to: "tom", message: "Your found item was claimed." }]);
    expect(await unread(tamar.user)).toEqual([]);
  });

  test("Tom claiming his own item is refused, and nothing changes", async () => {
    const { api, application, mailer, tom, file, status, unread } = await setup();
    const bottle = await file(tom.user, "FOUND");
    mailer.sent.length = 0;

    expect(await api.reports.claim({ session: tom.session, report: bottle })).toEqual({ error: "CLAIMING_OWN_REPORT" });
    await application.whenIdle();
    expect(await status(bottle)).toBe("OPEN");
    expect(await unread(tom.user)).toEqual([]);
    expect(mailer.sent).toEqual([]);
  });

  test("a claimer who comes after the claim and its resolution is refused with NOT_FOUND, and Claiming itself still refuses with ALREADY_CLAIMED", async () => {
    const { api, application, tom, tamar, sam, file } = await setup();
    const bottle = await file(tom.user, "FOUND");
    ok(await api.reports.claim({ session: tamar.session, report: bottle }));
    await application.whenIdle();
    expect(await api.reports.claim({ session: sam.session, report: bottle })).toEqual({ error: "NOT_FOUND" });
    expect(await application.concepts.Claiming._getClaimant({ item: bottle as never })).toMatchObject([{ claimant: tamar.user }]);

    // Claiming itself still refuses a second claim of the same item, whatever the report says.
    const second = await application.concepts.Claiming.claim({ claimant: sam.user, item: bottle as never });
    expect(second).toMatchObject({ error: "ALREADY_CLAIMED" });
  });

  test("a lost report, a resolved report, and an unknown id all give NOT_FOUND", async () => {
    const { api, Reporting, application, tom, tamar, file } = await setup();
    const lost = await file(tom.user, "LOST");
    const resolved = await file(tom.user, "FOUND");
    ok(await Reporting.resolve({ report: resolved }));
    await application.whenIdle();

    for (const report of [lost, resolved, "no-such-report"] as never[]) {
      expect(await api.reports.claim({ session: tamar.session, report })).toEqual({ error: "NOT_FOUND" });
    }
    expect(await application.concepts.Claiming._getClaimant({ item: lost as never })).toEqual([]);
  });

  test("a request with no session is refused", async () => {
    const { api, tom, tamar, file } = await setup();
    const bottle = await file(tom.user, "FOUND");
    await api.auth.logout({ session: tamar.session });
    expect(await api.reports.claim({ session: tamar.session, report: bottle })).toMatchObject({ error: "NOT_SIGNED_IN" });
  });

  test("of two simultaneous claims by different users, exactly one wins", async () => {
    const { api, application, tom, tamar, sam, file, unread } = await setup();
    const bottle = await file(tom.user, "FOUND");
    const results = await Promise.all([
      api.reports.claim({ session: tamar.session, report: bottle }),
      api.reports.claim({ session: sam.session, report: bottle }),
    ]);
    await application.whenIdle();

    expect(results.filter((result) => "report" in result)).toHaveLength(1);
    const loser = results.find((result) => "error" in result);
    expect(loser).toEqual({ error: "ALREADY_CLAIMED" });
    expect(await unread(tom.user)).toHaveLength(1);
  });

  test("over HTTP the refusals are CONFLICT, FORBIDDEN, and NOT_FOUND", async () => {
    const { api, application, tom, tamar, sam, file } = await setup();
    const bottle = await file(tom.user, "FOUND");
    const handle = createHttpHandler({
      application,
      gateway: createGateway({ application }),
      policy: lostFoundPolicy("http://localhost:3000"),
    });
    const claim = async (session: string, report: string) =>
      (
        await handle(
          new Request("http://localhost:3000/api/reports/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json", Origin: "http://localhost:3000", Cookie: `__Host-lostfound-session=${session}` },
            body: JSON.stringify({ session: null, report }),
          }),
        )
      ).status;

    expect(await claim(tom.session, bottle)).toBe(403);
    expect(await claim(tamar.session, "no-such-report")).toBe(404);
    expect(await claim(tamar.session, bottle)).toBe(200);
    expect(await api.auth.me({ session: tamar.session })).toEqual({ username: "tamar" });

    // Two claims at the same instant: one is answered 200, and the other 409 for ALREADY_CLAIMED.
    const contested = await file(tom.user, "FOUND");
    const statuses = await Promise.all([claim(tamar.session, contested), claim(sam.session, contested)]);
    expect(statuses.sort()).toEqual([200, 409]);
  });
});

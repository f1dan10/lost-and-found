import { describe, expect, test } from "bun:test";
import { startLostFound } from "../support/app.ts";
import { ok } from "../support/reusable/results.ts";

const DAY = 24 * 60 * 60 * 1000;

/** Reporting and Claiming read `now`, which a test moves forward by days; sessions keep the real time. */
async function setup() {
  let now = new Date(Date.UTC(2026, 9, 13, 12, 0));
  const app = await startLostFound([], { clock: () => now });
  const { application, register, addPlace } = app;
  const { Reporting, Locating } = application.concepts;
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
  const passDays = (days: number) => {
    now = new Date(now.getTime() + days * DAY);
  };
  const unread = async (user: string) => application.concepts.Notifying._getUnread({ recipient: user as never });
  return { ...app, tom, tamar, sam, file, passDays, unread, now: () => now };
}

describe("Reports that expire", () => {
  test("after 14 days Tom's found bottle leaves the list and can't be claimed, and renewing brings it back", async () => {
    const { api, tom, tamar, file, passDays } = await setup();
    const bottle = await file(tom.user, "FOUND");

    passDays(14);
    expect(ok(await api.reports.list({ session: tamar.session })).found).toEqual([]);
    expect(await api.reports.claim({ session: tamar.session, report: bottle })).toEqual({ error: "NOT_FOUND" });

    expect(await api.reports.renew({ session: tom.session, report: bottle })).toEqual({ report: bottle });
    expect(ok(await api.reports.list({ session: tamar.session })).found.map(({ report }) => report)).toEqual([bottle]);
    ok(await api.reports.claim({ session: tamar.session, report: bottle }));
  });

  test("an expired report stays in its owner's own list with its expiry, so they can renew it", async () => {
    const { api, tom, file, passDays, now } = await setup();
    const bottle = await file(tom.user, "FOUND");
    const filed = now();
    passDays(20);

    const [mine] = ok(await api.reports.mine({ session: tom.session })).reports;
    expect(mine).toMatchObject({ report: bottle, status: "OPEN", expiresAt: new Date(filed.getTime() + 14 * DAY).toISOString() });

    ok(await api.reports.renew({ session: tom.session, report: bottle }));
    const [renewed] = ok(await api.reports.mine({ session: tom.session })).reports;
    expect(renewed!.expiresAt).toBe(new Date(now().getTime() + 14 * DAY).toISOString());
  });

  test("an expired lost report gets no match notice, and a renewed one does", async () => {
    const { tom, tamar, api, file, passDays, unread } = await setup();
    const lost = await file(tamar.user, "LOST");
    passDays(15);
    await file(tom.user, "FOUND");
    expect(await unread(tamar.user)).toEqual([]);

    ok(await api.reports.renew({ session: tamar.session, report: lost }));
    const second = await file(tom.user, "FOUND");
    expect(await unread(tamar.user)).toMatchObject([{ subject: second }]);
  });

  test("Sam can't renew Tom's report, and a closed report can't be renewed; neither changes the expiry", async () => {
    const { api, application, tom, sam, file, passDays } = await setup();
    const bottle = await file(tom.user, "FOUND");
    const expiry = async () => ((await application.concepts.Reporting._getReport({ report: bottle })) as { expiresAt: Date }[])[0]!.expiresAt;
    const before = await expiry();
    passDays(3);

    expect(await api.reports.renew({ session: sam.session, report: bottle })).toEqual({ error: "NOT_FOUND" });
    expect(await api.reports.renew({ session: sam.session, report: "no-such-report" as never })).toEqual({ error: "NOT_FOUND" });
    ok(await api.reports.withdraw({ session: tom.session, report: bottle }));
    expect(await api.reports.renew({ session: tom.session, report: bottle })).toEqual({ error: "NOT_OPEN" });
    expect(await expiry()).toEqual(before);
  });

  test("an owner can still remove or close a report after it expires", async () => {
    const { api, tom, tamar, file, passDays } = await setup();
    const found = await file(tom.user, "FOUND");
    const lost = await file(tamar.user, "LOST");
    passDays(30);
    expect(await api.reports.withdraw({ session: tom.session, report: found })).toEqual({ report: found });
    expect(await api.reports.resolve({ session: tamar.session, report: lost })).toEqual({ report: lost });
  });
});

describe("Claims that age", () => {
  test("a claim older than 30 days leaves the Claimed list but stays in the claimant's own claims", async () => {
    const { api, application, tom, tamar, sam, file, passDays } = await setup();
    const bottle = await file(tom.user, "FOUND");
    ok(await api.reports.claim({ session: tamar.session, report: bottle }));
    await application.whenIdle();

    passDays(29);
    expect(ok(await api.claims.list({ session: sam.session })).claims.map(({ report }) => report)).toEqual([bottle]);
    passDays(2);
    expect(ok(await api.claims.list({ session: sam.session })).claims).toEqual([]);
    expect(ok(await api.claims.mine({ session: tamar.session })).claims.map(({ report }) => report)).toEqual([bottle]);
  });
});

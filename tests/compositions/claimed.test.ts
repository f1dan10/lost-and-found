import { describe, expect, test } from "bun:test";
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

  async function file(reporter: string, description: string, extras: { photo?: string; spot?: string } = {}) {
    const { report } = ok(
      await Reporting.file({ reporter: reporter as never, kind: "FOUND", category: "BOTTLE", description, ...(extras.photo ? { photo: extras.photo } : {}) }),
    );
    ok(await Locating.locate({ item: report, places: [b2] as never, ...(extras.spot ? { spot: extras.spot } : {}) }));
    await application.whenIdle();
    return report;
  }
  async function claim(session: string, report: string) {
    ok(await app.api.reports.claim({ session: session as never, report: report as never }));
    await application.whenIdle();
    await Bun.sleep(5);
  }
  return { ...app, tom, tamar, sam, b2, file, claim };
}

describe("The Claimed list", () => {
  test("a claimed item moves from Found to Claimed, with where it was and when it was claimed, newest first", async () => {
    const { api, tom, tamar, sam, b2, file, claim } = await setup();
    const bottle = await file(tom.user, "pink bottle", { spot: "by the lobby bench", photo: "data:image/jpeg;base64,AAAA" });
    const keys = await file(tom.user, "keys");
    expect(ok(await api.claims.list({ session: sam.session })).claims).toEqual([]);

    await claim(tamar.session, bottle);
    await claim(sam.session, keys);

    expect(ok(await api.reports.list({ session: sam.session })).found).toEqual([]);
    const { claims } = ok(await api.claims.list({ session: sam.session }));
    expect(claims.map(({ report }) => report)).toEqual([keys, bottle]);
    expect(claims[1]).toMatchObject({
      category: "BOTTLE",
      description: "pink bottle",
      spot: "by the lobby bench",
      photo: "data:image/jpeg;base64,AAAA",
      places: [{ place: b2, name: "Building 2" }],
    });
    expect(claims[0]).toMatchObject({ spot: null, photo: null });
    expect(typeof claims[0]!.claimedAt).toBe("string");
  });

  test("the list never says who claimed an item", async () => {
    const { api, tom, tamar, sam, file, claim } = await setup();
    await claim(tamar.session, await file(tom.user, "pink bottle"));

    const { claims } = ok(await api.claims.list({ session: sam.session }));
    expect(claims).toHaveLength(1);
    const text = JSON.stringify(claims);
    expect(text).not.toContain(tamar.user);
    expect(text).not.toContain("tamar");
  });
});

describe("Your claims", () => {
  test("Tamar sees where to pick up what she claimed, and who found it, even after the report is resolved", async () => {
    const { api, tom, tamar, b2, file, claim } = await setup();
    const bottle = await file(tom.user, "pink bottle", { spot: "by the lobby bench" });
    await claim(tamar.session, bottle);

    expect(ok(await api.claims.mine({ session: tamar.session })).claims).toMatchObject([
      { report: bottle, description: "pink bottle", foundBy: "tom", spot: "by the lobby bench", places: [{ place: b2, name: "Building 2" }] },
    ]);
  });

  test("each person sees only their own claims, newest first", async () => {
    const { api, tom, tamar, sam, file, claim } = await setup();
    const first = await file(tom.user, "first");
    const second = await file(tom.user, "second");
    const sams = await file(tom.user, "sam's");
    await claim(tamar.session, first);
    await claim(tamar.session, second);
    await claim(sam.session, sams);

    expect(ok(await api.claims.mine({ session: tamar.session })).claims.map(({ report }) => report)).toEqual([second, first]);
    expect(ok(await api.claims.mine({ session: sam.session })).claims.map(({ report }) => report)).toEqual([sams]);
    expect(ok(await api.claims.mine({ session: tom.session })).claims).toEqual([]);
  });

  test("Tom's own reports say who claimed his found item, and say null while it is unclaimed", async () => {
    const { api, tom, tamar, file, claim } = await setup();
    const claimed = await file(tom.user, "claimed");
    const waiting = await file(tom.user, "waiting");
    await claim(tamar.session, claimed);

    const { reports } = ok(await api.reports.mine({ session: tom.session }));
    expect(reports.find(({ report }) => report === claimed)).toMatchObject({ status: "RESOLVED", claimedBy: "tamar" });
    expect(reports.find(({ report }) => report === waiting)).toMatchObject({ status: "OPEN", claimedBy: null });
  });

  test("both lists need a session", async () => {
    const { api, tamar } = await setup();
    await api.auth.logout({ session: tamar.session });
    expect(await api.claims.list({ session: tamar.session })).toMatchObject({ error: "NOT_SIGNED_IN" });
    expect(await api.claims.mine({ session: tamar.session })).toMatchObject({ error: "NOT_SIGNED_IN" });
  });
});

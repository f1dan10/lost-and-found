import { describe, expect, test } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { lostFoundPolicy } from "../../src/host/http.ts";
import { startLostFound } from "../support/app.ts";
import { ok } from "../support/reusable/results.ts";

async function setup() {
  const app = await startLostFound();
  const { application, api, register, addPlace } = app;
  const { Reporting, Locating, Notifying } = application.concepts;
  const tom = await register("tom");
  const tamar = await register("tamar");
  const sam = await register("sam");
  const b2 = await addPlace("Building 2");

  /** Tom files a found bottle and Tamar claims it. */
  async function claimedBottle() {
    const { report } = ok(await Reporting.file({ reporter: tom.user as never, kind: "FOUND", category: "BOTTLE", description: "pink bottle" }));
    ok(await Locating.locate({ item: report, places: [b2] as never }));
    await application.whenIdle();
    ok(await api.reports.claim({ session: tamar.session, report }));
    await application.whenIdle();
    return report;
  }
  const unread = async (user: string) => (await Notifying._getUnread({ recipient: user as never })) as { subject: string; message: string }[];
  return { ...app, tom, tamar, sam, claimedBottle, unread };
}

describe("Thanking the finder", () => {
  test("Tamar thanks Tom with a note: Tom is told, and both of them see the note", async () => {
    const { api, application, mailer, tom, tamar, claimedBottle, unread } = await setup();
    const bottle = await claimedBottle();
    mailer.sent.length = 0;

    expect(await api.thanks.send({ session: tamar.session, report: bottle, note: "You saved my week!" })).toEqual({ report: bottle });
    await application.whenIdle();

    expect((await unread(tom.user)).filter(({ message }) => message.includes("thanked"))).toMatchObject([
      { subject: bottle, message: "The owner of an item you found thanked you." },
    ]);
    expect(mailer.sent).toEqual([{ to: "tom", message: "The owner of an item you found thanked you." }]);
    expect(ok(await api.reports.mine({ session: tom.session })).reports).toMatchObject([
      { report: bottle, claimedBy: "tamar", thanksNote: "You saved my week!" },
    ]);
    const [claim] = ok(await api.claims.mine({ session: tamar.session })).claims;
    expect(claim).toMatchObject({ report: bottle, thanksNote: "You saved my week!" });
    expect(typeof claim!.thankedAt).toBe("string");
  });

  test("thanks with no note is recorded with a null note, and before any thanks both fields are null", async () => {
    const { api, tom, tamar, claimedBottle } = await setup();
    const bottle = await claimedBottle();
    expect(ok(await api.claims.mine({ session: tamar.session })).claims).toMatchObject([{ thankedAt: null, thanksNote: null }]);

    ok(await api.thanks.send({ session: tamar.session, report: bottle }));
    const [mine] = ok(await api.reports.mine({ session: tom.session })).reports;
    expect(mine!.thankedAt).not.toBeNull();
    expect(mine!.thanksNote).toBeNull();
  });

  test("Sam, who didn't claim the bottle, and Tom, who found it, can't thank for it; nor can anyone for an unknown id", async () => {
    const { api, application, tom, tamar, sam, claimedBottle, unread } = await setup();
    const bottle = await claimedBottle();
    const before = (await unread(tom.user)).length;

    expect(await api.thanks.send({ session: sam.session, report: bottle })).toEqual({ error: "NOT_FOUND" });
    expect(await api.thanks.send({ session: tom.session, report: bottle })).toEqual({ error: "NOT_FOUND" });
    expect(await api.thanks.send({ session: tamar.session, report: "no-such-report" as never })).toEqual({ error: "NOT_FOUND" });
    await application.whenIdle();
    expect(await unread(tom.user)).toHaveLength(before);
    expect(ok(await api.reports.mine({ session: tom.session })).reports[0]!.thankedAt).toBeNull();
  });

  test("a second thanks is refused with ALREADY_THANKED, a bad note with INVALID_NOTE, and the first thanks is kept", async () => {
    const { api, application, tom, tamar, claimedBottle, unread } = await setup();
    const bottle = await claimedBottle();

    expect(await api.thanks.send({ session: tamar.session, report: bottle, note: "   " })).toEqual({ error: "INVALID_NOTE" });
    expect(await api.thanks.send({ session: tamar.session, report: bottle, note: "x".repeat(141) })).toEqual({ error: "INVALID_NOTE" });
    ok(await api.thanks.send({ session: tamar.session, report: bottle, note: "thanks!" }));
    expect(await api.thanks.send({ session: tamar.session, report: bottle, note: "again" })).toEqual({ error: "ALREADY_THANKED" });
    await application.whenIdle();

    expect((await unread(tom.user)).filter(({ message }) => message.includes("thanked"))).toHaveLength(1);
    expect(ok(await api.reports.mine({ session: tom.session })).reports[0]).toMatchObject({ thanksNote: "thanks!" });
  });

  test("over HTTP a second thanks is 409, a bad note 400, and someone else's claim 404", async () => {
    const { application, tamar, sam, claimedBottle } = await setup();
    const bottle = await claimedBottle();
    const handle = createHttpHandler({ application, gateway: createGateway({ application }), policy: lostFoundPolicy("http://localhost:3000") });
    const send = async (session: string, note: string | null) =>
      (
        await handle(
          new Request("http://localhost:3000/api/thanks/send", {
            method: "POST",
            headers: { "Content-Type": "application/json", Origin: "http://localhost:3000", Cookie: `__Host-lostfound-session=${session}` },
            body: JSON.stringify({ session: null, report: bottle, note }),
          }),
        )
      ).status;

    expect(await send(sam.session, null)).toBe(404);
    expect(await send(tamar.session, "")).toBe(400);
    expect(await send(tamar.session, null)).toBe(200);
    expect(await send(tamar.session, "again")).toBe(409);
  });
});

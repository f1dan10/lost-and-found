import { describe, expect, test } from "bun:test";
import { startLostFound } from "../support/app.ts";
import { ok } from "../support/reusable/results.ts";

async function setup() {
  const app = await startLostFound();
  const { application, register, addPlace } = app;
  const { Reporting, Locating } = application.concepts;
  const tom = await register("tom");
  const tamar = await register("tamar");
  const b2 = await addPlace("Building 2");

  async function file(reporter: string, kind: "FOUND" | "LOST", description: string) {
    const { report } = ok(await Reporting.file({ reporter: reporter as never, kind, category: "BOTTLE", description }));
    ok(await Locating.locate({ item: report, places: [b2] as never }));
    await application.whenIdle();
    await Bun.sleep(5);
    return report;
  }
  return { ...app, tom, tamar, file };
}

describe("Notifications", () => {
  test("after matches, Tamar's list has each notice newest first, with the report's category and description and no claimant", async () => {
    const { api, tom, tamar, file } = await setup();
    await file(tamar.user, "LOST", "my bottle");
    const first = await file(tom.user, "FOUND", "blue bottle");
    const second = await file(tom.user, "FOUND", "green bottle");

    const { notifications } = ok(await api.notifications.list({ session: tamar.session }));
    expect(notifications).toMatchObject([
      { subject: second, message: "An item matching your lost report was found.", category: "BOTTLE", description: "green bottle", claimedBy: null },
      { subject: first, description: "blue bottle", claimedBy: null },
    ]);
    expect(ok(await api.notifications.list({ session: tom.session })).notifications).toEqual([]);
  });

  test("after a claim, Tom's notice names tamar as the claimant", async () => {
    const { api, application, tom, tamar, file } = await setup();
    const bottle = await file(tom.user, "FOUND", "blue bottle");
    ok(await api.reports.claim({ session: tamar.session, report: bottle }));
    await application.whenIdle();

    const { notifications } = ok(await api.notifications.list({ session: tom.session }));
    expect(notifications).toMatchObject([
      { subject: bottle, message: "Your found item was claimed.", description: "blue bottle", claimedBy: "tamar" },
    ]);
  });

  test("marking a notice read removes it from the list", async () => {
    const { api, tom, tamar, file } = await setup();
    await file(tamar.user, "LOST", "my bottle");
    await file(tom.user, "FOUND", "blue bottle");
    const [notice] = ok(await api.notifications.list({ session: tamar.session })).notifications;

    expect(await api.notifications.read({ session: tamar.session, notification: notice!.notification })).toEqual({});
    expect(ok(await api.notifications.list({ session: tamar.session })).notifications).toEqual([]);
    expect(await api.notifications.read({ session: tamar.session, notification: notice!.notification })).toEqual({ error: "NOT_FOUND" });
  });

  test("Tom marking Tamar's notice gets NOT_FOUND, and her notice stays unread", async () => {
    const { api, tom, tamar, file } = await setup();
    await file(tamar.user, "LOST", "my bottle");
    await file(tom.user, "FOUND", "blue bottle");
    const [notice] = ok(await api.notifications.list({ session: tamar.session })).notifications;

    expect(await api.notifications.read({ session: tom.session, notification: notice!.notification })).toEqual({ error: "NOT_FOUND" });
    expect(await api.notifications.read({ session: tom.session, notification: "no-such-notice" as never })).toEqual({ error: "NOT_FOUND" });
    expect(ok(await api.notifications.list({ session: tamar.session })).notifications).toHaveLength(1);
  });

  test("both endpoints refuse a request with no session", async () => {
    const { api, tom } = await setup();
    await api.auth.logout({ session: tom.session });
    expect(await api.notifications.list({ session: tom.session })).toMatchObject({ error: "NOT_SIGNED_IN" });
    expect(await api.notifications.read({ session: tom.session, notification: "x" as never })).toMatchObject({ error: "NOT_SIGNED_IN" });
  });
});

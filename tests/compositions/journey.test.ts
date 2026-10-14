import { describe, expect, test } from "bun:test";
import { startLostFound } from "../support/app.ts";
import { ok } from "../support/reusable/results.ts";

const PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

describe("Lost&Found", () => {
  test("Tamar loses a bottle, Tom finds one, Tamar is told and claims it, and Tom is told who took it", async () => {
    const { api, application, mailer, register, addPlace } = await startLostFound();
    const tamar = await register("tamar");
    const tom = await register("tom");
    const building2 = await addPlace("Building 2");
    const stata = await addPlace("Stata");
    const building34 = await addPlace("Building 34");
    const w20 = await addPlace("W20");

    // Tamar doesn't know where she lost her bottle, so she lists four places.
    const lost = ok(
      await api.reports.file({
        session: tamar.session,
        kind: "LOST",
        category: "BOTTLE",
        description: "Blue water bottle with a dent",
        places: [building2, stata, building34, w20],
        photo: PHOTO,
      } as never),
    ).report;
    await application.whenIdle();
    expect(mailer.sent).toEqual([]);

    // Tom finds one in Building 2, leaves it there, and files one report.
    const found = ok(
      await api.reports.file({
        session: tom.session,
        kind: "FOUND",
        category: "BOTTLE",
        description: "Blue bottle on the lobby bench",
        places: [building2],
        photo: PHOTO,
        spot: "by the lobby bench",
      } as never),
    ).report;
    await application.whenIdle();

    // Tamar is told once, in the app and by email.
    const matches = ok(await api.notifications.list({ session: tamar.session })).notifications;
    expect(matches).toMatchObject([
      { subject: found, message: "An item matching your lost report was found.", category: "BOTTLE", claimedBy: null },
    ]);
    expect(mailer.sent).toEqual([{ to: "tamar", message: "An item matching your lost report was found." }]);
    expect(ok(await api.notifications.list({ session: tom.session })).notifications).toEqual([]);

    // Both lists show their reports.
    const reports = ok(await api.reports.list({ session: tamar.session }));
    expect(reports.found).toMatchObject([
      { report: found, username: "tom", spot: "by the lobby bench", photo: PHOTO, places: [{ place: building2, name: "Building 2" }] },
    ]);
    expect(reports.lost).toMatchObject([{ report: lost, username: "tamar", spot: null }]);
    expect(reports.lost[0]?.places.map(({ name }) => name)).toEqual(["Building 2", "Building 34", "Stata", "W20"]);

    // Tamar claims the bottle: the found report closes and Tom learns who took it.
    expect(await api.reports.claim({ session: tamar.session, report: found })).toEqual({ report: found });
    await application.whenIdle();
    expect(ok(await api.reports.list({ session: tom.session })).found).toEqual([]);
    expect(await application.concepts.Reporting._getReport({ report: found })).toMatchObject([{ status: "RESOLVED" }]);
    expect(ok(await api.notifications.list({ session: tom.session })).notifications).toMatchObject([
      { subject: found, message: "Your found item was claimed.", claimedBy: "tamar" },
    ]);
    expect(mailer.sent.at(-1)).toEqual({ to: "tom", message: "Your found item was claimed." });
    expect(mailer.sent).toHaveLength(2);

    // Nobody can claim it again, and Tamar's own lost report stays open until she resolves it.
    expect(await api.reports.claim({ session: tamar.session, report: found })).toEqual({ error: "NOT_FOUND" });
    expect(ok(await api.reports.list({ session: tamar.session })).lost).toMatchObject([{ report: lost }]);

    // The bell empties when each person reads their notice.
    ok(await api.notifications.read({ session: tamar.session, notification: matches[0]!.notification }));
    expect(ok(await api.notifications.list({ session: tamar.session })).notifications).toEqual([]);
  });
});

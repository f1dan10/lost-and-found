import { describe, expect, test } from "bun:test";
import { startLostFound } from "../support/app.ts";
import { ok } from "../support/reusable/results.ts";

async function setup() {
  const app = await startLostFound();
  const { application, register, addPlace } = app;
  const { Reporting, Locating, Notifying } = application.concepts;
  const tamar = await register("tamar");
  const tom = await register("tom");
  const places = { b2: await addPlace("Building 2"), stata: await addPlace("Stata"), b34: await addPlace("Building 34"), w20: await addPlace("W20"), b7: await addPlace("Building 7") };

  async function file(reporter: string, kind: "FOUND" | "LOST", category: "BOTTLE" | "KEYS_ID", where: string[]) {
    const { report } = ok(await Reporting.file({ reporter: reporter as never, kind, category, description: "a thing" }));
    ok(await Locating.locate({ item: report, places: where as never }));
    await application.whenIdle();
    return report;
  }
  const unread = async (user: string) => (await Notifying._getUnread({ recipient: user as never })) as { subject: string; message: string }[];
  return { ...app, Reporting, tamar, tom, places, file, unread };
}

const lostAtFour = (places: Awaited<ReturnType<typeof setup>>["places"]) => [places.b2, places.stata, places.b34, places.w20];

describe("Matching", () => {
  test("Tamar's lost bottle at four places and Tom's found bottle at Building 2 give Tamar one notice and one email", async () => {
    const { mailer, tamar, tom, places, file, unread } = await setup();
    await file(tamar.user, "LOST", "BOTTLE", lostAtFour(places));
    const found = await file(tom.user, "FOUND", "BOTTLE", [places.b2]);

    expect(await unread(tamar.user)).toMatchObject([{ subject: found, message: "An item matching your lost report was found." }]);
    expect(await unread(tom.user)).toEqual([]);
    expect(mailer.sent).toEqual([{ to: "tamar", message: "An item matching your lost report was found." }]);
  });

  test("a different category gives no notice", async () => {
    const { mailer, tamar, tom, places, file, unread } = await setup();
    await file(tamar.user, "LOST", "BOTTLE", lostAtFour(places));
    await file(tom.user, "FOUND", "KEYS_ID", [places.b2]);
    expect(await unread(tamar.user)).toEqual([]);
    expect(mailer.sent).toEqual([]);
  });

  test("a place Tamar didn't list gives no notice", async () => {
    const { mailer, tamar, tom, places, file, unread } = await setup();
    await file(tamar.user, "LOST", "BOTTLE", lostAtFour(places));
    await file(tom.user, "FOUND", "BOTTLE", [places.b7]);
    expect(await unread(tamar.user)).toEqual([]);
    expect(mailer.sent).toEqual([]);
  });

  test("a withdrawn or resolved lost report gives no notice", async () => {
    const { Reporting, application, mailer, tamar, tom, places, file, unread } = await setup();
    const withdrawn = await file(tamar.user, "LOST", "BOTTLE", lostAtFour(places));
    const resolved = await file(tamar.user, "LOST", "BOTTLE", lostAtFour(places));
    ok(await Reporting.withdraw({ report: withdrawn }));
    ok(await Reporting.resolve({ report: resolved }));
    await application.whenIdle();
    await file(tom.user, "FOUND", "BOTTLE", [places.b2]);
    expect(await unread(tamar.user)).toEqual([]);
    expect(mailer.sent).toEqual([]);
  });

  test("two matching lost reports give two notices", async () => {
    const { mailer, tamar, tom, places, file, unread } = await setup();
    await file(tamar.user, "LOST", "BOTTLE", [places.b2]);
    await file(tom.user, "LOST", "BOTTLE", lostAtFour(places));
    const found = await file(tamar.user, "FOUND", "BOTTLE", [places.b2]);

    expect(await unread(tamar.user)).toMatchObject([{ subject: found }]);
    expect(await unread(tom.user)).toMatchObject([{ subject: found }]);
    expect(mailer.sent.map(({ to }) => to).sort()).toEqual(["tamar", "tom"]);
  });
});

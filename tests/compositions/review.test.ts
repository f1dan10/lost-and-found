import { describe, expect, test } from "bun:test";
import { startLostFound } from "../support/app.ts";
import { ok } from "../support/reusable/results.ts";

const PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

async function setup() {
  const app = await startLostFound();
  const tom = await app.register("tom");
  const tamar = await app.register("tamar");
  const ann = await app.register("ann");
  const b2 = await app.addPlace("Building 2");
  return { ...app, tom, tamar, ann, b2 };
}

describe("Review fixes", () => {
  test("a spot of only spaces is refused and leaves no report behind", async () => {
    const { api, tom, b2 } = await setup();
    const result = await api.reports.file({
      session: tom.session,
      kind: "FOUND",
      category: "BOTTLE",
      description: "blue bottle",
      places: [b2],
      spot: "   ",
    } as never);
    expect(result).toHaveProperty("error");
    const { found } = ok(await api.reports.list({ session: tom.session }));
    expect(found).toEqual([]);
  });

  test("a photo must be an image data URL", async () => {
    const { api, tom, b2 } = await setup();
    for (const photo of ["https://example.com/tracker.png", "data:text/html;base64,PGI+", "plain text"]) {
      const result = await api.reports.file({
        session: tom.session,
        kind: "FOUND",
        category: "BOTTLE",
        description: "blue bottle",
        places: [b2],
        photo,
      } as never);
      expect(result).toHaveProperty("error");
    }
    expect(ok(await api.reports.list({ session: tom.session })).found).toEqual([]);
  });

  test("a lost reporter with a match notice never learns who claimed the found item", async () => {
    const { api, application, tom, tamar, ann, b2 } = await setup();
    for (const person of [tamar, ann]) {
      ok(
        await api.reports.file({
          session: person.session,
          kind: "LOST",
          category: "BOTTLE",
          description: "my bottle",
          places: [b2],
          photo: PHOTO,
        } as never),
      );
    }
    const found = ok(
      await api.reports.file({
        session: tom.session,
        kind: "FOUND",
        category: "BOTTLE",
        description: "blue bottle",
        places: [b2],
        photo: PHOTO,
      } as never),
    ).report;
    await application.whenIdle();
    ok(await api.reports.claim({ session: tamar.session, report: found }));
    await application.whenIdle();

    const annNotices = ok(await api.notifications.list({ session: ann.session })).notifications;
    expect(annNotices).toHaveLength(1);
    expect(annNotices[0]).toMatchObject({ subject: found, claimedBy: null });
    // The finder still learns who took it.
    const tomNotices = ok(await api.notifications.list({ session: tom.session })).notifications;
    expect(tomNotices[0]).toMatchObject({ claimedBy: "tamar" });
  });

  test("the report cards do not expose the reporter's internal id", async () => {
    const { api, tom, tamar, b2 } = await setup();
    ok(
      await api.reports.file({
        session: tom.session,
        kind: "FOUND",
        category: "BOTTLE",
        description: "blue bottle",
        places: [b2],
      } as never),
    );
    const [card] = ok(await api.reports.list({ session: tamar.session })).found;
    expect(card).toMatchObject({ username: "tom" });
    expect(card).not.toHaveProperty("reporter");
  });
});

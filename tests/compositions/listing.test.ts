import { describe, expect, test } from "bun:test";
import { startLostFound } from "../support/app.ts";
import { ok } from "../support/reusable/results.ts";

/** Files reports the way the endpoint does, one at a time so each has its own filing time. */
async function setup() {
  const app = await startLostFound();
  const { application, register, addPlace } = app;
  const { Reporting, Locating } = application.concepts;
  const maya = await register("maya");
  const tamar = await register("tamar");
  const places = { b2: await addPlace("Building 2"), stata: await addPlace("Stata"), b34: await addPlace("Building 34"), w20: await addPlace("W20") };

  async function file(reporter: string, kind: "FOUND" | "LOST", description: string, where: string[], extras: { photo?: string; spot?: string } = {}) {
    const { report } = ok(await Reporting.file({ reporter: reporter as never, kind, category: "BOTTLE", description, ...(extras.photo ? { photo: extras.photo } : {}) }));
    ok(await Locating.locate({ item: report, places: where as never, ...(extras.spot ? { spot: extras.spot } : {}) }));
    await Bun.sleep(5);
    return report;
  }
  return { ...app, Reporting, maya, tamar, places, file };
}

describe("Listing reports and places", () => {
  test("both lists are newest first", async () => {
    const { api, maya, tamar, places, file } = await setup();
    await file(maya.user, "FOUND", "first found", [places.b2]);
    await file(maya.user, "FOUND", "second found", [places.b2]);
    await file(tamar.user, "LOST", "first lost", [places.b2]);
    await file(tamar.user, "LOST", "second lost", [places.b2]);

    const { found, lost } = ok(await api.reports.list({ session: maya.session }));
    expect(found.map(({ description }) => description)).toEqual(["second found", "first found"]);
    expect(lost.map(({ description }) => description)).toEqual(["second lost", "first lost"]);
    expect(found[0]).toMatchObject({ category: "BOTTLE", reporter: maya.user, username: "maya" });

    const names = ok(await api.places.list({ session: maya.session })).places.map(({ name }) => name);
    expect(names).toEqual(["Building 2", "Building 34", "Stata", "W20"]);
    expect(ok(await api.places.list({ session: maya.session })).places[0]).toMatchObject({
      place: places.b2,
      latitude: 42.36,
      longitude: -71.09,
    });
  });

  test("a found report shows exactly one place, and a lost report shows all of its places", async () => {
    const { api, maya, tamar, places, file } = await setup();
    await file(maya.user, "FOUND", "found", [places.b2]);
    await file(tamar.user, "LOST", "lost", [places.w20, places.b2, places.stata, places.b34]);

    const { found, lost } = ok(await api.reports.list({ session: maya.session }));
    expect(found[0]?.places).toEqual([{ place: places.b2, name: "Building 2" }]);
    expect(lost[0]?.places.map(({ name }) => name)).toEqual(["Building 2", "Building 34", "Stata", "W20"]);
  });

  test("a report has its spot and photo when it has them, and null when it has none", async () => {
    const { api, maya, places, file } = await setup();
    await file(maya.user, "FOUND", "with", [places.b2], { photo: "data:image/png;base64,AAAA", spot: "by the lobby bench" });
    await file(maya.user, "FOUND", "without", [places.b2]);

    const { found } = ok(await api.reports.list({ session: maya.session }));
    expect(found.find(({ description }) => description === "with")).toMatchObject({
      spot: "by the lobby bench",
      photo: "data:image/png;base64,AAAA",
    });
    expect(found.find(({ description }) => description === "without")).toMatchObject({ spot: null, photo: null });
  });

  test("resolved and withdrawn reports are absent", async () => {
    const { api, Reporting, maya, places, file } = await setup();
    const resolved = await file(maya.user, "FOUND", "resolved", [places.b2]);
    const withdrawn = await file(maya.user, "FOUND", "withdrawn", [places.b2]);
    await file(maya.user, "FOUND", "open", [places.b2]);
    ok(await Reporting.resolve({ report: resolved }));
    ok(await Reporting.withdraw({ report: withdrawn }));

    const { found } = ok(await api.reports.list({ session: maya.session }));
    expect(found.map(({ description }) => description)).toEqual(["open"]);
  });

  test("both endpoints refuse a request with no session", async () => {
    const { api, maya } = await setup();
    await api.auth.logout({ session: maya.session });
    expect(await api.reports.list({ session: maya.session })).toMatchObject({ error: "NOT_SIGNED_IN" });
    expect(await api.places.list({ session: maya.session })).toMatchObject({ error: "NOT_SIGNED_IN" });
  });
});

import { describe, expect, test } from "bun:test";
import { LocatingConcept } from "../../src/concepts/Locating/Locating.ts";
import { PLACES, seedPlaces } from "../../src/host/seed.ts";
import { testDatabase } from "../support/reusable/mongo.ts";

describe("seedPlaces", () => {
  test("adds every place, ordered by name, including the ones the user journey names", async () => {
    const database = await testDatabase();
    await seedPlaces(database);
    const places = await new LocatingConcept<string>(database, "Locating")._getPlaces();
    expect(places).toHaveLength(PLACES.length);
    const names = places.map(({ name }) => name);
    expect(names).toEqual([...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
    for (const name of ["Building 2", "Building 32 (Stata)", "Building 34", "W20 (Student Center)"]) {
      expect(names).toContain(name);
    }
  });

  test("running it twice leaves the same places with the same ids", async () => {
    const database = await testDatabase();
    await seedPlaces(database);
    const locating = new LocatingConcept<string>(database, "Locating");
    const before = await locating._getPlaces();
    await seedPlaces(database);
    expect(await locating._getPlaces()).toEqual(before);
  });

  test("every latitude and longitude is on Earth", () => {
    for (const { latitude, longitude } of PLACES) {
      expect(Math.abs(latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(longitude)).toBeLessThanOrEqual(180);
    }
  });
});

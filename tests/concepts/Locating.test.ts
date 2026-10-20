import { describe, expect, test } from "bun:test";
import {
  AlreadyLocated,
  InvalidPlace,
  LocatingConcept,
  PlaceExists,
  type Place,
} from "../../src/concepts/Locating/Locating.ts";
import { testDatabase } from "../support/reusable/mongo.ts";
import { expectOneWinner } from "../support/reusable/race.ts";

async function setup() {
  return { locating: new LocatingConcept<string>(await testDatabase()) };
}

async function addPlaces(locating: LocatingConcept<string>, names: string[]) {
  const places: Place[] = [];
  for (const [index, name] of names.entries()) {
    places.push((await locating.addPlace({ name, latitude: 42 + index / 1000, longitude: -71 })).place);
  }
  return places;
}

describe("Locating", () => {
  test("its principle: Tom and Tamar's bottles are both at Building 2, and a second location or an unknown place is refused", async () => {
    const { locating } = await setup();
    const [b2, stata, b34, w20] = await addPlaces(locating, ["Building 2", "Stata", "Building 34", "W20"]);

    await locating.locate({ item: "tom-bottle", places: [b2!], spot: "by the lobby bench" });
    await locating.locate({ item: "tamar-bottle", places: [b2!, stata!, b34!, w20!] });

    expect(await locating._getItemsAt({ place: b2! })).toEqual([{ item: "tamar-bottle" }, { item: "tom-bottle" }]);
    expect((await locating._getPlacesOf({ item: "tamar-bottle" })).map(({ name }) => name)).toEqual([
      "Building 2",
      "Building 34",
      "Stata",
      "W20",
    ]);
    expect(await locating._getSpot({ item: "tom-bottle" })).toEqual([{ spot: "by the lobby bench" }]);
    expect(await locating._getSpot({ item: "tamar-bottle" })).toEqual([]);
    expect(await locating._getNeighbors({ item: "tom-bottle" })).toEqual([{ other: "tamar-bottle" }]);
    expect(await locating._getNeighbors({ item: "tamar-bottle" })).toEqual([{ other: "tom-bottle" }]);

    const again = locating.locate({ item: "tom-bottle", places: [stata!] });
    await expect(again).rejects.toThrow(AlreadyLocated);
    await expect(again).rejects.toThrow("This item already has a location.");
    const unknown = locating.locate({ item: "sam-keys", places: ["nowhere" as Place] });
    await expect(unknown).rejects.toThrow("That place doesn't exist.");
  });

  test("addPlace stores the trimmed name and coordinates, and _getPlaces is empty at first and ordered by name", async () => {
    const { locating } = await setup();
    expect(await locating._getPlaces()).toEqual([]);
    const { place: b2 } = await locating.addPlace({ name: "  Building 2 ", latitude: 42.36, longitude: -71.09 });
    const { place: a } = await locating.addPlace({ name: "Atrium", latitude: 1, longitude: 2 });
    expect(await locating._getPlaces()).toEqual([
      { place: a, name: "Atrium", latitude: 1, longitude: 2 },
      { place: b2, name: "Building 2", latitude: 42.36, longitude: -71.09 },
    ]);
  });

  test("a place needs a name of 1 to 60 characters and a latitude and longitude on Earth", async () => {
    const { locating } = await setup();
    const refused = [
      { name: "", latitude: 0, longitude: 0 },
      { name: "   ", latitude: 0, longitude: 0 },
      { name: "x".repeat(61), latitude: 0, longitude: 0 },
      { name: "a", latitude: 90.0001, longitude: 0 },
      { name: "a", latitude: -90.0001, longitude: 0 },
      { name: "a", latitude: 0, longitude: 180.0001 },
      { name: "a", latitude: 0, longitude: -180.0001 },
      { name: "a", latitude: NaN, longitude: 0 },
      { name: "a", latitude: 0, longitude: Infinity },
    ];
    for (const place of refused) await expect(locating.addPlace(place)).rejects.toThrow(InvalidPlace);
    expect(await locating._getPlaces()).toEqual([]);

    await locating.addPlace({ name: "x".repeat(60), latitude: 90, longitude: 180 });
    await locating.addPlace({ name: "y", latitude: -90, longitude: -180 });
    expect(await locating._getPlaces()).toHaveLength(2);
  });

  test("a second place with one name is refused, even with spaces around it, but another capitalization is another place", async () => {
    const { locating } = await setup();
    await locating.addPlace({ name: "Building 2", latitude: 1, longitude: 1 });
    await expect(locating.addPlace({ name: "Building 2", latitude: 2, longitude: 2 })).rejects.toThrow(PlaceExists);
    await expect(locating.addPlace({ name: "  Building 2  ", latitude: 2, longitude: 2 })).rejects.toThrow(
      "There is already a place with that name.",
    );
    await locating.addPlace({ name: "building 2", latitude: 2, longitude: 2 });
    expect(await locating._getPlaces()).toHaveLength(2);
  });

  test("of two simultaneous additions of one name, one succeeds and one place exists", async () => {
    const { locating } = await setup();
    await expectOneWinner(
      [
        locating.addPlace({ name: "Stata", latitude: 1, longitude: 1 }),
        locating.addPlace({ name: "Stata", latitude: 2, longitude: 2 }),
      ],
      PlaceExists,
    );
    expect(await locating._getPlaces()).toHaveLength(1);
  });

  test("locate refuses no places, too many places, a bad spot, and an unknown place, and stores nothing", async () => {
    const { locating } = await setup();
    const places = await addPlaces(locating, Array.from({ length: 13 }, (_, i) => `Place ${i}`));
    const [first] = places as [Place];

    await expect(locating.locate({ item: "a", places: [] })).rejects.toThrow("An item needs at least one place.");
    await expect(locating.locate({ item: "a", places: "nope" as never })).rejects.toThrow("at least one place");
    await expect(locating.locate({ item: "a", places })).rejects.toThrow("An item can be in at most 12 places.");
    for (const spot of ["", "   ", "x".repeat(101)]) {
      await expect(locating.locate({ item: "a", places: [first], spot })).rejects.toThrow(
        "A spot must have 1 to 100 characters.",
      );
    }
    await expect(locating.locate({ item: "a", places: [first, "nowhere" as Place] })).rejects.toThrow(
      "That place doesn't exist.",
    );
    await expect(locating.locate({ item: "a", places: [first, 7 as never] })).rejects.toThrow("doesn't exist");
    expect(await locating._getPlacesOf({ item: "a" })).toEqual([]);

    await locating.locate({ item: "b", places: [...places.slice(0, 12), first], spot: "x".repeat(100) });
    expect(await locating._getPlacesOf({ item: "b" })).toHaveLength(12);
    await expect(locating.locate({ item: "b", places: ["nowhere" as Place] })).rejects.toThrow("doesn't exist");
  });

  test("the order and repeats of the places don't matter, and results are sorted by name", async () => {
    const { locating } = await setup();
    const [c, a, b] = await addPlaces(locating, ["C", "A", "B"]);
    await locating.locate({ item: "x", places: [c!, a!, c!, b!, a!] });
    expect((await locating._getPlacesOf({ item: "x" })).map(({ name }) => name)).toEqual(["A", "B", "C"]);
  });

  test("the spot is stored trimmed, and undefined or null means no spot", async () => {
    const { locating } = await setup();
    const [a] = (await addPlaces(locating, ["A"])) as [Place];
    await locating.locate({ item: "one", places: [a], spot: "  by the door " });
    await locating.locate({ item: "two", places: [a], spot: undefined });
    await locating.locate({ item: "three", places: [a], spot: null as never });
    expect(await locating._getSpot({ item: "one" })).toEqual([{ spot: "by the door" }]);
    expect(await locating._getSpot({ item: "two" })).toEqual([]);
    expect(await locating._getSpot({ item: "three" })).toEqual([]);
  });

  test("of two simultaneous locations of one item, one succeeds", async () => {
    const { locating } = await setup();
    const [a, b] = await addPlaces(locating, ["A", "B"]);
    await expectOneWinner(
      [locating.locate({ item: "x", places: [a!] }), locating.locate({ item: "x", places: [b!] })],
      AlreadyLocated,
    );
    expect(await locating._getPlacesOf({ item: "x" })).toHaveLength(1);
  });

  test("a lost item appears at each of its places, a found item only at its own, and an empty place has none", async () => {
    const { locating } = await setup();
    const [a, b, c] = await addPlaces(locating, ["A", "B", "C"]);
    await locating.locate({ item: "found", places: [a!] });
    await locating.locate({ item: "lost", places: [a!, b!] });
    expect(await locating._getItemsAt({ place: a! })).toEqual([{ item: "found" }, { item: "lost" }]);
    expect(await locating._getItemsAt({ place: b! })).toEqual([{ item: "lost" }]);
    expect(await locating._getItemsAt({ place: c! })).toEqual([]);
  });

  test("neighbors share at least one place, each comes once however many places overlap, and an item is not its own", async () => {
    const { locating } = await setup();
    const [a, b, c] = await addPlaces(locating, ["A", "B", "C"]);
    await locating.locate({ item: "lost", places: [a!, b!] });
    await locating.locate({ item: "both", places: [a!, b!] });
    await locating.locate({ item: "one", places: [b!, c!] });
    await locating.locate({ item: "elsewhere", places: [c!] });

    expect(await locating._getNeighbors({ item: "lost" })).toEqual([{ other: "both" }, { other: "one" }]);
    expect(await locating._getNeighbors({ item: "elsewhere" })).toEqual([{ other: "one" }]);
    expect(await locating._getNeighbors({ item: "nowhere" })).toEqual([]);
  });

  test("_unknown lists missing places in order without repeats, and everything is empty for the unknown", async () => {
    const { locating } = await setup();
    const [a] = (await addPlaces(locating, ["A"])) as [Place];
    expect(await locating._unknown({ places: ["z", a, "y", "z"] as Place[] })).toEqual([{ place: "z" as Place }, { place: "y" as Place }]);
    expect(await locating._unknown({ places: [a] })).toEqual([]);
    expect(await locating._unknown({ places: "nope" as never })).toEqual([]);
    expect(await locating._getPlacesOf({ item: "nobody" })).toEqual([]);
    expect(await locating._getSpot({ item: "nobody" })).toEqual([]);
    expect(await locating._getItemsAt({ place: "nowhere" as Place })).toEqual([]);
  });
});

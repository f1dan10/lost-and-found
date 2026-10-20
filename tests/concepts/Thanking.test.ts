import { describe, expect, test } from "bun:test";
import { AlreadyThanked, InvalidNote, ThankingConcept } from "../../src/concepts/Thanking/Thanking.ts";
import { testDatabase } from "../support/reusable/mongo.ts";
import { expectOneWinner } from "../support/reusable/race.ts";

const NOON = new Date(Date.UTC(2026, 9, 20, 12, 0));

async function setup() {
  const database = await testDatabase();
  return { thanking: new ThankingConcept<string, string>(database, "Thanking", () => NOON), database };
}

describe("Thanking", () => {
  test("its principle: Tamar thanks for her bottle with a note, anyone can read it, a second thanks is refused, and Sam thanks with no note", async () => {
    const { thanking } = await setup();
    expect(await thanking.thank({ thanker: "tamar", item: "bottle", note: "You saved my week!" })).toEqual({ item: "bottle" });
    expect(await thanking._getThanks({ item: "bottle" })).toEqual([{ thanker: "tamar", thankedAt: NOON }]);
    expect(await thanking._getNote({ item: "bottle" })).toEqual([{ note: "You saved my week!" }]);

    const again = thanking.thank({ thanker: "tamar", item: "bottle" });
    await expect(again).rejects.toThrow(AlreadyThanked);
    await expect(again).rejects.toThrow("This has already been thanked for.");

    await thanking.thank({ thanker: "sam", item: "keys" });
    expect(await thanking._getThanks({ item: "keys" })).toEqual([{ thanker: "sam", thankedAt: NOON }]);
    expect(await thanking._getNote({ item: "keys" })).toEqual([]);
  });

  test("a blank or over-long note is refused and nothing is recorded; a note is stored trimmed, and null means no note", async () => {
    const { thanking } = await setup();
    for (const note of ["", "   ", "x".repeat(141)]) {
      await expect(thanking.thank({ thanker: "tamar", item: "bottle", note })).rejects.toThrow(InvalidNote);
    }
    expect(await thanking._getThanks({ item: "bottle" })).toEqual([]);

    await thanking.thank({ thanker: "tamar", item: "bottle", note: `  ${"x".repeat(140)}  ` });
    expect(await thanking._getNote({ item: "bottle" })).toEqual([{ note: "x".repeat(140) }]);
    await thanking.thank({ thanker: "tamar", item: "keys", note: null });
    expect(await thanking._getNote({ item: "keys" })).toEqual([]);
  });

  test("a second thanks by someone else is refused too, and the first one is kept", async () => {
    const { thanking } = await setup();
    await thanking.thank({ thanker: "tamar", item: "bottle", note: "thanks!" });
    await expect(thanking.thank({ thanker: "sam", item: "bottle", note: "me too" })).rejects.toThrow(AlreadyThanked);
    expect(await thanking._getThanks({ item: "bottle" })).toEqual([{ thanker: "tamar", thankedAt: NOON }]);
    expect(await thanking._getNote({ item: "bottle" })).toEqual([{ note: "thanks!" }]);
  });

  test("of two simultaneous thanks for one item, one wins and one is stored", async () => {
    const { thanking, database } = await setup();
    await expectOneWinner(
      [thanking.thank({ thanker: "tamar", item: "bottle" }), thanking.thank({ thanker: "tamar", item: "bottle" })],
      AlreadyThanked,
    );
    expect(await database.collection("thanking.thanks").countDocuments()).toBe(1);
  });

  test("nothing is known about an item nobody thanked for", async () => {
    const { thanking } = await setup();
    expect(await thanking._getThanks({ item: "bottle" })).toEqual([]);
    expect(await thanking._getNote({ item: "bottle" })).toEqual([]);
  });
});

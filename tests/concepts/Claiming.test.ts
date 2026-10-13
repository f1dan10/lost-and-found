import { describe, expect, test } from "bun:test";
import { AlreadyClaimed, ClaimingConcept } from "../../src/concepts/Claiming/Claiming.ts";
import { testDatabase } from "../support/reusable/mongo.ts";
import { expectOneWinner } from "../support/reusable/race.ts";

const NOON = new Date(Date.UTC(2026, 9, 13, 12, 0));

async function setup() {
  const database = await testDatabase();
  return { claiming: new ClaimingConcept<string, string>(database, "Claiming", () => NOON), database };
}

describe("Claiming", () => {
  test("its principle: Tamar claims Tom's bottle, anyone is told so with the time, and a second claim is refused", async () => {
    const { claiming } = await setup();
    expect(await claiming.claim({ claimant: "tamar", item: "bottle" })).toEqual({ item: "bottle" });
    expect(await claiming._getClaimant({ item: "bottle" })).toEqual([{ claimant: "tamar", claimedAt: NOON }]);

    const second = claiming.claim({ claimant: "sam", item: "bottle" });
    await expect(second).rejects.toThrow(AlreadyClaimed);
    await expect(second).rejects.toThrow("This item has already been claimed.");
  });

  test("a second claim by a different person or by the same person is refused, and the first claimant is unchanged", async () => {
    const { claiming } = await setup();
    await claiming.claim({ claimant: "tamar", item: "bottle" });
    for (const claimant of ["sam", "tamar"]) {
      await expect(claiming.claim({ claimant, item: "bottle" })).rejects.toThrow(AlreadyClaimed);
    }
    expect(await claiming._getClaimant({ item: "bottle" })).toEqual([{ claimant: "tamar", claimedAt: NOON }]);
  });

  test("the same person can claim different items", async () => {
    const { claiming } = await setup();
    await claiming.claim({ claimant: "tamar", item: "bottle" });
    await claiming.claim({ claimant: "tamar", item: "keys" });
    expect(await claiming._getClaimant({ item: "bottle" })).toMatchObject([{ claimant: "tamar" }]);
    expect(await claiming._getClaimant({ item: "keys" })).toMatchObject([{ claimant: "tamar" }]);
  });

  test("of two simultaneous claims on one item, one wins and one claim is stored", async () => {
    const { claiming, database } = await setup();
    await expectOneWinner(
      [claiming.claim({ claimant: "tamar", item: "bottle" }), claiming.claim({ claimant: "sam", item: "bottle" })],
      AlreadyClaimed,
    );
    expect(await database.collection("claiming.claims").countDocuments()).toBe(1);
  });

  test("an unclaimed or unknown item has no claimant", async () => {
    const { claiming } = await setup();
    await claiming.claim({ claimant: "tamar", item: "bottle" });
    expect(await claiming._getClaimant({ item: "keys" })).toEqual([]);
  });
});

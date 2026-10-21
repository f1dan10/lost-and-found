import { describe, expect, test } from "bun:test";
import { AlreadyClaimed, AlreadyCollected, ClaimingConcept, NotClaimed } from "../../src/concepts/Claiming/Claiming.ts";
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

  test("the recent claims are the last N days', newest first; older claims are left out but still recorded", async () => {
    let now = NOON;
    const claiming = new ClaimingConcept<string, string>(await testDatabase(), "Claiming", () => now);
    const day = 24 * 60 * 60 * 1000;
    await claiming.claim({ claimant: "tamar", item: "bottle" });
    now = new Date(NOON.getTime() + 10 * day);
    await claiming.claim({ claimant: "sam", item: "keys" });
    now = new Date(NOON.getTime() + 25 * day);

    expect(await claiming._recent({ days: 30 })).toEqual([
      { item: "keys", claimant: "sam", claimedAt: new Date(NOON.getTime() + 10 * day) },
      { item: "bottle", claimant: "tamar", claimedAt: NOON },
    ]);
    expect(await claiming._recent({ days: 7 })).toEqual([]);

    now = new Date(NOON.getTime() + 31 * day);
    expect((await claiming._recent({ days: 30 })).map(({ item }) => item)).toEqual(["keys"]);
    expect(await claiming._getClaimant({ item: "bottle" })).toEqual([{ claimant: "tamar", claimedAt: NOON }]);

    for (const days of [0, -1, Number.NaN]) expect(await claiming._recent({ days })).toEqual([]);
  });

  test("a claimant's claims come newest first, however old, and never another person's", async () => {
    let now = NOON;
    const claiming = new ClaimingConcept<string, string>(await testDatabase(), "Claiming", () => now);
    await claiming.claim({ claimant: "tamar", item: "bottle" });
    now = new Date(NOON.getTime() + 60_000);
    await claiming.claim({ claimant: "tamar", item: "keys" });
    await claiming.claim({ claimant: "sam", item: "bag" });

    expect(await claiming._byClaimant({ claimant: "tamar" })).toEqual([
      { item: "keys", claimedAt: now },
      { item: "bottle", claimedAt: NOON },
    ]);
    expect(await claiming._byClaimant({ claimant: "nobody" })).toEqual([]);
  });

  test("its principle, continued: Tamar picks the bottle up once, anyone is told when, and a second pickup is refused", async () => {
    let now = NOON;
    const claiming = new ClaimingConcept<string, string>(await testDatabase(), "Claiming", () => now);
    await claiming.claim({ claimant: "tamar", item: "bottle" });
    expect(await claiming._getCollected({ item: "bottle" })).toEqual([]);

    now = new Date(NOON.getTime() + 60 * 60 * 1000);
    expect(await claiming.collect({ item: "bottle" })).toEqual({ item: "bottle" });
    expect(await claiming._getCollected({ item: "bottle" })).toEqual([{ collectedAt: now }]);

    const again = claiming.collect({ item: "bottle" });
    await expect(again).rejects.toThrow(AlreadyCollected);
    await expect(again).rejects.toThrow("This item was already picked up.");
    expect(await claiming._getCollected({ item: "bottle" })).toEqual([{ collectedAt: now }]);
    expect(await claiming._getClaimant({ item: "bottle" })).toEqual([{ claimant: "tamar", claimedAt: NOON }]);
  });

  test("picking up an item nobody claimed is refused with NOT_CLAIMED, and nothing is recorded", async () => {
    const { claiming } = await setup();
    await expect(claiming.collect({ item: "keys" })).rejects.toThrow(NotClaimed);
    await expect(claiming.collect({ item: "keys" })).rejects.toThrow("Nobody has claimed this item.");
    expect(await claiming._getCollected({ item: "keys" })).toEqual([]);
    expect(await claiming._getClaimant({ item: "keys" })).toEqual([]);
  });

  test("of two simultaneous pickups of one item, one succeeds and the other is refused", async () => {
    const { claiming } = await setup();
    await claiming.claim({ claimant: "tamar", item: "bottle" });
    await expectOneWinner([claiming.collect({ item: "bottle" }), claiming.collect({ item: "bottle" })], AlreadyCollected);
    expect(await claiming._getCollected({ item: "bottle" })).toEqual([{ collectedAt: NOON }]);
  });

  test("picking up one item leaves the others not picked up", async () => {
    const { claiming } = await setup();
    await claiming.claim({ claimant: "tamar", item: "bottle" });
    await claiming.claim({ claimant: "tamar", item: "keys" });
    await claiming.collect({ item: "bottle" });
    expect(await claiming._getCollected({ item: "keys" })).toEqual([]);
  });

  test("an unclaimed or unknown item has no claimant", async () => {
    const { claiming } = await setup();
    await claiming.claim({ claimant: "tamar", item: "bottle" });
    expect(await claiming._getClaimant({ item: "keys" })).toEqual([]);
  });
});

import { type Collection, type Db, MongoServerError } from "mongodb";

export class AlreadyClaimed extends Error {}

const DAY_MS = 24 * 60 * 60 * 1000;

interface ClaimDocument<Claimant, Item> {
  _id: Item;
  claimant: Claimant;
  claimedAt: Date;
}

/** Makes taking a thing accountable by recording who took it. */
export class ClaimingConcept<Claimant extends string, Item extends string> {
  private readonly claims: Collection<ClaimDocument<Claimant, Item>>;

  constructor(
    database: Db,
    name = "Claiming",
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.claims = database.collection(`${name.toLowerCase()}.claims`);
  }

  // The item is the document's _id, which MongoDB indexes uniquely from the start, so it refuses a second
  // claim of one item even when two requests arrive at once, and no index has to be created first.
  async claim({ claimant, item }: { claimant: Claimant; item: Item }) {
    try {
      await this.claims.insertOne({ _id: item, claimant, claimedAt: this.clock() });
    } catch (error) {
      if (isDuplicate(error)) throw new AlreadyClaimed("This item has already been claimed.");
      throw error;
    }
    return { item };
  }

  async _getClaimant({ item }: { item: Item }) {
    const found = await this.claims.findOne({ _id: item });
    return found === null ? [] : [{ claimant: found.claimant, claimedAt: found.claimedAt }];
  }

  /** Old claims are only left out, never deleted, because a claim is the record of who took the item. */
  async _recent({ days }: { days: number }) {
    if (typeof days !== "number" || !(days > 0)) return [];
    const since = new Date(this.clock().getTime() - days * DAY_MS);
    const found = await this.claims.find({ claimedAt: { $gte: since } }).sort({ claimedAt: -1, _id: -1 }).toArray();
    return found.map(({ _id, claimant, claimedAt }) => ({ item: _id, claimant, claimedAt }));
  }

  async _byClaimant({ claimant }: { claimant: Claimant }) {
    const found = await this.claims.find({ claimant }).sort({ claimedAt: -1, _id: -1 }).toArray();
    return found.map(({ _id, claimedAt }) => ({ item: _id, claimedAt }));
  }
}

/** 11000 is the code MongoDB gives a write that breaks a unique index. */
const isDuplicate = (error: unknown) => error instanceof MongoServerError && error.code === 11000;

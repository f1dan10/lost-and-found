import { type Collection, type Db, MongoServerError } from "mongodb";

export class AlreadyClaimed extends Error {}

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
}

/** 11000 is the code MongoDB gives a write that breaks a unique index. */
const isDuplicate = (error: unknown) => error instanceof MongoServerError && error.code === 11000;

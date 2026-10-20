import { type Collection, type Db, MongoServerError } from "mongodb";

export class InvalidNote extends Error {}
export class AlreadyThanked extends Error {}

const MAX_NOTE = 140;

interface ThanksDocument<Thanker, Item> {
  _id: Item;
  thanker: Thanker;
  note?: string;
  thankedAt: Date;
}

/** Lets a person who got something back thank whoever made it possible. */
export class ThankingConcept<Thanker extends string, Item extends string> {
  private readonly thanks: Collection<ThanksDocument<Thanker, Item>>;

  constructor(
    database: Db,
    name = "Thanking",
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.thanks = database.collection(`${name.toLowerCase()}.thanks`);
  }

  // As in Claiming, the item is the document's _id, so MongoDB refuses a second thanks for one item even when two
  // requests arrive at once. A null note from the browser means no note.
  async thank({ thanker, item, note }: { thanker: Thanker; item: Item; note?: string | null }) {
    const trimmed = note === undefined || note === null ? undefined : typeof note === "string" ? note.trim() : "";
    if (trimmed !== undefined && (trimmed.length === 0 || trimmed.length > MAX_NOTE)) {
      throw new InvalidNote("A thank-you note must have 1 to 140 characters.");
    }
    try {
      await this.thanks.insertOne({ _id: item, thanker, ...(trimmed === undefined ? {} : { note: trimmed }), thankedAt: this.clock() });
    } catch (error) {
      if (isDuplicate(error)) throw new AlreadyThanked("This has already been thanked for.");
      throw error;
    }
    return { item };
  }

  async _getThanks({ item }: { item: Item }) {
    const found = await this.thanks.findOne({ _id: item });
    return found === null ? [] : [{ thanker: found.thanker, thankedAt: found.thankedAt }];
  }

  async _getNote({ item }: { item: Item }) {
    const found = await this.thanks.findOne({ _id: item });
    return found?.note === undefined ? [] : [{ note: found.note }];
  }
}

/** 11000 is the code MongoDB gives a write that breaks a unique index. */
const isDuplicate = (error: unknown) => error instanceof MongoServerError && error.code === 11000;

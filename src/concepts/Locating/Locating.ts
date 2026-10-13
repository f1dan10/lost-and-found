import { type Collection, type Db, MongoServerError } from "mongodb";

export class InvalidPlace extends Error {}
export class PlaceExists extends Error {}
export class NoPlaces extends Error {}
export class TooManyPlaces extends Error {}
export class InvalidSpot extends Error {}
export class UnknownPlace extends Error {}
export class AlreadyLocated extends Error {}

const MAX_NAME = 60;
const MAX_SPOT = 100;
const MAX_PLACES = 12;

export type Place = string & { readonly __brand: "Place" };

/** A set of places written as a list; its order and repeats don't matter. */
export type PlaceList = Place[];

interface PlaceDocument {
  _id: Place;
  name: string;
  latitude: number;
  longitude: number;
}

interface ItemDocument<Item> {
  _id: Item;
  places: Place[];
  spot?: string;
}

/** Lets things be found by where they are. */
export class LocatingConcept<Item extends string> {
  private readonly places: Collection<PlaceDocument>;
  private readonly items: Collection<ItemDocument<Item>>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "Locating") {
    this.places = database.collection(`${name.toLowerCase()}.places`);
    this.items = database.collection(`${name.toLowerCase()}.items`);
  }

  /** Creates the indexes once: the unique one makes MongoDB refuse a second place with one name, even when two requests arrive at once; the other finds the items at a place. If creating them fails, the next action tries again. */
  #ready() {
    this.indexes ??= Promise.all([
      this.places.createIndex({ name: 1 }, { unique: true }),
      this.items.createIndex({ places: 1 }),
    ]).catch((error: unknown) => {
      this.indexes = undefined;
      throw error;
    });
    return this.indexes;
  }

  async addPlace({ name, latitude, longitude }: { name: string; latitude: number; longitude: number }) {
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (
      trimmed.length === 0 ||
      trimmed.length > MAX_NAME ||
      !isCoordinate(latitude, 90) ||
      !isCoordinate(longitude, 180)
    ) {
      throw new InvalidPlace("A place needs a name of 1 to 60 characters and a latitude and longitude on Earth.");
    }
    await this.#ready();
    const place = crypto.randomUUID() as Place;
    try {
      await this.places.insertOne({ _id: place, name: trimmed, latitude, longitude });
    } catch (error) {
      if (isDuplicate(error)) throw new PlaceExists("There is already a place with that name.");
      throw error;
    }
    return { place };
  }

  async locate({ item, places, spot }: { item: Item; places: PlaceList; spot?: string }) {
    const different = Array.isArray(places) ? [...new Set(places)] : [];
    if (different.length === 0) throw new NoPlaces("An item needs at least one place.");
    if (different.length > MAX_PLACES) throw new TooManyPlaces("An item can be in at most 12 places.");

    const trimmedSpot = spot === undefined || spot === null ? undefined : typeof spot === "string" ? spot.trim() : "";
    if (trimmedSpot !== undefined && (trimmedSpot.length === 0 || trimmedSpot.length > MAX_SPOT)) {
      throw new InvalidSpot("A spot must have 1 to 100 characters.");
    }

    await this.#ready();
    const existing = different.every((place) => typeof place === "string")
      ? await this.places.countDocuments({ _id: { $in: different } })
      : -1;
    if (existing !== different.length) throw new UnknownPlace("That place doesn't exist.");

    try {
      await this.items.insertOne({
        _id: item,
        places: different,
        ...(trimmedSpot === undefined ? {} : { spot: trimmedSpot }),
      });
    } catch (error) {
      if (isDuplicate(error)) throw new AlreadyLocated("This item already has a location.");
      throw error;
    }
    return { item };
  }

  async _getItemsAt({ place }: { place: Place }) {
    const found = await this.items.find({ places: place }).sort({ _id: 1 }).toArray();
    return found.map(({ _id }) => ({ item: _id }));
  }

  async _getPlacesOf({ item }: { item: Item }) {
    const located = await this.items.findOne({ _id: item });
    if (located === null) return [];
    const found = await this.places.find({ _id: { $in: located.places } }).sort({ name: 1, _id: 1 }).toArray();
    return found.map(({ _id, name }) => ({ place: _id, name }));
  }

  async _getSpot({ item }: { item: Item }) {
    const located = await this.items.findOne({ _id: item });
    return located?.spot === undefined ? [] : [{ spot: located.spot }];
  }

  async _getPlaces() {
    const found = await this.places.find().sort({ name: 1, _id: 1 }).toArray();
    return found.map(({ _id, name, latitude, longitude }) => ({ place: _id, name, latitude, longitude }));
  }

  async _unknown({ places }: { places: PlaceList }) {
    if (!Array.isArray(places)) return [];
    const different = [...new Set(places)];
    const known = new Set(
      (await this.places.find({ _id: { $in: different.filter((place) => typeof place === "string") } }).toArray()).map(
        ({ _id }) => _id,
      ),
    );
    return different.filter((place) => !known.has(place)).map((place) => ({ place }));
  }
}

const isCoordinate = (value: unknown, limit: number) =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;

/** 11000 is the code MongoDB gives a write that breaks a unique index. */
const isDuplicate = (error: unknown) => error instanceof MongoServerError && error.code === 11000;

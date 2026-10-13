import { type Collection, type Db } from "mongodb";

export class InvalidReport extends Error {}
export class ReportNotFound extends Error {}
export class NotOpen extends Error {}

const KINDS = ["FOUND", "LOST"] as const;
const CATEGORIES = ["BOTTLE", "CLOTHING", "ELECTRONICS", "KEYS_ID", "BAG", "JEWELRY", "OTHER"] as const;
const MAX_DESCRIPTION = 500;
const MAX_PHOTO = 2_000_000;

export type Kind = (typeof KINDS)[number];
export type Category = (typeof CATEGORIES)[number];
export type Status = "OPEN" | "RESOLVED" | "WITHDRAWN";
export type Report = string & { readonly __brand: "Report" };

interface ReportDocument<Reporter> {
  _id: Report;
  reporter: Reporter;
  kind: Kind;
  category: Category;
  description: string;
  photo?: string;
  filedAt: Date;
  status: Status;
}

/** Lets a person tell a community about a thing they have found or lost. */
export class ReportingConcept<Reporter extends string> {
  private readonly reports: Collection<ReportDocument<Reporter>>;

  constructor(
    database: Db,
    name = "Reporting",
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.reports = database.collection(`${name.toLowerCase()}.reports`);
  }

  async file({
    reporter,
    kind,
    category,
    description,
    photo,
  }: {
    reporter: Reporter;
    kind: Kind;
    category: Category;
    description: string;
    photo?: string;
  }) {
    const trimmed = typeof description === "string" ? description.trim() : "";
    if (
      !KINDS.includes(kind) ||
      !CATEGORIES.includes(category) ||
      trimmed.length === 0 ||
      description.length > MAX_DESCRIPTION ||
      (photo !== undefined && (typeof photo !== "string" || photo.length > MAX_PHOTO))
    ) {
      throw new InvalidReport(
        "A report needs a kind, a category, a description of 1 to 500 characters, and a photo that is not too large.",
      );
    }
    const report = crypto.randomUUID() as Report;
    await this.reports.insertOne({
      _id: report,
      reporter,
      kind,
      category,
      description,
      ...(photo === undefined ? {} : { photo }),
      filedAt: this.clock(),
      status: "OPEN",
    });
    return { report };
  }

  async resolve({ report }: { report: Report }) {
    await this.#close(report, "RESOLVED");
    return { report };
  }

  async withdraw({ report }: { report: Report }) {
    await this.#close(report, "WITHDRAWN");
    return { report };
  }

  async _getOpen({ kind, category }: { kind: Kind; category?: Category }) {
    const found = await this.reports
      .find({ status: "OPEN", kind, ...(category === undefined ? {} : { category }) })
      .sort({ filedAt: -1, _id: -1 })
      .toArray();
    return found.map(({ _id }) => ({ report: _id }));
  }

  async _getReport({ report }: { report: Report }) {
    const found = await this.reports.findOne({ _id: report });
    if (found === null) return [];
    const { reporter, kind, category, description, filedAt, status } = found;
    return [{ reporter, kind, category, description, filedAt, status }];
  }

  async _getPhoto({ report }: { report: Report }) {
    const found = await this.reports.findOne({ _id: report });
    return found?.photo === undefined ? [] : [{ photo: found.photo }];
  }

  /** Moves an open report to a closed status, or reads it once to say why it could not. */
  async #close(report: Report, status: "RESOLVED" | "WITHDRAWN") {
    const { matchedCount } = await this.reports.updateOne({ _id: report, status: "OPEN" }, { $set: { status } });
    if (matchedCount > 0) return;
    if ((await this.reports.countDocuments({ _id: report })) === 0) {
      throw new ReportNotFound("There is no such report.");
    }
    throw new NotOpen("This report is no longer open.");
  }
}

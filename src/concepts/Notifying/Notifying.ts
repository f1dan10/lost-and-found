import { type Collection, type Db } from "mongodb";
import type { Mailer } from "./mailer.ts";

export class InvalidAddress extends Error {}
export class UnknownRecipient extends Error {}
export class NotificationNotFound extends Error {}

export type Notification = string & { readonly __brand: "Notification" };

interface RecipientDocument<Recipient> {
  _id: Recipient;
  address: string;
}

interface NotificationDocument<Recipient, Subject> {
  _id: Notification;
  recipient: Recipient;
  message: string;
  subject: Subject;
  sentAt: Date;
  read: boolean;
}

/** Tells a person when something needs their attention, even when they are not in the app. */
export class NotifyingConcept<Recipient extends string, Subject extends string> {
  private readonly recipients: Collection<RecipientDocument<Recipient>>;
  private readonly notifications: Collection<NotificationDocument<Recipient, Subject>>;
  private indexes: Promise<unknown> | undefined;

  constructor(
    database: Db,
    private readonly mailer: Mailer,
    name = "Notifying",
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.recipients = database.collection(`${name.toLowerCase()}.recipients`);
    this.notifications = database.collection(`${name.toLowerCase()}.notifications`);
  }

  /** Creates the index that finds a recipient's unread notices once. If creating it fails, the next action tries again. */
  #ready() {
    this.indexes ??= this.notifications.createIndex({ recipient: 1, read: 1, sentAt: -1 }).catch((error: unknown) => {
      this.indexes = undefined;
      throw error;
    });
    return this.indexes;
  }

  async setAddress({ recipient, address }: { recipient: Recipient; address: string }) {
    const trimmed = typeof address === "string" ? address.trim() : "";
    if (trimmed.length === 0) throw new InvalidAddress("An address can't be blank.");
    await this.recipients.updateOne({ _id: recipient }, { $set: { address: trimmed } }, { upsert: true });
    return { recipient };
  }

  async notify({ recipient, message, subject }: { recipient: Recipient; message: string; subject: Subject }) {
    const found = await this.recipients.findOne({ _id: recipient });
    if (found === null) throw new UnknownRecipient("That person has no address.");
    await this.#ready();
    const notification = crypto.randomUUID() as Notification;
    // Saved first: when the mailer fails, the notification stays and the failure reaches the caller.
    await this.notifications.insertOne({
      _id: notification,
      recipient,
      message,
      subject,
      sentAt: this.clock(),
      read: false,
    });
    await this.mailer.send({ to: found.address, message });
    return { notification };
  }

  async markRead({ notification }: { notification: Notification }) {
    const { matchedCount } = await this.notifications.updateOne({ _id: notification }, { $set: { read: true } });
    if (matchedCount === 0) throw new NotificationNotFound("There is no such notification.");
    return { notification };
  }

  async _getUnread({ recipient }: { recipient: Recipient }) {
    const found = await this.notifications.find({ recipient, read: false }).sort({ sentAt: -1, _id: -1 }).toArray();
    return found.map(({ _id, message, subject, sentAt }) => ({ notification: _id, message, subject, sentAt }));
  }
}

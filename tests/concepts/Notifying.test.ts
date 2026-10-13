import { describe, expect, test } from "bun:test";
import { MemoryMailer } from "../../src/concepts/Notifying/mailer.ts";
import {
  InvalidAddress,
  NotificationNotFound,
  NotifyingConcept,
  UnknownRecipient,
  type Notification,
} from "../../src/concepts/Notifying/Notifying.ts";
import { testDatabase } from "../support/reusable/mongo.ts";

/** A concept whose clock moves one minute with each reading, so notices are sent in a known order. */
async function setup() {
  let minute = 0;
  const clock = () => new Date(Date.UTC(2026, 9, 13, 12, minute++));
  const mailer = new MemoryMailer();
  const database = await testDatabase();
  return { notifying: new NotifyingConcept<string, string>(database, mailer, "Notifying", clock), mailer, database };
}

describe("Notifying", () => {
  test("its principle: Tamar's match notice is saved and emailed once, and marking it read removes it from her list", async () => {
    const { notifying, mailer } = await setup();
    await notifying.setAddress({ recipient: "tamar", address: "tamar" });
    const { notification } = await notifying.notify({ recipient: "tamar", message: "A bottle like yours was found", subject: "r1" });

    expect(await notifying._getUnread({ recipient: "tamar" })).toEqual([
      {
        notification,
        message: "A bottle like yours was found",
        subject: "r1",
        sentAt: new Date(Date.UTC(2026, 9, 13, 12, 0)),
      },
    ]);
    expect(mailer.sent).toEqual([{ to: "tamar", message: "A bottle like yours was found" }]);

    await notifying.markRead({ notification });
    expect(await notifying._getUnread({ recipient: "tamar" })).toEqual([]);
    expect(mailer.sent).toHaveLength(1);

    const refused = notifying.notify({ recipient: "ben", message: "hi", subject: "r1" });
    await expect(refused).rejects.toThrow(UnknownRecipient);
    await expect(refused).rejects.toThrow("That person has no address.");
  });

  test("setAddress replaces an existing address instead of duplicating it, and stores it trimmed", async () => {
    const { notifying, mailer, database } = await setup();
    await notifying.setAddress({ recipient: "tamar", address: "old" });
    await notifying.setAddress({ recipient: "tamar", address: "  new  " });
    expect(await database.collection("notifying.recipients").countDocuments()).toBe(1);
    await notifying.notify({ recipient: "tamar", message: "m", subject: "r1" });
    expect(mailer.sent).toEqual([{ to: "new", message: "m" }]);
  });

  test("each refusal leaves the state unchanged", async () => {
    const { notifying, mailer, database } = await setup();
    await notifying.setAddress({ recipient: "tamar", address: "tamar" });

    for (const address of ["", "   "]) {
      await expect(notifying.setAddress({ recipient: "tamar", address })).rejects.toThrow(InvalidAddress);
      await expect(notifying.setAddress({ recipient: "ben", address })).rejects.toThrow("An address can't be blank.");
    }
    await expect(notifying.notify({ recipient: "ben", message: "m", subject: "r1" })).rejects.toThrow(UnknownRecipient);
    await expect(notifying.markRead({ notification: "nothing" as Notification })).rejects.toThrow(NotificationNotFound);

    expect(await database.collection("notifying.recipients").find().toArray()).toEqual([{ _id: "tamar", address: "tamar" } as never]);
    expect(await database.collection("notifying.notifications").countDocuments()).toBe(0);
    expect(mailer.sent).toEqual([]);
    await notifying.notify({ recipient: "tamar", message: "m", subject: "r1" });
    expect(mailer.sent).toEqual([{ to: "tamar", message: "m" }]);
  });

  test("the unread list is newest first, and a read notification drops out", async () => {
    const { notifying } = await setup();
    await notifying.setAddress({ recipient: "tamar", address: "tamar" });
    const { notification: first } = await notifying.notify({ recipient: "tamar", message: "one", subject: "r1" });
    const { notification: second } = await notifying.notify({ recipient: "tamar", message: "two", subject: "r2" });
    const { notification: third } = await notifying.notify({ recipient: "tamar", message: "three", subject: "r3" });

    const ids = async () => (await notifying._getUnread({ recipient: "tamar" })).map(({ notification }) => notification);
    expect(await ids()).toEqual([third, second, first]);
    await notifying.markRead({ notification: second });
    expect(await ids()).toEqual([third, first]);
    await notifying.markRead({ notification: second });
    expect(await ids()).toEqual([third, first]);
  });

  test("a mailer that fails does not lose the saved notification, and the failure reaches the caller", async () => {
    const { notifying, mailer } = await setup();
    await notifying.setAddress({ recipient: "tamar", address: "tamar" });
    mailer.failure = new Error("SMTP is down");
    await expect(notifying.notify({ recipient: "tamar", message: "m", subject: "r1" })).rejects.toThrow("SMTP is down");

    expect(await notifying._getUnread({ recipient: "tamar" })).toMatchObject([{ message: "m", subject: "r1" }]);
    expect(mailer.sent).toEqual([]);
  });

  test("each person sees only their own unread list", async () => {
    const { notifying, mailer } = await setup();
    await notifying.setAddress({ recipient: "tamar", address: "tamar" });
    await notifying.setAddress({ recipient: "tom", address: "tom" });
    await notifying.notify({ recipient: "tamar", message: "for Tamar", subject: "r1" });
    await notifying.notify({ recipient: "tom", message: "for Tom", subject: "r2" });

    expect(await notifying._getUnread({ recipient: "tamar" })).toMatchObject([{ message: "for Tamar" }]);
    expect(await notifying._getUnread({ recipient: "tom" })).toMatchObject([{ message: "for Tom" }]);
    expect(await notifying._getUnread({ recipient: "nobody" })).toEqual([]);
    expect(mailer.sent.map(({ to }) => to)).toEqual(["tamar", "tom"]);
  });
});

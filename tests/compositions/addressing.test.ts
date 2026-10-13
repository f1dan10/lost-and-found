import { describe, expect, test } from "bun:test";
import { startLostFound } from "../support/app.ts";

describe("Addressing", () => {
  test("a user who registers can be notified, and a user who never registered cannot", async () => {
    const { application, mailer, register } = await startLostFound();
    const tamar = await register("tamar");
    await application.whenIdle();

    const { Notifying } = application.concepts;
    await Notifying.notify({ recipient: tamar.user, message: "A bottle like yours was found", subject: "r1" as never });
    expect(mailer.sent).toEqual([{ to: "tamar", message: "A bottle like yours was found" }]);

    // Called through the application, a refusal comes back as an `error` result rather than a thrown exception.
    const stranger = await Notifying.notify({ recipient: "never-registered" as never, message: "hi", subject: "r1" as never });
    expect(stranger).toMatchObject({ error: "UNKNOWN_RECIPIENT" });
    expect(mailer.sent).toHaveLength(1);
  });
});

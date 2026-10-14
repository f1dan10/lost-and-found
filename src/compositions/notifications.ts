import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, view, whether, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { textInput } from "./reusable/inputs.ts";

const { Registering, Sessioning, Reporting, Claiming, Notifying } = concepts;

// Listing

/**
 * The user's unread notices, newest first, each with the category and description of the report it is about.
 * The notice text is fixed, so a finder learns who claimed their item here: `claimedBy` is the claimant's
 * username, or null while the report is unclaimed.
 */
export const notificationRows = former(
  "the unread notifications of (user)",
  ({ user }, { notification, message, subject, sentAt, category, description, claimant, claimedBy }) =>
    each(Notifying._getUnread({ recipient: user }).is({ notification, message, subject, sentAt }))
      .where(
        Reporting._getReport({ report: subject }).is({ category, description }),
        whether(Claiming._getClaimant({ item: subject }).is({ claimant })),
        whether(Registering._username({ user: claimant }).is({ username: claimedBy })),
      )
      .form({ notification, message, subject, sentAt, category, description, claimedBy }),
);

const ListNotifications = endpoint(
  "/notifications/list",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(respond({ notifications: notificationRows({ user }) })),
  { validators: { input: textInput } },
);

// Reading

/** A notice belongs to a person when it is among their unread ones; nobody can mark another person's. */
export const hasUnread = view("(user) has the unread (notification)", ({ user, notification }) =>
  where(Notifying._getUnread({ recipient: user }).is({ notification })),
).holds();

const MarkRead = endpoint(
  "/notifications/read",
  ({ session, notification, user }) =>
    receive({ session, notification })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(hasUnread({ user, notification }))
          .then(Notifying.markRead({ notification }).responds({ notification }))
          .then(respond({}))
          .named("mine"),
        where(no(hasUnread({ user, notification })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

export const composition = {
  listing: { notificationRows, ListNotifications },
  reading: { hasUnread, MarkRead },
};

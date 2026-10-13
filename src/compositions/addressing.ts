import { reaction, when } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Registering, Notifying } = concepts;

/** A user's address is their username; the mailer adds @mit.edu when it sends. */
const GiveAddress = reaction(({ user, username }) =>
  when(Registering.register({ username }).responds({ user })).then(
    Notifying.setAddress({ recipient: user, address: username }),
  ),
);

export const composition = {
  giving: { GiveAddress },
};

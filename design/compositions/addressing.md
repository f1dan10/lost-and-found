# Addressing

Every registered user can be notified, so a notice never finds a person with no address. Registering creates users and Notifying sends notices, and neither refers to the other. The reaction [give a new user an address](reaction:addressing.giving.GiveAddress) runs when `Registering.register` returns a user: it calls `Notifying.setAddress` with that user and their username as the address. The mailer adds `@mit.edu` when it sends, so Notifying stores only the username.

# Lost&Found types

Every person in Lost&Found is a Registering user. That user is the one who has a password in Authenticating and the one a session belongs to.

```instances
instantiate Registering

instantiate Authenticating with
  User is Registering.User

instantiate Sessioning with
  Subject is Registering.User
```

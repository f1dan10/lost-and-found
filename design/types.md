# Lost&Found types

Every person in Lost&Found is a Registering user. That user is the one who has a password in Authenticating, the one a session belongs to, and the one who files a report. Every item that is somewhere is a report, placed where it was found or may have been lost.

```instances
instantiate Registering

instantiate Authenticating with
  User is Registering.User

instantiate Sessioning with
  Subject is Registering.User

instantiate Reporting with
  Reporter is Registering.User

instantiate Locating with
  Item is Reporting.Report
```

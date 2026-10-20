# Lost&Found types

Every person in Lost&Found is a Registering user. That user is the one who has a password in Authenticating, the one a session belongs to, and the one who files a report. The one who is notified is a user too, and a notice is about a report. The one who claims an item is a user too, and what they claim is a report; the one who says thank you is a user, and what they thank for is a report. Every item that is somewhere is a report, placed where it was found or may have been lost.

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

instantiate Notifying with
  Recipient is Registering.User
  Subject is Reporting.Report

instantiate Claiming with
  Claimant is Registering.User
  Item is Reporting.Report

instantiate Thanking with
  Thanker is Registering.User
  Item is Reporting.Report
```

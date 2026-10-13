<!-- Generated from the Lost&Found assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# Lost&Found — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Authenticating

Defined in [Authenticating](../design/concepts/Authenticating.md), line 1.

#### Actions

- `set(user: User, password: String) : returns (user: User)`
  - Refuses `INVALID_PASSWORD`: A password must have 8 to 128 characters.
  - Refuses `PASSWORD_SET`: This account already has a password.
- `authenticate(user: User, password: String) : returns (user: User)`
  - Refuses `INVALID_CREDENTIALS`: The username or password is incorrect.

#### Queries

- `_acceptable(password: String) : one (acceptable: Flag)`

#### Instances

- `Authenticating` — instance of `Authenticating` — [Lost&Found types](../design/types.md), line 8.
  - `User` is `Registering.User` — [Lost&Found types](../design/types.md), line 9.

### Claiming

Defined in [Claiming](../design/concepts/Claiming.md), line 1.

#### Actions

- `claim(claimant: Claimant, item: Item) : returns (item: Item)`
  - Refuses `ALREADY_CLAIMED`: This item has already been claimed.

#### Queries

- `_getClaimant(item: Item) : optional (claimant: Claimant, claimedAt: DateTime)`

#### Instances

- `Claiming` — instance of `Claiming` — [Lost&Found types](../design/types.md), line 24.
  - `Claimant` is `Registering.User` — [Lost&Found types](../design/types.md), line 25.
  - `Item` is `Reporting.Report` — [Lost&Found types](../design/types.md), line 26.

### Locating

Defined in [Locating](../design/concepts/Locating.md), line 1.

#### Actions

- `addPlace(name: String, latitude: Number, longitude: Number) : returns (place: Place)`
  - Refuses `INVALID_PLACE`: A place needs a name of 1 to 60 characters and a latitude and longitude on Earth.
  - Refuses `PLACE_EXISTS`: There is already a place with that name.
- `locate(item: Item, places: PlaceList, spot?: String) : returns (item: Item)`
  - Refuses `NO_PLACES`: An item needs at least one place.
  - Refuses `TOO_MANY_PLACES`: An item can be in at most 12 places.
  - Refuses `INVALID_SPOT`: A spot must have 1 to 100 characters.
  - Refuses `UNKNOWN_PLACE`: That place doesn't exist.
  - Refuses `ALREADY_LOCATED`: This item already has a location.

#### Queries

- `_getItemsAt(place: Place) : many (item: Item)`
- `_getPlacesOf(item: Item) : many (place: Place, name: String)`
- `_getSpot(item: Item) : optional (spot: String)`
- `_getPlaces() : many (place: Place, name: String, latitude: Number, longitude: Number)`
- `_unknown(places: PlaceList) : many (place: Place)`

#### Instances

- `Locating` — instance of `Locating` — [Lost&Found types](../design/types.md), line 17.
  - `Item` is `Reporting.Report` — [Lost&Found types](../design/types.md), line 18.

### Notifying

Defined in [Notifying](../design/concepts/Notifying.md), line 1.

#### Actions

- `setAddress(recipient: Recipient, address: String) : returns (recipient: Recipient)`
  - Refuses `INVALID_ADDRESS`: An address can't be blank.
- `notify(recipient: Recipient, message: String, subject: Subject) : returns (notification: Notification)`
  - Refuses `UNKNOWN_RECIPIENT`: That person has no address.
- `markRead(notification: Notification) : returns (notification: Notification)`
  - Refuses `NOTIFICATION_NOT_FOUND`: There is no such notification.

#### Queries

- `_getUnread(recipient: Recipient) : many (notification: Notification, message: String, subject: Subject, sentAt: DateTime)`

#### Instances

- `Notifying` — instance of `Notifying` — [Lost&Found types](../design/types.md), line 20.
  - `Recipient` is `Registering.User` — [Lost&Found types](../design/types.md), line 21.
  - `Subject` is `Reporting.Report` — [Lost&Found types](../design/types.md), line 22.

### Registering

Defined in [Registering](../design/concepts/Registering.md), line 1.

#### Actions

- `register(username: String) : returns (user: User)`
  - Refuses `INVALID_USERNAME`: A username must have 3 to 32 letters, digits, underscores, or hyphens.
  - Refuses `USERNAME_TAKEN`: That username is taken.

#### Queries

- `_byUsername(username: String) : optional (user: User)`
- `_username(user: User) : optional (username: String)`

#### Instances

- `Registering` — instance of `Registering` — [Lost&Found types](../design/types.md), line 6.

### Reporting

Defined in [Reporting](../design/concepts/Reporting.md), line 1.

#### Actions

- `file(reporter: Reporter, kind: Kind, category: Category, description: String, photo?: String) : returns (report: Report)`
  - Refuses `INVALID_REPORT`: A report needs a kind, a category, a description of 1 to 500 characters, and a photo that is not too large.
- `resolve(report: Report) : returns (report: Report)`
  - Refuses `REPORT_NOT_FOUND`: There is no such report.
  - Refuses `NOT_OPEN`: This report is no longer open.
- `withdraw(report: Report) : returns (report: Report)`
  - Refuses `REPORT_NOT_FOUND`: There is no such report.
  - Refuses `NOT_OPEN`: This report is no longer open.

#### Queries

- `_getOpen(kind: Kind, category?: Category) : many (report: Report)`
- `_getReport(report: Report) : optional (reporter: Reporter, kind: Kind, category: Category, description: String, filedAt: DateTime, status: Status)`
- `_getPhoto(report: Report) : optional (photo: String)`

#### Instances

- `Reporting` — instance of `Reporting` — [Lost&Found types](../design/types.md), line 14.
  - `Reporter` is `Registering.User` — [Lost&Found types](../design/types.md), line 15.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(subject: Subject) : returns (session: Session, expiresAt: DateTime)`
- `use(session: Session) : returns (subject: Subject)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.
- `end(session: Session) : returns (session: Session)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.

#### Instances

- `Sessioning` — instance of `Sessioning` — [Lost&Found types](../design/types.md), line 11.
  - `Subject` is `Registering.User` — [Lost&Found types](../design/types.md), line 12.

## Views

_Views name reusable conditions. Multiple `where` blocks are alternatives._

### (places) has an unknown place

Authored path: `reports.filing.hasUnknownPlace`.
- Covered by [Reports](../design/compositions/reports.md), line 3.

```view
(places) has an unknown place — inputs (places); outputs (); bindings ()
  where Locating._unknown (places)
```

### (report) is an open found report

Authored path: `access.permissions.isOpenFound`.
- Covered by [Access](../design/compositions/access.md), line 7.

```view
(report) is an open found report — inputs (report); outputs (); bindings ()
  where Reporting._getReport (report) has (kind: "FOUND", status: "OPEN")
```

### (user) owns (report)

Authored path: `access.permissions.owns`.
- Covered by [Access](../design/compositions/access.md), line 5.

```view
(user) owns (report) — inputs (user, report); outputs (); bindings ()
  where Reporting._getReport (report) has (reporter: user)
```

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### every place

Authored path: `reports.listing.allPlaces`.
- Covered by [Reports](../design/compositions/reports.md), line 19.

```former
Former "every place" — inputs (); bindings (place, name, latitude, longitude); promises exactly one record — forms:
  each Locating._getPlaces () has (latitude, longitude, name, place)
    form a record of
      latitude
      longitude
      name
      place
```

### the open reports of (kind)

Authored path: `reports.listing.reportCards`.
- Covered by [Reports](../design/compositions/reports.md), line 13.

```former
Former "the open reports of (kind)" — inputs (kind); bindings (report, category, description, filedAt, reporter, username, place, name, spot, photo); promises exactly one record — forms:
  each Reporting._getOpen (kind) has (report)
    where Reporting._getReport (report) has (category, description, filedAt, reporter)
    where Registering._username (user: reporter) has (username)
    where whether Locating._getSpot (item: report) has (spot)
    where whether Reporting._getPhoto (report) has (photo)
    form a record of
      category
      description
      filedAt
      photo
      places: each Locating._getPlacesOf (item: report) has (name, place)
        form a record of
          name
          place
      report
      reporter
      spot
      username
```

## Reactions

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

### addressing.giving.GiveAddress

Authored path: `addressing.giving.GiveAddress`.
- Covered by [Addressing](../design/compositions/addressing.md), line 3.

```reaction
when Registering.register (username, user)
then
  Notifying.setAddress (address: username, recipient: user)
```

### matching.notifying.NotifyOwnerOfMatch

Authored path: `matching.notifying.NotifyOwnerOfMatch`.
- Covered by [Matching](../design/compositions/matching.md), line 3.

```reaction
when Locating.locate (item: found)
where
  Reporting._getReport (report: found) has (category, kind: "FOUND")
  Locating._getPlacesOf (item: found) has (place)
  Locating._getItemsAt (place) has (item: lost)
  Reporting._getReport (report: lost) has (category, kind: "LOST", reporter, status: "OPEN")
then
  Notifying.notify (message: "An item matching your lost report was found.", recipient: reporter, subject: found)
```

### reports.filing.FileReport

Authored path: `reports.filing.FileReport`.
- Covered by [Reports](../design/compositions/reports.md), line 3.
- Covered by [Reports](../design/compositions/reports.md), line 8.

```reaction
when RequestBoundary.request (category, description, kind, path: "/reports/file", photo, places, requestId, session, spot)
then
  Sessioning.use (session)
```

### reports.filing.FileReport:filed#2

Authored path: `reports.filing.FileReport`.
- Covered by [Reports](../design/compositions/reports.md), line 3.
- Covered by [Reports](../design/compositions/reports.md), line 8.

```reaction
when Sessioning.use (session, subject: user), asked by reports.filing.FileReport
where
  earlier, RequestBoundary.request (category, description, kind, path: "/reports/file", photo, places, requestId, session, spot)
  no view "(places) has an unknown place" with (places)
then
  Reporting.file (category, description, kind, photo, reporter: user)
```

### reports.filing.FileReport:filed#3

Authored path: `reports.filing.FileReport`.
- Covered by [Reports](../design/compositions/reports.md), line 3.
- Covered by [Reports](../design/compositions/reports.md), line 8.

```reaction
when Reporting.file (category, description, kind, photo, reporter: user, report), asked by reports.filing.FileReport:filed#2
where
  earlier, RequestBoundary.request (category, description, kind, path: "/reports/file", photo, places, requestId, session, spot)
then
  Locating.locate (item: report, places, spot)
```

### reports.filing.FileReport:filed#4

Authored path: `reports.filing.FileReport`.
- Covered by [Reports](../design/compositions/reports.md), line 3.
- Covered by [Reports](../design/compositions/reports.md), line 8.

```reaction
when Locating.locate (item: report, places, spot), asked by reports.filing.FileReport:filed#3
where
  earlier, RequestBoundary.request (category, description, kind, path: "/reports/file", photo, places, requestId, session, spot)
then
  RequestBoundary.respond (report, requestId)
```

### reports.filing.FileReport:unknown-place#2

Authored path: `reports.filing.FileReport`.
- Covered by [Reports](../design/compositions/reports.md), line 3.
- Covered by [Reports](../design/compositions/reports.md), line 8.

```reaction
when Sessioning.use (session, subject: user), asked by reports.filing.FileReport
where
  earlier, RequestBoundary.request (category, description, kind, path: "/reports/file", photo, places, requestId, session, spot)
  view "(places) has an unknown place" with (places)
then
  RequestBoundary.respond (error: "UNKNOWN_PLACE", requestId)
```

### reports.listing.ListPlaces

Authored path: `reports.listing.ListPlaces`.
- Covered by [Reports](../design/compositions/reports.md), line 19.
- Covered by [Reports](../design/compositions/reports.md), line 22.

```reaction
when RequestBoundary.request (path: "/places/list", requestId, session)
then
  Sessioning.use (session)
```

### reports.listing.ListPlaces#2

Authored path: `reports.listing.ListPlaces`.
- Covered by [Reports](../design/compositions/reports.md), line 19.
- Covered by [Reports](../design/compositions/reports.md), line 22.

```reaction
when Sessioning.use (session, subject: user), asked by reports.listing.ListPlaces
where
  earlier, RequestBoundary.request (path: "/places/list", requestId, session)
then
  RequestBoundary.respond (places: former "every place", requestId)
```

### reports.listing.ListReports

Authored path: `reports.listing.ListReports`.
- Covered by [Reports](../design/compositions/reports.md), line 13.
- Covered by [Reports](../design/compositions/reports.md), line 16.

```reaction
when RequestBoundary.request (path: "/reports/list", requestId, session)
then
  Sessioning.use (session)
```

### reports.listing.ListReports#2

Authored path: `reports.listing.ListReports`.
- Covered by [Reports](../design/compositions/reports.md), line 13.
- Covered by [Reports](../design/compositions/reports.md), line 16.

```reaction
when Sessioning.use (session, subject: user), asked by reports.listing.ListReports
where
  earlier, RequestBoundary.request (path: "/reports/list", requestId, session)
then
  RequestBoundary.respond (found: former "the open reports of (kind)" with (kind: "FOUND"), lost: former "the open reports of (kind)" with (kind: "LOST"), requestId)
```

### reusable.accounts.identifying.Me

Authored path: `reusable.accounts.identifying.Me`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 8.

```reaction
when RequestBoundary.request (path: "/auth/me", requestId, session)
then
  Sessioning.use (session)
```

### reusable.accounts.identifying.Me#2

Authored path: `reusable.accounts.identifying.Me`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 8.

```reaction
when Sessioning.use (session, subject: user), asked by reusable.accounts.identifying.Me
where
  Registering._username (user) has (username)
  earlier, RequestBoundary.request (path: "/auth/me", requestId, session)
then
  RequestBoundary.respond (requestId, username)
```

### reusable.accounts.leaving.SignOut

Authored path: `reusable.accounts.leaving.SignOut`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 11.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 14.

```reaction
when RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  Sessioning.end (session)
```

### reusable.accounts.leaving.SignOut#2

Authored path: `reusable.accounts.leaving.SignOut`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 11.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 14.

```reaction
when Sessioning.end (session), asked by reusable.accounts.leaving.SignOut
where
  earlier, RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  RequestBoundary.respond (requestId)
```

### reusable.passwords.entering.Register:accepted

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
where
  Authenticating._acceptable (password) has (acceptable: true)
then
  Registering.register (username)
```

### reusable.passwords.entering.Register:accepted#2

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when Registering.register (username, user), asked by reusable.passwords.entering.Register:accepted
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  Authenticating.set (password, user)
```

### reusable.passwords.entering.Register:accepted#3

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when Authenticating.set (password, user), asked by reusable.passwords.entering.Register:accepted#2
then
  Sessioning.start (subject: user)
```

### reusable.passwords.entering.Register:accepted#4

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.passwords.entering.Register:accepted#3
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.passwords.entering.Register:refused

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
where
  Authenticating._acceptable (password) has (acceptable: false)
then
  RequestBoundary.respond (error: "INVALID_PASSWORD", requestId)
```

### reusable.passwords.entering.SignIn:known

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when RequestBoundary.request (password, path: "/auth/login", requestId, username)
where
  Registering._byUsername (username) has (user)
then
  Authenticating.authenticate (password, user)
```

### reusable.passwords.entering.SignIn:known#2

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when Authenticating.authenticate (password, user), asked by reusable.passwords.entering.SignIn:known
then
  Sessioning.start (subject: user)
```

### reusable.passwords.entering.SignIn:known#3

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.passwords.entering.SignIn:known#2
where
  earlier, RequestBoundary.request (password, path: "/auth/login", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.passwords.entering.SignIn:unknown

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when RequestBoundary.request (password, path: "/auth/login", requestId, username)
where
  no Registering._byUsername (username)
then
  RequestBoundary.respond (error: "INVALID_CREDENTIALS", requestId)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/auth/login` — requires `password`, `username`
- `/auth/logout` — requires `session`
- `/auth/me` — requires `session`
- `/auth/register` — requires `password`, `username`
- `/places/list` — requires `session`
- `/reports/file` — requires `session`, `kind`, `category`, `description`, `places`; fills `photo` with null when absent; fills `spot` with null when absent
- `/reports/list` — requires `session`

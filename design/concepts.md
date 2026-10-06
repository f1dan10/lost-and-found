# Concept design

Lost&Found uses 5 concepts. `Reporting` records that something was found or lost, `Locating` puts each report on the map, `Claiming` records who took a found item, `Notifying` tells people when something needs them, and `Authenticating` identifies users.

## Concept specifications

### Reporting
```
concept Reporting [Reporter]

purpose
  let a person tell a community about a thing they have found or is missing

principle
  if a reporter files a found report with a category and a photo, others
  can find it among the open found reports of that category; once the
  report is resolved, or nobody renews it before its lifetime runs out,
  it is no longer among the open reports

state
  a set of Reports with
    a reporter Reporter
    a kind either FOUND or LOST
    a category of BOTTLE or CLOTHING or ELECTRONICS or KEYS/ID or BAG or JEWELRY or OTHER
    a description String
    an optional photo Image
    a filedAt DateTime
    an expiresAt DateTime
    a status of OPEN or RESOLVED or WITHDRAWN or EXPIRED

actions
  file (reporter: Reporter, kind: Kind, category: Category, description: String, photo?: Image, lifetime: Duration) : return (report: Report)
    then
      create a new report with the given reporter, kind, category
      and description, the photo if exists, filedAt set to now, 
      expiresAt set to now plus lifetime, and status OPEN. 
      return report
    
  resolve (report: Report ) : return ()
    where report exists and its status is OPEN
    then
      set status to RESOLVED
      return

  renew (report: Report, lifetime: Duration) : return ()
    where report exists and its status is OPEN
    then
      set expiresAt of report to now plus lifetime
      return

  withdraw (report: Report) : return ()
    where report exists and its status is OPEN
    then
      set status of report to WITHDRAWN
      return

  system expire (report: Report) : return ()
    where report exists, its status is OPEN, and now is after its expiresAt
    then
      set status of report to EXPIRED
      return

queries
  _getOpen (kind: Kind, category?: Category) : many (report: Report)
    Returns a row for each report of the given kind with status OPEN,
    restricted to the given category if one is given. Rows are ordered
    by filedAt, newest first.

  _getReport (report: Report) : optional (reporter: Reporter, kind: Kind, category: Category, description: String, filedAt: DateTime, status: Status)
    Returns report details, or no row if the report is unknown.

  _getPhoto (report: Report) : optional (photo: Image)
    Returns the photo of the report, or no row if the report is unknown
    or has no photo.
```

### Locating

```
concept Locating [Item]

purpose
  let things be discovered by their locations

principle
  If an item is reported as being at a certain location, anyone who searches for items 
  at that location will be able to see that item.

state
  a set of Places with
    a unique name String
    a latitude Number
    a longitude Number

  a set of Items with
    a places set of Places
    an optional spot String
    a confirmedAt DateTime

actions
  addPlace (name: String, latitude: Number, longitude: Number) : return (place: Place)
    where no place has the given name
    then
      create a new place with the given name, latitude and longitude
      return place

  locate (item, places: set of Place, spot?: String) : return ()
    where places is not empty, every place in it exists, and item is not
      in the set of Items
    then
      add item to the set of Items with the given places, the spot if
      one is given, and confirmedAt set to now
      return

  confirm (item: Item) : return ()
    where item is in the set of Items
    then
      set confirmedAt of item to now
      return

  forget (item: Item) : return ()
    where item is in the set of Items
    then
      remove item from the set of Items
      return

queries
  _getItemsAt (place: Place) : many (item: Item)
    Returns a row for each item whose places include the given place.
    The order of the rows is unspecified.

  _getPlacesOf (item: Item) : many (place: Place, name: String)
    Returns a row for each place of the item, ordered by name, or no
    rows if the item is not located.

  _getSpot (item: Item) : optional (spot: String, confirmedAt: DateTime)
    Returns the item's spot and when its location was last confirmed, or
    no row if the item is not located or has no spot.

  _getPlaces () : many (place: Place, name: String, latitude: Number, longitude: Number)
    Returns a row for each place, ordered by name.
```

NOTE: an item has a set of places, because the same concept serves both kinds of report: a found item is in exactly one place, while a lost item may be in any of several.

### Claiming

```
concept Claiming [Claimant, Item]

purpose
  make taking a thing accountable by recording who took it

principle
  if a claimant claims an item, then anyone who later asks who has the
  item is given that claimant, and nobody else can claim it

state
  a set of Claims with
    a claimant Claimant
    a unique item Item
    a claimedAt DateTime

actions
  claim (claimant: Claimant, item: Item) : return (claim: Claim)
    where no claim exists for item
    then
      create a new claim with the given claimant and item, and claimedAt
      set to now
      return claim
    where a claim exists for item
    then
      refuse ALREADY_CLAIMED "This item has already been claimed."

  retract (claim: Claim) : return ()
    where claim exists
    then
      remove claim
      return

queries
  _getClaimant (item: Item) : optional (claimant: Claimant, claimedAt: DateTime)
    Returns who claimed the item and when or no row if unclaimed
```

### Notifying

```
concept Notifying [Recipient]

purpose
  tell a person promptly about an event that needs their attention
  when they are away from the app

principle
  if a recipient has an address, and a notification with a message and a
  link is sent to them, then the message is delivered to that address and
  stays in their list of notifications until they read it

state
  a set of Recipients with
    an address String

  a set of Notifications with
    a recipient Recipient
    a message String
    a link String
    a sentAt DateTime
    a read Flag

actions
  setAddress (recipient: Recipient, address: String) : return ()
    then
      add recipient to the set of Recipients if it is not there
      return

  notify (recipient: Recipient, message: String, link: String) : return (notification: Notification)
    where recipient is in the set of Recipients
    then
      create a new notifcation with the given recipient, message and link,
      sentAt set to now, and read set to FALSE
      deliver the message and link by email to the address of recipient
      return notification

  markRead (notification) : return ()
    where notification exists
    then
      set read of notification to TRUE
      return

queries
  _getUnread (recipient: Recipient) : many (notification: Notification, message: String, link: String)
    Returns a row for each notification of the recipient whose read flag
    is false, newest first.
```

### Authenticating

```
concept Authenticating

purpose
  let the app treat each request as coming from a particular person

principle
  if you register with an email address and a password, and later log in
  with the same address and password, you get a session that identifies
  you as the user who registered until you log out

state
  a set of Users with
    a unique email String
    a password String

  a set of Sessions with
    a user User

actions
  register (email: String, password: String) : return (user: User)
    where email and password are well formed and no user has the given email
    then
      create a new user with the given email and password
      return user
    where email or password is not well formed
    then
      refuse INVALID_CREDENTIALS "The email or password is not well formed"
    where email and password are well formed and a user has the given email
    then
      refuse EMAIL_TAKEN "An account with this email already exists."

  login (email: String, password: String) : return (session: Session)
    where a user exists with the given email and password
    then
      create a new session for that user
      return session

  logout (session: Session) : return ()
    where session exists
    then
      remove session
      return

queries
  _getUser (session: Session) : optional (user: User)
    returns the user of the session, or no row if the session is unknown.

  _getEmail (user: User) : optional (email: String)
  returns the email of the user, or no row if the user is unknown.
```

## Essential reactions

`Requesting.request` stands for a request arriving from the user. Its first argument names what the user asked for. A `where` clause binds variables with queries and must hold for the reaction to fire.

### Filing a report

```
R1  when  Requesting.request ("file", session, kind, category, description, photo, places, spot)
    where Authenticating._getUser (session) gives user
    then  Reporting.file (user, kind, category, description, photo, 14 days)

R2  when  Requesting.request ("file", session, kind, category, description, photo, places, spot)
          Reporting.file () : return (report)
    then  Locating.locate (report, places, spot)
```

R1 says who can file, and R2 says that every report gets a location. 
note: a found report has one place and a spot; a lost report has several places and no spot.

### Telling an owner about a match

```
R3  when  Locating.locate (found, places, spot)
    where Reporting._getReport (found) gives kind FOUND, category
          place is in places
          Locating._getItemsAt (place) gives lost
          Reporting._getReport (lost) gives reporter, kind LOST, the same category, status OPEN
    then  Notifying.notify (reporter, "An item matching your lost report was found.", link to found)
```

This is the reaction behind the map

### Keeping reports current

```
R4  when  Locating.confirm (item)
    then  Reporting.renew (item, 14 days)
```

A report's lifetime restarts whenever its reporter confirms that the item is still there. 
A report that nobody calimed expires through `Reporting.expire` and then drops out of `Reporting._getOpen`.

### Access control (representative)

```
R5  when  Requesting.request ("withdraw", session, report)
    where Authenticating._getUser (session) gives user
          Reporting._getReport (report) gives reporter user
    then  Reporting.withdraw (report)
```

Only the person who filed a report may withdraw it. 

### Claiming a found item

```
R6  when  Requesting.request ("claim", session, report)
    where Authenticating._getUser (session) gives user
          Reporting._getReport (report) gives kind FOUND, status OPEN
    then  Claiming.claim (user, report)

R7  when  Claiming.claim (claimant, item)
    then  Reporting.resolve (item)

R8  when  Claiming.claim (claimant, item)
    where Reporting._getReport (item) gives reporter
          Authenticating._getEmail (claimant) gives email
    then  Notifying.notify (reporter, "Your found item was claimed by " ^ email, link to item)
```

R6, a claim needs a logged-in account and an open found report. 
R7 and R8 are separate because closing the report and telling the finder are independent consequences of a claim.

### Giving Notifying an address

```
R9  when  Authenticating.register (email) : return (user)
    then  Notifying.setAddress (user, email)
```

## Roles of the concepts

**Reporting** is what people browse. It holds what was found or lost and decides whether a report is still active. Its `Reporter` is bound to `Authenticating`'s `User`.

**Locating** puts reports on the map. Its `Item` is bound to `Reporting`'s `Report`, which is the non-obvious binding in this design: the app represents the item using its report, rather than storing the physical object itself. Places are owned by `Locating` and are created ahead of time with `addPlace`, one for each MIT building and one for each desk that holds found items. Location is separate from the report because the same concept then serves found reports, lost reports and the map. Once a report is submitted, its location stays the same. R4 updates the report when the item is confirmed to still be there.

**Claiming** records which account took a found item. Its `Item` is also bound to `Report` and its `Claimant` to `User`. It makes false claimants identifiable MIT community members.

**Notifying** responsible for two cases when a person must be reached: an owner's lost report has a match (R3), and a finder's item has been claimed (R8). Its `Recipient` is bound to `User`, and R9 gives it each user's email address.

**Authenticating** identifies the user behind each request. Every reaction that starts from a request uses a session to find the user. The reaction that handles a registration request requires an `@mit.edu` address, which resticts the community to MIT.
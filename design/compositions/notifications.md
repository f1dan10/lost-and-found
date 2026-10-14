# Notifications

The bell in the app reads two endpoints, and a person must be signed in to call either.

## Listing

[The unread notifications of a user](former:notifications.listing.notificationRows) are the notices `Notifying._getUnread` returns for them, newest first. Each comes with its message, its sent time, and the category and description of the report it is about, from Reporting. The notice text is fixed, so a finder who is told "Your found item was claimed." learns who claimed it here: the row has the claimant's username, from Claiming and Registering, and `null` while the report is unclaimed. The [list endpoint](reaction:notifications.listing.ListNotifications) responds with them as `notifications`.

```endpoints
notifications.listing.ListNotifications at /notifications/list
```

## Reading

A person may mark a notice read when [it is among their unread ones](view:notifications.reading.hasUnread); that is the whole ownership check, so nobody can mark another person's notice. The [read endpoint](reaction:notifications.reading.MarkRead) has two branches. `mine` runs when the view holds: it calls `Notifying.markRead` and responds with nothing. `refused` runs when it doesn't, whether the notice belongs to someone else, is already read, or doesn't exist: the request is refused with `NOT_FOUND`, the same answer for each, so it never tells a person whether another person has a notice.

```endpoints
notifications.reading.MarkRead at /notifications/read
```

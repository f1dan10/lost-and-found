# Notifying

## Purpose

Tell a person when something needs their attention, even when they are not in the app.

*Prevents:* someone misses a notice because it was sent only by email, or only while they were away; someone is told about something twice; someone sees a notice that was meant for another person.

## Principle

Tamar's address is set. When a match notice about her lost bottle is sent to her, it is saved and she is emailed once. It appears in her unread notices, and when she marks it read it leaves the list. Notifying someone whose address was never set is refused with "That person has no address."

## Types

```types
external Recipient
  The person who is told.

external Subject
  The thing the notice is about.
```

## State

```state
a set of Recipients with
  an address String

a set of Notifications with
  a recipient Recipient
  a message String
  a subject Subject
  a sentAt DateTime
  a read Flag

Rule: a notification is saved before its email is sent, so it stays saved when the email fails.
```

## Actions

```actions
setAddress(recipient: Recipient, address: String) : returns (recipient: Recipient)
  where address is blank once trimmed
  then
    refuses INVALID_ADDRESS "An address can't be blank."
  where address is acceptable
  then
    set the address of recipient to the trimmed address, replacing any earlier one
    returns recipient

notify(recipient: Recipient, message: String, subject: Subject) : returns (notification: Notification)
  where recipient has no address
  then
    refuses UNKNOWN_RECIPIENT "That person has no address."
  where recipient has an address
  then
    add a new notification with recipient, message, subject, sentAt now, and read false
    email message to the address of recipient
    returns notification

markRead(notification: Notification) : returns (notification: Notification)
  where notification is not in Notifications
  then
    refuses NOTIFICATION_NOT_FOUND "There is no such notification."
  where notification is in Notifications
  then
    set read of notification to true
    returns notification
```

## Queries

```queries
_getUnread(recipient: Recipient) : many (notification: Notification, message: String, subject: Subject, sentAt: DateTime)
  Returns each notification of this recipient that is not read, newest sentAt first and then by notification identifier descending. Returns no rows when there are none or the recipient is unknown.
```

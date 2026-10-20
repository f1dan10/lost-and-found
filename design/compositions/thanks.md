# Thanks

A finder spends a minute reporting an item and gets nothing back, so the owner who picked it up can thank them. The [thanks endpoint](reaction:thanks.sending.SendThanks) first calls `Sessioning.use`, which returns the person's user from their session. It has two branches. `thanked` runs when the person [claimed the report](view:access.permissions.claimed): the endpoint calls `Thanking.thank` with the report as the item and the note, if one was sent, and responds with the report. `refused` runs when they didn't, or the report doesn't exist: the request is refused with `NOT_FOUND`, the same answer for both. The note is optional; `Thanking` refuses a blank or over-long one with `INVALID_NOTE`, and a second thanks for the same item with `ALREADY_THANKED`.

```endpoints
thanks.sending.SendThanks at /thanks/send
```

Once the thanks is recorded, the reaction [tell the finder they were thanked](reaction:thanks.sending.NotifyFinderOfThanks) looks up the report's reporter with `Reporting._getReport` and calls `Notifying.notify` with the message "The owner of an item you found thanked you." and the report as the subject. The note itself is shown with the finder's own reports, in [owning](owning.md), and with the claimant's claims, in [claims](claims.md), so the notice text stays fixed.

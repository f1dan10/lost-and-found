# Owning

A person can close and review the reports they filed. Only the person who filed a report may change it, which is the view [owns a report](view:access.permissions.owns) in [access](access.md).

## Closing

A report is never deleted. The [withdraw endpoint](reaction:owning.closing.WithdrawReport) removes a report from the lists by calling `Reporting.withdraw`, so the claims and notices that point at it still have something to point at. The [resolve endpoint](reaction:owning.closing.ResolveReport) calls `Reporting.resolve` instead, for an item that is back with its owner: an owner who got their lost item back says so, and stops being sent match notices for it.

Each endpoint first calls `Sessioning.use`, which returns the person's user from their session, and has two branches. `mine` runs when the person owns the report: the endpoint calls the action and responds with the report. `refused` runs when they don't, or the report doesn't exist: the request is refused with `NOT_FOUND`, the same answer for both, so a person can't learn which ids belong to others. When the report is already closed, `Reporting` refuses the request with `NOT_OPEN`. A found report is closed by a claim, so its finder can't withdraw it after someone claimed it.

A report expires two weeks after it is filed, because a found item left where it was rarely stays there longer, and an old lost report would keep sending notices about an item its owner gave up on. The [renew endpoint](reaction:owning.closing.RenewReport) calls `Reporting.renew` for an owner who says the item is still there, or still lost, which keeps the report open for two more weeks, even after it expired. It has the same two branches and the same refusals as the others.

```endpoints
owning.closing.WithdrawReport at /reports/withdraw
owning.closing.ResolveReport at /reports/resolve
owning.closing.RenewReport at /reports/renew
```

## Listing

[The reports of a user](former:owning.listing.myReports) are every report `Reporting._getByReporter` returns for them, newest first, open or closed. Each comes with its kind, category, description, filing time, expiry time, and status from Reporting, so an expired report, which is in no other list, can be found here and renewed, and its places and spot from Locating. A found report that someone claimed also comes with `claimedBy`, the claimant's username from Claiming and Registering, so the finder knows who took it; it is `null` while the report is unclaimed. It also comes with `collectedAt` from Claiming, when the claimant picked it up, which is `null` until then. When the claimant has thanked the finder, the report also comes with `thankedAt` and `thanksNote` from Thanking, which are otherwise `null`, so the finder can read the note and count how many people they helped. A report has a spot and a photo only when its reporter gave them, and the former gives `null` for the ones it lacks. The [list endpoint](reaction:owning.listing.ListMyReports) responds with them as `reports`, and only ever for the signed-in person.

```endpoints
owning.listing.ListMyReports at /reports/mine
```

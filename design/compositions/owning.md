# Owning

A person can close and review the reports they filed. Only the person who filed a report may change it, which is the view [owns a report](view:access.permissions.owns) in [access](access.md).

## Closing

A report is never deleted. The [withdraw endpoint](reaction:owning.closing.WithdrawReport) removes a report from the lists by calling `Reporting.withdraw`, so the claims and notices that point at it still have something to point at. The [resolve endpoint](reaction:owning.closing.ResolveReport) calls `Reporting.resolve` instead, for an item that is back with its owner: an owner who got their lost item back says so, and stops being sent match notices for it.

Each endpoint first calls `Sessioning.use`, which returns the person's user from their session, and has two branches. `mine` runs when the person owns the report: the endpoint calls the action and responds with the report. `refused` runs when they don't, or the report doesn't exist: the request is refused with `NOT_FOUND`, the same answer for both, so a person can't learn which ids belong to others. When the report is already closed, `Reporting` refuses the request with `NOT_OPEN`. A found report is closed by a claim, so its finder can't withdraw it after someone claimed it.

```endpoints
owning.closing.WithdrawReport at /reports/withdraw
owning.closing.ResolveReport at /reports/resolve
```

## Listing

[The reports of a user](former:owning.listing.myReports) are every report `Reporting._getByReporter` returns for them, newest first, open or closed. Each comes with its kind, category, description, filing time, and status from Reporting, and its places and spot from Locating. A report has a spot and a photo only when its reporter gave them, and the former gives `null` for the ones it lacks. The [list endpoint](reaction:owning.listing.ListMyReports) responds with them as `reports`, and only ever for the signed-in person.

```endpoints
owning.listing.ListMyReports at /reports/mine
```

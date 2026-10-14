# Claims

An owner takes a found item by claiming its report. The [claim endpoint](reaction:claims.claiming.ClaimReport) first calls `Sessioning.use`, which returns the person's user from their session. It has three branches. `claimed` runs when the report [is an open found report](access.md) and the person [doesn't own it](access.md): the endpoint calls `Claiming.claim` and responds with the report. `own` runs when the report is an open found report and the person filed it: the request is refused with `CLAIMING_OWN_REPORT`. `refused` runs when the report is not an open found report, or doesn't exist: the request is refused with `NOT_FOUND`, the same answer for a lost report, a closed one, and an unknown one. When someone else has already claimed the report, `Claiming.claim` refuses the request with `ALREADY_CLAIMED`, and the database decides the winner when two people claim at the same instant.

```endpoints
claims.claiming.ClaimReport at /reports/claim
```

Once a claim is recorded, two reactions run after the endpoint answers. The reaction [resolve on claim](reaction:claims.claiming.ResolveOnClaim) calls `Reporting.resolve` on the claimed report, so it leaves the list of open reports. The reaction [notify the finder of a claim](reaction:claims.claiming.NotifyFinderOfClaim) looks up the report's reporter with `Reporting._getReport` and calls `Notifying.notify` with the message "Your found item was claimed." and the report as the subject. Each is its own consequence of the claim, so either can change without the other.

Because the report is resolved a moment after the claim, a second person who asks after that is refused with `NOT_FOUND`, and one whose request arrives before it with `ALREADY_CLAIMED`.

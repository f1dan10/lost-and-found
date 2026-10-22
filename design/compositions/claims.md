# Claims

An owner takes a found item by claiming its report. The [claim endpoint](reaction:claims.claiming.ClaimReport) first calls `Sessioning.use`, which returns the person's user from their session. It has three branches. `claimed` runs when the report [is an open found report](access.md) and the person [doesn't own it](access.md): the endpoint calls `Claiming.claim` and responds with the report. `own` runs when the report is an open found report and the person filed it: the request is refused with `CLAIMING_OWN_REPORT`. `refused` runs when the report is not an open found report, or doesn't exist: the request is refused with `NOT_FOUND`, the same answer for a lost report, a closed one, and an unknown one. When someone else has already claimed the report, `Claiming.claim` refuses the request with `ALREADY_CLAIMED`, and the database decides the winner when two people claim at the same instant.

```endpoints
claims.claiming.ClaimReport at /reports/claim
```

Once a claim is recorded, three reactions run after the endpoint answers. The reaction [resolve on claim](reaction:claims.claiming.ResolveOnClaim) calls `Reporting.resolve` on the claimed report, so it leaves the list of open reports. The reaction [notify the finder of a claim](reaction:claims.claiming.NotifyFinderOfClaim) looks up the report's reporter with `Reporting._getReport` and calls `Notifying.notify` with the message "Your found item was claimed." and the report as the subject. The reaction [close the claimant's lost report](reaction:claims.claiming.ResolveClaimantsLost) calls `Reporting.resolve` on each of the claimant's open lost reports that matched the item: the same category, sharing one of its places by `Locating._getNeighbors`, the same rule as the match notice. So the owner's lost report leaves the Lost list without a second step. Each is its own consequence of the claim, so any one can change without the others.

Because the report is resolved a moment after the claim, a second person who asks after that is refused with `NOT_FOUND`, and one whose request arrives before it with `ALREADY_CLAIMED`.

## Listing

The Claimed tab shows what happened to found items, so a claimed item no longer just disappears. [The recently claimed items](former:claims.listing.claimedCards) are the claims `Claiming._recent` returns for the last 30 days, newest first. Each comes with the report's category and description from Reporting, its places and spot from Locating, its photo when it has one, and when it was claimed. A claim older than 30 days is left out of the list but stays in Claiming, because it is the record of who took the item. The rows say that an item was claimed, never who claimed it: the claimant's name goes only to the finder, in their notices and their own reports, and to the claimant. The [list endpoint](reaction:claims.listing.ListClaims) responds with them as `claims`.

```endpoints
claims.listing.ListClaims at /claims/list
```

The person who claimed an item still needs to know where to pick it up after the report is resolved. [The claims of a user](former:claims.listing.myClaims) are every item `Claiming._byClaimant` returns for them, newest first and however long ago, with the same details as above, the username of the person who found it, from Reporting and Registering, and `thankedAt` and `thanksNote` from Thanking, which are `null` until they thank the finder, so the screen offers to thank only once. The [my claims endpoint](reaction:claims.listing.ListMyClaims) responds with them as `claims`, and only ever for the signed-in person.

```endpoints
claims.listing.ListMyClaims at /claims/mine
```

## Picking up

A claim says who will take an item, but not whether they have. Once the claimant has the item in hand, the [pickup endpoint](reaction:claims.collecting.CollectClaim) records it. It first calls `Sessioning.use`, which returns the person's user from their session, and has two branches. `mine` runs when the person [claimed the report](view:access.permissions.claimed): the endpoint calls `Claiming.collect` and responds with the report. `refused` runs when they didn't, or the report doesn't exist: the request is refused with `NOT_FOUND`, the same answer for both. A second pickup of the same item is refused by `Claiming` with `ALREADY_COLLECTED`. The claimant's own claims carry `collectedAt` from `Claiming._getCollected`, so the screen can move a picked-up claim out of what is waiting on them and into their history.

```endpoints
claims.collecting.CollectClaim at /claims/collect
```

The reaction [tell the finder it was picked up](reaction:claims.collecting.NotifyFinderOfPickup) runs when `Claiming.collect` returns. It looks up the report's reporter with `Reporting._getReport` and calls `Notifying.notify` with the message "Your found item was picked up." and the report as the subject, so the finder knows the item reached its owner.

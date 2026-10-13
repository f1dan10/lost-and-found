# Reports

A person files a report with one endpoint, and the report is never left without a location. The [file endpoint](reaction:reports.filing.FileReport) first calls `Sessioning.use`, which returns the person's user from their session. It has two branches. `filed` runs when the [view no listed place is unknown](view:reports.filing.hasUnknownPlace) fails to hold, that is, when every listed place exists: the endpoint calls `Reporting.file` with the person as the reporter, then `Locating.locate` with the new report as the item, and responds with the report. `unknown-place` runs when the view holds: the request is refused with `UNKNOWN_PLACE` before anything is filed.

The endpoint's input validator requires between 1 and 12 places, because the engine doesn't undo `Reporting.file` when a later action in the same request is refused. `Reporting.file` runs before `Locating.locate`, so a report refused with `INVALID_REPORT` never leaves a location behind, and the validator and the view keep a report that `Locating.locate` would refuse from being filed. The photo and the spot are optional.

```endpoints
reports.filing.FileReport at /reports/file
```

## Listing

The map and the lists read two endpoints, and a person must be signed in to call either. [The open reports of a kind](former:reports.listing.reportCards) are the reports `Reporting._getOpen` returns for that kind, newest first, so a resolved or withdrawn report is never among them. Each comes with its category, description, and filing time; the id and username of the person who filed it, from Registering; and each of its places with its name, from Locating. A report has a spot and a photo only when its finder gave them, and the former gives `null` for the ones it lacks. The photo is sent inside the list for now, and the screen shrinks it to about 400 pixels; a later version may serve photos from an endpoint of their own. The [list endpoint](reaction:reports.listing.ListReports) responds with the open found reports as `found` and the open lost reports as `lost`.

```endpoints
reports.listing.ListReports at /reports/list
```

[Every place](former:reports.listing.allPlaces) is each place `Locating._getPlaces` returns, by name, with its coordinates, so the screen can offer them to choose from. The [places endpoint](reaction:reports.listing.ListPlaces) responds with them.

```endpoints
reports.listing.ListPlaces at /places/list
```

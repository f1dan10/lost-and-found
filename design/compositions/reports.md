# Reports

A person files a report with one endpoint, and the report is never left without a location. The [file endpoint](reaction:reports.filing.FileReport) first calls `Sessioning.use`, which returns the person's user from their session. It has two branches. `filed` runs when the [view no listed place is unknown](view:reports.filing.hasUnknownPlace) fails to hold, that is, when every listed place exists: the endpoint calls `Reporting.file` with the person as the reporter, then `Locating.locate` with the new report as the item, and responds with the report. `unknown-place` runs when the view holds: the request is refused with `UNKNOWN_PLACE` before anything is filed.

The endpoint's input validator requires between 1 and 12 places, because the engine doesn't undo `Reporting.file` when a later action in the same request is refused. `Reporting.file` runs before `Locating.locate`, so a report refused with `INVALID_REPORT` never leaves a location behind, and the validator and the view keep a report that `Locating.locate` would refuse from being filed. The photo and the spot are optional.

```endpoints
reports.filing.FileReport at /reports/file
```

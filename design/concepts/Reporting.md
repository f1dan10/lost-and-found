# Reporting

## Purpose

Let a person tell a community about a thing they have found or lost.

*Prevents:* a report is filed with no description, or with a description or photo too large to show; someone finds a report that has been resolved or withdrawn among the open ones; a report nobody has renewed in two weeks stays among the open ones, though the item has probably gone; a report is resolved after it was withdrawn, or the other way around.

## Principle

Maya finds a water bottle and files a FOUND report with the category BOTTLE, a description, and a photo. When Sam looks through the open FOUND reports in the category BOTTLE, he finds hers, and he can read its description and see its photo. Maya hands the bottle back to its owner and resolves the report; Sam no longer finds it among the open reports. When Maya tries to resolve it again, she is refused with "This report is no longer open." Sam files a LOST report for his keys. Two weeks pass without news, and his report leaves the open reports; he renews it, and it is open for two more weeks.

## Types

```types
external Reporter
  The person who files a report.

Kind is FOUND or LOST
  Whether the thing was found or lost.

Category is BOTTLE or CLOTHING or ELECTRONICS or KEYS_ID or BAG or JEWELRY or OTHER
  What sort of thing the report is about.

Status is OPEN or RESOLVED or WITHDRAWN
  Where the report stands: OPEN until it is resolved or withdrawn.
```

## State

```state
a set of Reports with
  a reporter Reporter
  a kind Kind
  a category Category
  a description String
  an optional photo String
  a filedAt DateTime
  an expiresAt DateTime
  a status Status

Rule: a report is open while its status is OPEN and now is before its expiresAt; after that it has expired, but it keeps its status, so its reporter can still renew, resolve, or withdraw it.
Rule: a report lives for 14 days from when it is filed or last renewed.
Rule: a description has 1 to 500 characters once trimmed, and a photo has at most 2,000,000 characters.
```

## Actions

```actions
file(reporter: Reporter, kind: Kind, category: Category, description: String, photo?: String) : returns (report: Report)
  where kind is not FOUND or LOST, category is not one of the categories, description is blank or longer than 500 characters, or photo is longer than 2,000,000 characters
  then
    refuses INVALID_REPORT "A report needs a kind, a category, a description of 1 to 500 characters, and a photo that is not too large."
  where the report is acceptable
  then
    add a new report with reporter, kind, category, description, the photo if one is given, filedAt now, expiresAt 14 days from now, and status OPEN
    returns report

resolve(report: Report) : returns (report: Report)
  where report is not in Reports
  then
    refuses REPORT_NOT_FOUND "There is no such report."
  where report is in Reports and its status is not OPEN
  then
    refuses NOT_OPEN "This report is no longer open."
  where report is in Reports and its status is OPEN
  then
    set the status of report to RESOLVED
    returns report

renew(report: Report) : returns (report: Report)
  where report is not in Reports
  then
    refuses REPORT_NOT_FOUND "There is no such report."
  where report is in Reports and its status is not OPEN
  then
    refuses NOT_OPEN "This report is no longer open."
  where report is in Reports and its status is OPEN
  then
    set the expiresAt of report to 14 days from now, whether or not it had expired
    returns report

withdraw(report: Report) : returns (report: Report)
  where report is not in Reports
  then
    refuses REPORT_NOT_FOUND "There is no such report."
  where report is in Reports and its status is not OPEN
  then
    refuses NOT_OPEN "This report is no longer open."
  where report is in Reports and its status is OPEN
  then
    set the status of report to WITHDRAWN
    returns report
```

## Queries

```queries
_getOpen(kind: Kind, category?: Category) : many (report: Report)
  Returns each report of this kind whose status is OPEN and that has not expired, limited to this category when one is given, newest filedAt first and then by report identifier descending. Returns no rows when none is open.

_getByReporter(reporter: Reporter) : many (report: Report)
  Returns each report this reporter filed, whatever its status, newest filedAt first and then by report identifier descending. Returns no rows when they filed none.

_getReport(report: Report) : optional (reporter: Reporter, kind: Kind, category: Category, description: String, filedAt: DateTime, expiresAt: DateTime, status: Status)
  Returns the report's details, or no row for an unknown report.

_getPhoto(report: Report) : optional (photo: String)
  Returns the report's photo, or no row when the report is unknown or has no photo.
```

# Access

Reporting records who filed a report and whether it is still open, but it has no rule for who may do what with a report. The designer of Lost&Found wrote that rule as these two views, and every endpoint that acts on a report evaluates one of them first.

A person [owns a report](view:access.permissions.owns) when they filed it, and only the owner may withdraw it or resolve it. The designer of another application could let a team's administrators manage reports; they would change this view and leave Reporting as it is.

A report [is an open found report](view:access.permissions.isOpenFound) when it was filed as FOUND and its status is still OPEN. Only such a report can be claimed.

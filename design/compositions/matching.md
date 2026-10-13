# Matching

An owner who lost something often doesn't know where, so a lost report lists every place it may have been. When a finder files a found item, a reaction [tells the owner of a match](reaction:matching.notifying.NotifyOwnerOfMatch). It runs when `Locating.locate` returns for a found report. It finds each open lost report of the same category that has one of the found item's places, and calls `Notifying.notify` for that report's reporter with the message "An item matching your lost report was found." and the found report as the subject. The frontend builds the page address from the subject, so the message holds no link.

Two lost reports that match give two notices, one to each reporter, or two to one person who filed both. A lost report that is resolved, withdrawn, in another category, or in other places than the found item's gives none. Because the reaction runs after the endpoint answers, a found item is filed even when a notice or its email fails.

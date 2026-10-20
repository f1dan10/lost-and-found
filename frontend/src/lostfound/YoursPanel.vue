<script setup lang="ts">
import { computed } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import ClaimedCard from "./ClaimedCard.vue";
import { daysLeft } from "./expiry.ts";
import { categoryLabel, timeAgo } from "./format.ts";
import ReportCard from "./ReportCard.vue";
import { type MyReport, useLostFound } from "./useLostFound.ts";

/**
 * Everything about me in one place, grouped by what I'd do next rather than by concept: reports that are up,
 * reports that expired and can be renewed, items I claimed and need to pick up, and what's finished.
 */
const { mine, myClaims } = useLostFound();

const open = computed(() => mine.value.filter((report) => report.status === "OPEN" && daysLeft(report.expiresAt) > 0));
const expired = computed(() => mine.value.filter((report) => report.status === "OPEN" && daysLeft(report.expiresAt) <= 0));
const closed = computed(() => mine.value.filter((report) => report.status !== "OPEN"));
/** Found items of mine that someone claimed: the people I helped. */
const helped = computed(() => mine.value.filter((report) => report.kind === "FOUND" && report.claimedBy !== null).length);
const thanks = computed(() => mine.value.filter((report) => report.thankedAt !== null).length);

const kindOf = (report: MyReport) => (report.kind === "FOUND" ? "found" : "lost");

/** What happened to a closed report, in words. */
function outcome(report: MyReport): string {
  if (report.claimedBy) return `Claimed by ${report.claimedBy}`;
  if (report.status === "WITHDRAWN") return "You removed it";
  return report.kind === "LOST" ? "You got it back" : "You closed it";
}
</script>

<template>
  <section class="yours">
    <header class="tab-intro">
      <h2>Yours</h2>
      <p>Your reports and the items you claimed.</p>
    </header>

    <div class="summary" aria-live="polite">
      <p class="stat"><Icon name="user" :size="20" /><span><strong>{{ helped }}</strong> {{ helped === 1 ? "person" : "people" }} got something back because of you</span></p>
      <p class="stat"><Icon name="heart" :size="20" /><span><strong>{{ thanks }}</strong> {{ thanks === 1 ? "thank-you" : "thank-yous" }} received</span></p>
    </div>

    <section class="group" aria-labelledby="your-claims">
      <h3 id="your-claims" class="group-title">Items you claimed <span class="count">{{ myClaims.length }}</span></h3>
      <div v-if="myClaims.length" class="tiles">
        <ClaimedCard v-for="claim in myClaims" :key="claim.report" :claim="claim" :mine="claim" />
      </div>
      <p v-else class="none muted">When you claim a found item, where to pick it up stays here.</p>
    </section>

    <section class="group" aria-labelledby="your-open">
      <h3 id="your-open" class="group-title">Your open reports <span class="count">{{ open.length }}</span></h3>
      <div v-if="open.length" class="tiles">
        <ReportCard v-for="report in open" :key="report.report" :card="report" :kind="kindOf(report)" mine />
      </div>
      <p v-else class="none muted">Nothing open. Tap the plus button to report something you lost or found.</p>
    </section>

    <section v-if="expired.length" class="group" aria-labelledby="your-expired">
      <h3 id="your-expired" class="group-title">Expired <span class="count">{{ expired.length }}</span></h3>
      <p class="muted">Nobody else sees these anymore. Renew one to put it back up for two weeks.</p>
      <div class="tiles">
        <ReportCard v-for="report in expired" :key="report.report" :card="report" :kind="kindOf(report)" mine />
      </div>
    </section>

    <section v-if="closed.length" class="group" aria-labelledby="your-closed">
      <h3 id="your-closed" class="group-title">Finished <span class="count">{{ closed.length }}</span></h3>
      <ul class="history">
        <li v-for="report in closed" :key="report.report" class="row">
          <span class="chip" :class="report.claimedBy ? 'claimed' : ''">
            <Icon :name="report.claimedBy ? 'check' : report.kind === 'FOUND' ? 'pin' : 'search'" :size="12" />{{ report.kind === "FOUND" ? "Found" : "Lost" }}
          </span>
          <div class="row-text">
            <p class="row-title">{{ report.description }}</p>
            <p class="muted">{{ categoryLabel(report.category) }} · {{ outcome(report) }} · filed {{ timeAgo(report.filedAt) }}</p>
            <p v-if="report.thankedAt" class="note">
              <Icon name="heart" :size="14" />{{ report.claimedBy }} thanked you<template v-if="report.thanksNote">: “{{ report.thanksNote }}”</template>
            </p>
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>

<style scoped>
.yours {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: calc(-1 * var(--space-4));
}
.stat {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.stat strong {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
}
.group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.group-title {
  font-size: var(--text-lg);
  font-weight: 700;
}
.count {
  margin-left: 4px;
  color: var(--color-text-muted);
  font-weight: 600;
}
.none {
  padding: var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}
.history {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
}
.row + .row {
  border-top: 1px solid var(--color-line);
}
.row-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.row-title {
  font-family: var(--font-heading);
  font-weight: 600;
  overflow-wrap: anywhere;
}
.note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: var(--text-sm);
  overflow-wrap: anywhere;
}
.note :deep(svg) {
  flex: none;
  margin-top: 3px;
}
</style>

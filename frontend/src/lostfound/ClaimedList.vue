<script setup lang="ts">
import { computed, ref } from "vue";
import ClaimedCard from "./ClaimedCard.vue";
import { useLostFound } from "./useLostFound.ts";

/**
 * What found its owner in the last 30 days, newest first. The server sends only the last 30 days, so the
 * "past day" and "past week" chips just filter on the claim time here.
 */
const { claims, myClaims } = useLostFound();
const DAY_MS = 24 * 60 * 60 * 1000;
const RANGES = [
  { id: "day", label: "Past day", days: 1 },
  { id: "week", label: "Past week", days: 7 },
  { id: "month", label: "Past month", days: 30 },
] as const;
const range = ref<(typeof RANGES)[number]["id"]>("month");

const shown = computed(() => {
  const days = RANGES.find((entry) => entry.id === range.value)!.days;
  const since = Date.now() - days * DAY_MS;
  return claims.value.filter((claim) => new Date(claim.claimedAt).getTime() >= since);
});
const mineByReport = computed(() => new Map(myClaims.value.map((claim) => [claim.report, claim])));
</script>

<template>
  <section class="list">
    <header class="tab-intro">
      <h2>Back with their owners</h2>
      <p>Found items that someone claimed. Only the finder and the claimer see who claimed what.</p>
    </header>
    <div class="filters" role="group" aria-label="Claimed in the">
      <button
        v-for="entry in RANGES"
        :key="entry.id"
        type="button"
        class="filter"
        :class="{ on: range === entry.id }"
        :aria-pressed="range === entry.id"
        @click="range = entry.id"
      >
        {{ entry.label }}
      </button>
    </div>
    <div v-if="shown.length" class="tiles">
      <ClaimedCard v-for="claim in shown" :key="claim.report" :claim="claim" :mine="mineByReport.get(claim.report)" />
    </div>
    <p v-else class="empty">
      <strong>Nothing claimed in the {{ RANGES.find((entry) => entry.id === range)!.label.toLowerCase() }}</strong>
      <span class="muted">When someone claims a found item, it moves here.</span>
    </p>
  </section>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>

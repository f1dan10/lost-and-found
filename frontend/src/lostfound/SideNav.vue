<script setup lang="ts">
import { computed } from "vue";
import { useSession } from "../reusable/session.ts";
import Icon, { type IconName } from "../reusable/ui/Icon.vue";
import { search } from "./search.ts";
import { rowsFor, SECTIONS, type Section } from "./sections.ts";
import { useLostFound } from "./useLostFound.ts";

/**
 * Every section of the app, in two groups, each a full-width target with its count. While a search is typed, each
 * count is the number of matches there, so a search never hides what it found somewhere else.
 */
const { lists, section, query, show } = useLostFound();
const { me } = useSession();

const ICONS: Record<Section, IconName> = {
  found: "pin",
  lost: "search",
  map: "map",
  returned: "check",
  waiting: "bell",
  reports: "list",
  claims: "heart",
  history: "clock",
};

const counts = computed(() => {
  const username = me.value?.username ?? null;
  return Object.fromEntries(
    SECTIONS.map((entry) => [entry.id, entry.id === "map" ? null : search(rowsFor(entry.id, lists.value, username), query.value).length]),
  ) as Record<Section, number | null>;
});

const groups = computed(() => [
  { title: "Campus", entries: SECTIONS.filter((entry) => entry.group === "campus") },
  { title: "Yours", entries: SECTIONS.filter((entry) => entry.group === "yours") },
]);
</script>

<template>
  <nav class="side" aria-label="Sections">
    <div v-for="group in groups" :key="group.title" class="group">
      <h2 class="group-title">{{ group.title }}</h2>
      <button
        v-for="entry in group.entries"
        :key="entry.id"
        type="button"
        class="entry"
        :class="[entry.id, { on: section === entry.id, needs: entry.id === 'waiting' && (counts.waiting ?? 0) > 0 }]"
        :aria-current="section === entry.id ? 'page' : undefined"
        @click="show(entry.id)"
      >
        <span class="marker"><Icon :name="ICONS[entry.id]" :size="18" /></span>
        <span class="label">{{ entry.label }}</span>
        <span v-if="counts[entry.id] !== null" class="count">
          {{ counts[entry.id] }}<span class="sr-only">{{ query ? " matching" : " items" }}</span>
        </span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.side {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-3);
}
.group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.group-title {
  margin: 0 0 6px;
  padding: 0 var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.entry {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: var(--tap);
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font-size: var(--text-base);
  font-weight: 600;
  text-align: left;
}
.entry:hover {
  background: var(--color-line);
}
.marker {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
}
.found .marker {
  color: var(--color-found);
}
.lost .marker {
  color: var(--color-lost);
}
.returned .marker {
  color: var(--color-claimed);
}
.label {
  flex: 1;
  min-width: 0;
}
.count {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: var(--color-text-muted);
}
/* Waiting on you asks for attention only while something is waiting. */
.needs {
  background: var(--color-lost-soft);
}
.needs .count {
  color: var(--color-lost);
  font-weight: 700;
}
.on,
.on:hover {
  background: var(--color-text);
  color: var(--color-on-accent);
}
.on .marker,
.on .count {
  color: var(--color-on-accent);
}
</style>

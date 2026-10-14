<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import Icon from "./reusable/ui/Icon.vue";
import AddMenu from "./lostfound/AddMenu.vue";
import ReportList from "./lostfound/ReportList.vue";
import { type Tab, useLostFound } from "./lostfound/useLostFound.ts";

const { reports, places, tab, loaded, error, startPolling, reset } = useLostFound();

onMounted(startPolling);
// Leaving the page means signing out or a session that ended: stop polling and forget the lists.
onUnmounted(reset);

/** The buildings that have at least one open report, for the Board tab's count. */
const busy = computed(() => {
  const names = new Set<string>();
  for (const card of [...reports.value.found, ...reports.value.lost]) for (const place of card.places) names.add(place.place);
  return names.size;
});
const tabs = computed<{ id: Tab; label: string; count: number }[]>(() => [
  { id: "found", label: "Found", count: reports.value.found.length },
  { id: "lost", label: "Lost", count: reports.value.lost.length },
  { id: "board", label: "Board", count: busy.value },
]);
</script>

<template>
  <section class="page">
    <p v-if="error" class="banner" role="alert">
      {{ error }}
      <button type="button" class="icon-button" aria-label="Dismiss" @click="error = null"><Icon name="close" :size="16" /></button>
    </p>
    <p v-if="!loaded" class="muted loading">Loading…</p>
    <template v-else>
      <div class="tabs" role="tablist">
        <button
          v-for="entry in tabs"
          :key="entry.id"
          type="button"
          role="tab"
          class="tab"
          :class="[entry.id, { on: tab === entry.id }]"
          :aria-selected="tab === entry.id"
          @click="tab = entry.id"
        >
          {{ entry.label }} <span class="count">{{ entry.count }}</span>
        </button>
      </div>
      <ReportList v-if="tab === 'found'" :cards="reports.found" kind="found" />
      <ReportList v-else-if="tab === 'lost'" :cards="reports.lost" kind="lost" />
      <p v-else class="muted">{{ places.length }} buildings. The board comes next.</p>
    </template>
    <AddMenu />
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 1168px;
  margin: 0 auto;
}
.banner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 10px 10px 16px;
  border-radius: var(--radius-md);
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.banner .icon-button {
  margin-left: auto;
  color: inherit;
}
.loading {
  padding: var(--space-8) 0;
  text-align: center;
}
.tabs {
  display: flex;
  gap: var(--space-2);
}
.tab {
  padding: 8px 18px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  font-weight: 700;
}
.tab .count {
  margin-left: 4px;
  color: var(--color-text-muted);
  font-weight: 600;
}
.tab.on {
  color: #ffffff;
  border-color: transparent;
  background: var(--color-accent);
}
.tab.on.found {
  background: var(--color-found);
}
.tab.on.lost {
  background: var(--color-lost);
}
.tab.on .count {
  color: inherit;
  opacity: 0.85;
}
</style>

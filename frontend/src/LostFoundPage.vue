<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import Icon, { type IconName } from "./reusable/ui/Icon.vue";
import AddMenu from "./lostfound/AddMenu.vue";
import BuildingBoard from "./lostfound/BuildingBoard.vue";
import ClaimedList from "./lostfound/ClaimedList.vue";
import ReportList from "./lostfound/ReportList.vue";
import YoursPanel from "./lostfound/YoursPanel.vue";
import { type Tab, useLostFound } from "./lostfound/useLostFound.ts";

const { reports, claims, myClaims, mine, tab, loaded, error, toast, startPolling, reset } = useLostFound();

onMounted(startPolling);
// Leaving the page means signing out or a session that ended: stop polling and forget the lists.
onUnmounted(reset);

/** Things in Yours that need me: claims to pick up and expired reports to renew. */
const yoursCount = computed(() => myClaims.value.length + mine.value.filter((report) => report.status === "OPEN").length);
const tabs = computed<{ id: Tab; label: string; icon: IconName; count: number | null }[]>(() => [
  { id: "found", label: "Found", icon: "pin", count: reports.value.found.length },
  { id: "lost", label: "Lost", icon: "search", count: reports.value.lost.length },
  { id: "map", label: "Map", icon: "map", count: null },
  { id: "claimed", label: "Claimed", icon: "check", count: claims.value.length },
  { id: "yours", label: "Yours", icon: "user", count: yoursCount.value || null },
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
      <nav class="tabs" role="tablist" aria-label="Sections">
        <button
          v-for="entry in tabs"
          :key="entry.id"
          type="button"
          role="tab"
          class="tab"
          :class="[entry.id, { on: tab === entry.id }]"
          :aria-selected="tab === entry.id"
          :aria-label="entry.count === null ? entry.label : `${entry.label}, ${entry.count}`"
          @click="tab = entry.id"
        >
          <Icon :name="entry.icon" :size="18" />
          <span class="label">{{ entry.label }}</span>
          <span v-if="entry.count !== null" class="count">{{ entry.count }}</span>
        </button>
      </nav>
      <ReportList v-if="tab === 'found'" :cards="reports.found" kind="found" />
      <ReportList v-else-if="tab === 'lost'" :cards="reports.lost" kind="lost" />
      <BuildingBoard v-else-if="tab === 'map'" />
      <ClaimedList v-else-if="tab === 'claimed'" />
      <YoursPanel v-else />
    </template>
    <AddMenu />
    <p v-if="toast" class="toast" role="status"><Icon name="check" :size="18" />{{ toast }}</p>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 1168px;
  margin: 0 auto;
  /* Room below the last card for the floating add button. */
  padding-bottom: 104px;
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
  flex-wrap: wrap;
  gap: var(--space-2);
}
.tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: var(--tap);
  padding: 0 18px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  font-weight: 700;
}
.tab .count {
  color: var(--color-text-muted);
  font-weight: 600;
}
.tab.on {
  color: var(--color-on-accent);
  border-color: transparent;
  background: var(--color-accent);
}
/* Found and Lost keep their colour when chosen, so the tab says which list you are in. */
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
.toast {
  position: fixed;
  left: 50%;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  z-index: 20;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: max-content;
  max-width: min(520px, calc(100vw - 120px));
  padding: 12px 18px;
  border-radius: var(--radius-md);
  background: var(--color-text);
  color: var(--color-page);
  box-shadow: var(--shadow-popover);
  transform: translateX(-50%);
}

/* On a phone the tabs sit at the bottom of the screen, where a thumb reaches them (Fitts's law). */
@media (max-width: 640px) {
  .page {
    padding-bottom: 168px;
  }
  .tabs {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 15;
    flex-wrap: nowrap;
    gap: 0;
    padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
  }
  .tab {
    flex: 1 1 0;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-height: 56px;
    padding: 4px 0;
    border: 0;
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
  }
  .tab .count {
    display: none;
  }
  .toast {
    left: 16px;
    right: 96px;
    bottom: calc(96px + env(safe-area-inset-bottom, 0px));
    width: auto;
    max-width: none;
    transform: none;
  }
}
</style>

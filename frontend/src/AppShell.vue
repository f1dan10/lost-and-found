<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import Brand from "./lostfound/Brand.vue";
import DetailPanel from "./lostfound/DetailPanel.vue";
import ItemList from "./lostfound/ItemList.vue";
import MapPlace from "./lostfound/MapPlace.vue";
import NotificationBell from "./lostfound/NotificationBell.vue";
import ReportButton from "./lostfound/ReportButton.vue";
import SearchBar from "./lostfound/SearchBar.vue";
import SideNav from "./lostfound/SideNav.vue";
import { rowsFor } from "./lostfound/sections.ts";
import { useLostFound } from "./lostfound/useLostFound.ts";
import { useSession } from "./reusable/session.ts";
import Avatar from "./reusable/ui/Avatar.vue";
import Icon from "./reusable/ui/Icon.vue";
import Menu from "./reusable/ui/Menu.vue";

/**
 * The signed-in app on a laptop screen: a header with the search and the report button, then three columns. The
 * sidebar says where you are, the middle lists that section, and the right shows the chosen item. Each column
 * scrolls on its own, so the sidebar and the chosen item stay in view while you go down a long list.
 */
const { lists, section, selected, loaded, error, toast, startPolling, reset } = useLostFound();
const { me, signOut } = useSession();

/** The chosen item's row, looked up in its section, or null when nothing is chosen or it has gone. */
const row = computed(() => {
  const chosen = selected.value;
  if (chosen === null) return null;
  return rowsFor(chosen.section, lists.value, me.value?.username ?? null).find((each) => each.report === chosen.report) ?? null;
});

onMounted(startPolling);
// Leaving means signing out or a session that ended: stop polling and forget the lists.
onUnmounted(reset);

</script>

<template>
  <div class="shell">
    <header class="head">
      <Brand />
      <SearchBar />
      <div class="actions">
        <ReportButton />
        <NotificationBell />
        <Menu label="Account">
          <template #button><Avatar :username="me?.username ?? '?'" :size="40" /></template>
          <p class="signed-in">Signed in as <strong>{{ me?.username }}</strong></p>
          <button type="button" @click="signOut">Sign out</button>
        </Menu>
      </div>
    </header>

    <div class="cols">
      <div class="side-col">
        <SideNav />
      </div>

      <main class="main-col" aria-live="polite">
        <p v-if="error" class="banner" role="alert">
          {{ error }}
          <button type="button" class="icon-button" aria-label="Dismiss" @click="error = null"><Icon name="close" :size="16" /></button>
        </p>
        <p v-if="!loaded" class="muted loading">Loading…</p>
        <template v-else>
          <MapPlace v-if="section === 'map'" />
          <ItemList v-else />
        </template>
      </main>

      <aside class="detail-col" aria-label="Chosen item">
        <DetailPanel v-if="row" :key="row.report" :row="row" />
        <div v-else class="empty-detail">
          <Icon name="list" :size="28" />
          <p>Choose an item to see it here.</p>
        </div>
      </aside>
    </div>

    <p v-if="toast" class="toast" role="status"><Icon name="check" :size="18" />{{ toast }}</p>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100vh;
  /* The app is for laptop and desktop browsers. */
  min-width: 1024px;
}
.head {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-6);
  padding: 12px 24px 12px 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
/* The header is one line; the tagline shows on the sign-in page instead. */
.head :deep(.tagline) {
  display: none;
}
.actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.signed-in {
  padding: 8px 10px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.signed-in strong {
  color: var(--color-text);
}
.cols {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr) 360px;
  min-height: 0;
}
.side-col,
.main-col,
.detail-col {
  min-height: 0;
  overflow-y: auto;
}
.side-col {
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
}
.main-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-8) var(--space-8) var(--space-12);
}
.detail-col {
  border-left: 1px solid var(--color-border);
  background: var(--color-surface);
}
.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  height: 100%;
  padding: var(--space-8);
  color: var(--color-text-muted);
  text-align: center;
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
.toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: max-content;
  max-width: 560px;
  padding: 12px 18px;
  border-radius: var(--radius-md);
  background: var(--color-text);
  color: var(--color-page);
  box-shadow: var(--shadow-popover);
  transform: translateX(-50%);
}
@media (max-width: 1200px) {
  .head {
    grid-template-columns: 220px minmax(0, 1fr) auto;
  }
  .cols {
    grid-template-columns: 220px minmax(0, 1fr) 300px;
  }
}
</style>

<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import ReportForm from "./ReportForm.vue";

/**
 * The add button and its two choices. Each choice is a large card that says what happens next, so a first-time
 * finder knows that posting is quick and the item stays where it is. The page dims behind them; a click on it,
 * or Escape, closes the menu.
 */
const open = ref(false);
const adding = ref<"found" | "lost" | null>(null);

function add(kind: "found" | "lost") {
  open.value = false;
  adding.value = kind;
}

function escape(event: KeyboardEvent) {
  if (event.key === "Escape") open.value = false;
}
watch(open, (now) => (now ? document.addEventListener("keydown", escape) : document.removeEventListener("keydown", escape)));
onUnmounted(() => document.removeEventListener("keydown", escape));
</script>

<template>
  <div v-if="open" class="scrim" aria-hidden="true" @click="open = false" />
  <div class="add-menu">
    <div v-if="open" class="options" role="group" aria-label="What do you want to report?">
      <button type="button" class="option lost" @click="add('lost')">
        <span class="badge"><Icon name="search" :size="22" /></span>
        <span class="text">
          <span class="title">I lost something</span>
          <span class="sub">Say where it might be. You're told when it turns up.</span>
        </span>
      </button>
      <button type="button" class="option found" @click="add('found')">
        <span class="badge"><Icon name="pin" :size="22" /></span>
        <span class="text">
          <span class="title">I found something</span>
          <span class="sub">Leave it where it is and post where. Takes a minute.</span>
        </span>
      </button>
    </div>
    <button type="button" class="fab" :class="{ open }" :aria-expanded="open" :aria-label="open ? 'Close' : 'Add a report'" @click="open = !open">
      <Icon name="plus" :size="30" />
    </button>
    <ReportForm v-if="adding" :kind="adding" @close="adding = null" />
  </div>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  /* Above the phone's bottom tab bar (15), so the whole page dims. */
  z-index: 16;
  background: rgba(25, 26, 30, 0.35);
}
.add-menu {
  position: fixed;
  right: calc(24px + env(safe-area-inset-right, 0px));
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  z-index: 17;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-3);
}
.options {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: min(380px, calc(100vw - 32px));
}
.option {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-border);
  border-left: 6px solid;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
  text-align: left;
}
.option.lost {
  border-left-color: var(--color-lost);
}
.option.found {
  border-left-color: var(--color-found);
}
.option:hover {
  background: var(--color-page);
}
.badge {
  display: grid;
  place-items: center;
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: #ffffff;
}
.lost .badge {
  background: var(--color-lost);
}
.found .badge {
  background: var(--color-found);
}
.text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  line-height: 1.2;
}
.sub {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.fab {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-accent);
  color: var(--color-on-accent);
  box-shadow: var(--shadow-popover);
}
.fab :deep(svg) {
  transition: transform 0.15s;
}
.fab.open :deep(svg) {
  transform: rotate(45deg);
}
@media (prefers-reduced-motion: reduce) {
  .fab :deep(svg) {
    transition: none;
  }
}
/* Above the bottom tab bar on a phone. */
@media (max-width: 640px) {
  .add-menu {
    bottom: calc(88px + env(safe-area-inset-bottom, 0px));
    right: calc(16px + env(safe-area-inset-right, 0px));
  }
}
</style>

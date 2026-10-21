<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import ReportForm from "./ReportForm.vue";
import { useLostFound } from "./useLostFound.ts";

/**
 * The header's "Report an item" button and its two choices. Each choice is a card that says what happens next, so
 * a first-time finder knows posting is quick and the item stays where it is. A click outside or Escape closes it.
 * Other parts of the page open the form directly through `reporting`, such as "Found it? Report it".
 */
const { reporting } = useLostFound();
const open = ref(false);
const root = ref<HTMLElement | null>(null);

function add(kind: "found" | "lost") {
  open.value = false;
  reporting.value = kind;
}

function outside(event: Event) {
  if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.value?.contains(event.target as Node)) open.value = false;
}
watch(open, (now) => {
  for (const type of ["keydown", "click"] as const) {
    if (now) document.addEventListener(type, outside);
    else document.removeEventListener(type, outside);
  }
});
onUnmounted(() => {
  document.removeEventListener("keydown", outside);
  document.removeEventListener("click", outside);
});
</script>

<template>
  <div ref="root" class="report">
    <button type="button" class="button primary trigger" :aria-expanded="open" aria-haspopup="true" @click="open = !open">
      <Icon name="plus" :size="20" />Report an item
    </button>
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
    <ReportForm v-if="reporting" :kind="reporting" @close="reporting = null" />
  </div>
</template>

<style scoped>
.report {
  position: relative;
}
.trigger {
  border-radius: var(--radius-md);
  padding: 0 18px;
  font-weight: 700;
}
.options {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 380px;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
}
.option {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 0;
  border-left: 5px solid;
  border-radius: var(--radius-md);
  background: var(--color-surface);
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
  width: 44px;
  height: 44px;
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
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: 1.2;
}
.sub {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
</style>

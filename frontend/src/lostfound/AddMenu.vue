<script setup lang="ts">
import { ref } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import ReportForm from "./ReportForm.vue";

const open = ref(false);
const adding = ref<"found" | "lost" | null>(null);

function add(kind: "found" | "lost") {
  open.value = false;
  adding.value = kind;
}
</script>

<template>
  <div class="add-menu">
    <div v-if="open" class="options">
      <button type="button" class="button lost" @click="add('lost')"><Icon name="search" :size="18" />I lost something</button>
      <button type="button" class="button found" @click="add('found')"><Icon name="pin" :size="18" />I found something</button>
    </div>
    <button type="button" class="fab" :class="{ open }" :aria-expanded="open" aria-label="Add a report" @click="open = !open">
      <Icon name="plus" :size="30" />
    </button>
    <ReportForm v-if="adding" :kind="adding" @close="adding = null" />
  </div>
</template>

<style scoped>
.add-menu {
  position: fixed;
  right: calc(24px + env(safe-area-inset-right, 0px));
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-3);
}
.options {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
}
.options .button {
  min-height: 48px;
  padding: 0 20px;
}
.button.found {
  color: #ffffff;
  background: var(--color-found);
  box-shadow: var(--shadow-popover);
}
.button.lost {
  color: #ffffff;
  background: var(--color-lost);
  box-shadow: var(--shadow-popover);
}
.fab {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-accent);
  color: #ffffff;
  box-shadow: var(--shadow-popover);
}
.fab.open :deep(svg) {
  transform: rotate(45deg);
}
/* Above the bottom tab bar on a phone. */
@media (max-width: 640px) {
  .add-menu {
    bottom: calc(88px + env(safe-area-inset-bottom, 0px));
  }
}
</style>

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
      <button type="button" class="button lost" @click="add('lost')">Add Lost Item</button>
      <button type="button" class="button found" @click="add('found')">Add Found Item</button>
    </div>
    <button type="button" class="fab" :class="{ open }" :aria-expanded="open" aria-label="Add a report" @click="open = !open">
      <Icon name="plus" :size="26" />
    </button>
    <ReportForm v-if="adding" :kind="adding" @close="adding = null" />
  </div>
</template>

<style scoped>
.add-menu {
  position: fixed;
  right: 24px;
  bottom: 24px;
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
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-accent);
  color: #ffffff;
  box-shadow: var(--shadow-popover);
}
.fab.open :deep(svg) {
  transform: rotate(45deg);
}
</style>

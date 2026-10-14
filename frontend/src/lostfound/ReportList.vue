<script setup lang="ts">
import { computed, ref } from "vue";
import ClaimDialog from "./ClaimDialog.vue";
import { CATEGORIES } from "./format.ts";
import ReportCard from "./ReportCard.vue";
import type { Card } from "./useLostFound.ts";

/** The cards of one kind, which the server sends newest first, and the chips that filter them by category. */
const props = defineProps<{ cards: Card[]; kind: "found" | "lost" }>();
const category = ref<string | null>(null);
const claiming = ref<Card | null>(null);

const shown = computed(() => (category.value ? props.cards.filter((card) => card.category === category.value) : props.cards));
const none = computed(() => (props.kind === "found" ? "Nothing found yet" : "No lost reports"));
</script>

<template>
  <section class="list">
    <div class="filters" role="group" aria-label="Category">
      <button type="button" class="filter" :class="{ on: category === null }" @click="category = null">All</button>
      <button
        v-for="entry in CATEGORIES"
        :key="entry.value"
        type="button"
        class="filter"
        :class="{ on: category === entry.value }"
        @click="category = entry.value"
      >
        {{ entry.label }}
      </button>
    </div>
    <div v-if="shown.length" class="tiles">
      <ReportCard v-for="card in shown" :key="card.report" :card="card" :kind="kind" @claim="claiming = $event" />
    </div>
    <p v-else class="empty">
      <strong>{{ category ? "Nothing in this category" : none }}</strong>
      <span class="muted">
        {{ kind === "found" ? "Tap the plus button to report something you found." : "Tap the plus button to report something you lost." }}
      </span>
    </p>
    <ClaimDialog v-if="claiming" :card="claiming" @close="claiming = null" />
  </section>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.filter {
  padding: 6px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  font-size: var(--text-sm);
  font-weight: 600;
}
.filter.on {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: #ffffff;
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-12) var(--space-4);
  text-align: center;
}
</style>

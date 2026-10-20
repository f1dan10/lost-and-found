<script setup lang="ts">
import { computed, ref } from "vue";
import ClaimDialog from "./ClaimDialog.vue";
import { CATEGORIES } from "./format.ts";
import ReportCard from "./ReportCard.vue";
import type { Card, CardLike } from "./useLostFound.ts";

/** The cards of one kind, which the server sends newest first, and the chips that filter them by category. */
const props = defineProps<{ cards: Card[]; kind: "found" | "lost" }>();
const category = ref<string | null>(null);
const claiming = ref<CardLike | null>(null);

const shown = computed(() => (category.value ? props.cards.filter((card) => card.category === category.value) : props.cards));
const none = computed(() => (props.kind === "found" ? "Nothing found yet" : "No lost reports"));
</script>

<template>
  <section class="list">
    <header class="tab-intro">
      <h2>{{ kind === "found" ? "Found around campus" : "Lost around campus" }}</h2>
      <p v-if="kind === 'found'">Items people saw and left where they were. If one is yours, claim it, then go pick it up.</p>
      <p v-else>Things people are looking for. Seen one? Report it as found and its owner is told.</p>
    </header>
    <div class="filters" role="group" aria-label="Category">
      <button type="button" class="filter" :class="{ on: category === null }" :aria-pressed="category === null" @click="category = null">All</button>
      <button
        v-for="entry in CATEGORIES"
        :key="entry.value"
        type="button"
        class="filter"
        :class="{ on: category === entry.value }"
        :aria-pressed="category === entry.value"
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
</style>

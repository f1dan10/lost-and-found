<script setup lang="ts">
import { computed, ref } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import ClaimDialog from "./ClaimDialog.vue";
import ReportCard from "./ReportCard.vue";
import { type Card, useLostFound } from "./useLostFound.ts";

/** One tile per building with how many found and lost reports are open there, grouped on the client from the lists already fetched. */
const { reports, places } = useLostFound();
const selected = ref<string | null>(null);
const claiming = ref<Card | null>(null);

const tiles = computed(() =>
  [...places.value]
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map((place) => ({
      ...place,
      found: reports.value.found.filter((card) => card.places.some((entry) => entry.place === place.place)).length,
      lost: reports.value.lost.filter((card) => card.places.some((entry) => entry.place === place.place)).length,
    })),
);

/** The open cards at the selected building, found and lost together, newest first. */
const here = computed(() => {
  const at = selected.value;
  if (at === null) return [];
  const mark = (cards: Card[], kind: "found" | "lost") =>
    cards.filter((card) => card.places.some((entry) => entry.place === at)).map((card) => ({ card, kind }));
  return [...mark(reports.value.found, "found"), ...mark(reports.value.lost, "lost")].sort(
    (a, b) => new Date(b.card.filedAt).getTime() - new Date(a.card.filedAt).getTime(),
  );
});
const selectedName = computed(() => tiles.value.find((tile) => tile.place === selected.value)?.name ?? "");

function choose(place: string) {
  selected.value = selected.value === place ? null : place;
}

</script>

<template>
  <section class="board">
    <div class="grid">
      <button
        v-for="tile in tiles"
        :key="tile.place"
        type="button"
        class="tile"
        :class="{ empty: tile.found + tile.lost === 0, on: selected === tile.place }"
        :aria-pressed="selected === tile.place"
        @click="choose(tile.place)"
      >
        <span class="name">{{ tile.name }}</span>
        <span class="counts">
          <span class="count found"><Icon name="pin" :size="16" />{{ tile.found }}</span>
          <span class="count lost"><Icon name="pin" :size="16" />{{ tile.lost }}</span>
        </span>
        <span class="sr">{{ tile.found }} found, {{ tile.lost }} lost</span>
      </button>
    </div>

    <section v-if="selected !== null" class="here" aria-live="polite">
      <h2>{{ selectedName }}</h2>
      <div v-if="here.length" class="tiles">
        <ReportCard v-for="entry in here" :key="entry.card.report" :card="entry.card" :kind="entry.kind" @claim="claiming = $event" />
      </div>
      <p v-else class="muted">Nothing has been reported at {{ selectedName }}.</p>
    </section>
    <ClaimDialog v-if="claiming" :card="claiming" @close="claiming = null" />
  </section>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-3);
}
.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  text-align: left;
  box-shadow: var(--shadow-card);
}
.tile.on {
  border-color: var(--color-accent);
  outline: 2px solid var(--color-accent);
}
.tile.empty {
  opacity: 0.55;
  box-shadow: none;
}
.name {
  font-weight: 700;
}
.counts {
  display: flex;
  gap: var(--space-4);
}
.count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
}
.count.found {
  color: var(--color-found);
}
.count.lost {
  color: var(--color-lost);
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.here {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>

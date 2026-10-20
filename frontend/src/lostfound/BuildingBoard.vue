<script setup lang="ts">
import { computed, ref } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import CampusMap, { type MapTile } from "./CampusMap.vue";
import ClaimDialog from "./ClaimDialog.vue";
import ReportCard from "./ReportCard.vue";
import { type Card, type CardLike, useLostFound } from "./useLostFound.ts";

/**
 * The Map tab: where found and lost things are, by building. The map is the default view; the list of building tiles
 * shows the same counts and works with a keyboard and a screen reader. Choosing a building lists its reports below.
 * The counts are grouped on the client from the lists already fetched.
 */
const { reports, places } = useLostFound();
const view = ref<"map" | "list">("map");
const show = ref<"both" | "found" | "lost">("both");
const selected = ref<string | null>(null);
const claiming = ref<CardLike | null>(null);

const at = (cards: Card[], place: string) => cards.filter((card) => card.places.some((entry) => entry.place === place));

const tiles = computed<MapTile[]>(() =>
  [...places.value]
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((place) => ({
      ...place,
      found: show.value === "lost" ? 0 : at(reports.value.found, place.place).length,
      lost: show.value === "found" ? 0 : at(reports.value.lost, place.place).length,
    })),
);

/** The open cards at the selected building, found and lost together, newest first. */
const here = computed(() => {
  const place = selected.value;
  if (place === null) return [];
  const found = show.value === "lost" ? [] : at(reports.value.found, place).map((card) => ({ card, kind: "found" as const }));
  const lost = show.value === "found" ? [] : at(reports.value.lost, place).map((card) => ({ card, kind: "lost" as const }));
  return [...found, ...lost].sort((a, b) => new Date(b.card.filedAt).getTime() - new Date(a.card.filedAt).getTime());
});
const selectedName = computed(() => places.value.find((place) => place.place === selected.value)?.name ?? "");

function choose(place: string) {
  selected.value = selected.value === place ? null : place;
}
</script>

<template>
  <section class="board">
    <header class="tab-intro">
      <h2>Where things are</h2>
      <p>Each building shows how many things were found there and how many people lost something there. Choose one to see them.</p>
    </header>

    <div class="controls">
      <div class="filters" role="group" aria-label="Show">
        <button type="button" class="filter" :class="{ on: show === 'both' }" :aria-pressed="show === 'both'" @click="show = 'both'">Found and lost</button>
        <button type="button" class="filter" :class="{ on: show === 'found' }" :aria-pressed="show === 'found'" @click="show = 'found'">
          <Icon name="pin" :size="14" />Found only
        </button>
        <button type="button" class="filter" :class="{ on: show === 'lost' }" :aria-pressed="show === 'lost'" @click="show = 'lost'">
          <Icon name="search" :size="14" />Lost only
        </button>
      </div>
      <div class="filters" role="group" aria-label="View">
        <button type="button" class="filter" :class="{ on: view === 'map' }" :aria-pressed="view === 'map'" @click="view = 'map'"><Icon name="map" :size="14" />Map</button>
        <button type="button" class="filter" :class="{ on: view === 'list' }" :aria-pressed="view === 'list'" @click="view = 'list'"><Icon name="list" :size="14" />List</button>
      </div>
    </div>

    <CampusMap v-if="view === 'map'" :tiles="tiles" :selected="selected" @select="choose" />
    <div v-else class="grid">
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
        <span class="counts" aria-hidden="true">
          <span v-if="show !== 'lost'" class="count found"><Icon name="pin" :size="16" />{{ tile.found }} found</span>
          <span v-if="show !== 'found'" class="count lost"><Icon name="search" :size="16" />{{ tile.lost }} lost</span>
        </span>
        <span class="sr-only">{{ tile.found }} found, {{ tile.lost }} lost</span>
      </button>
    </div>

    <section v-if="selected !== null" class="here" aria-live="polite">
      <div class="here-head">
        <h3>{{ selectedName }}</h3>
        <button type="button" class="button outline" @click="selected = null">Clear</button>
      </div>
      <div v-if="here.length" class="tiles">
        <ReportCard v-for="entry in here" :key="entry.card.report" :card="entry.card" :kind="entry.kind" @claim="claiming = $event" />
      </div>
      <p v-else class="muted">Nothing {{ show === "both" ? "has been reported" : show === "found" ? "has been found" : "was lost" }} at {{ selectedName }}.</p>
    </section>
    <ClaimDialog v-if="claiming" :card="claiming" @close="claiming = null" />
  </section>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-2) var(--space-4);
}
.filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-3);
}
.tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 88px;
  padding: var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  text-align: left;
  box-shadow: var(--shadow-card);
}
.tile.on {
  border-color: var(--color-text);
  outline: 2px solid var(--color-text);
}
.tile.empty {
  box-shadow: none;
  color: var(--color-text-muted);
}
.name {
  font-weight: 700;
}
.counts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-4);
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
.tile.empty .count {
  color: var(--color-text-muted);
  font-weight: 500;
}
.here {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-2);
}
.here-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.here-head h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 600;
}
</style>

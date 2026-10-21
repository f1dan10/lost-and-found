<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useSession } from "../reusable/session.ts";
import Icon from "../reusable/ui/Icon.vue";
import CampusMap, { type MapTile } from "./CampusMap.vue";
import ItemRow from "./ItemRow.vue";
import { matchesElsewhere, search } from "./search.ts";
import { type Row, rowsFor } from "./sections.ts";
import { useLostFound } from "./useLostFound.ts";

/**
 * The Map section: the open found and lost items, by building. The search and the Found/Lost toggle filter the pins,
 * so a pin's counts are always the items you would see in the list. Choosing a building lists its items below as rows,
 * and choosing a row shows the item in the detail panel. The List view shows the same counts as tiles, for keyboards
 * and screen readers.
 */
const { places, lists, query, selected: chosen, show: choose } = useLostFound();
const { me } = useSession();
const view = ref<"map" | "list">("map");
const kind = ref<"both" | "found" | "lost">("both");
/** The building whose items are listed below the map. */
const building = ref<string | null>(null);
const here = ref<HTMLElement | null>(null);

const username = computed(() => me.value?.username ?? null);
const searching = computed(() => query.value.trim().length > 0);

/** The open items that match the search and the toggle; everything on this screen counts from these. */
const rows = computed<Row[]>(() =>
  search(rowsFor("map", lists.value, username.value), query.value).filter((row) => kind.value === "both" || row.kind === kind.value),
);

const tiles = computed<MapTile[]>(() =>
  [...places.value]
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((place) => {
      const at = rows.value.filter((row) => row.places.some((entry) => entry.place === place.place));
      return { ...place, found: at.filter((row) => row.kind === "found").length, lost: at.filter((row) => row.kind === "lost").length };
    }),
);
const busy = computed(() => tiles.value.filter((tile) => tile.found + tile.lost > 0));
/** In the List view, a search shows only the buildings that have matches; otherwise every building. */
const listed = computed(() => (searching.value ? busy.value : tiles.value));

const atBuilding = computed(() =>
  building.value === null
    ? []
    : rows.value
        .filter((row) => row.places.some((entry) => entry.place === building.value))
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()),
);
const buildingName = computed(() => places.value.find((place) => place.place === building.value)?.name ?? "");

const subtitle = computed(() => {
  const items = rows.value.length;
  const where = busy.value.length;
  const phrase = `${items} ${items === 1 ? "item" : "items"} in ${where} ${where === 1 ? "building" : "buildings"}`;
  return searching.value ? `${phrase} match “${query.value.trim()}”` : phrase;
});

const elsewhere = computed(() => matchesElsewhere(lists.value, username.value, query.value, "map"));

/** Choosing a building lists its items and brings the list into view; choosing it again closes it. */
function pick(place: string) {
  building.value = building.value === place ? null : place;
  if (building.value !== null) void nextTick(() => here.value?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
}

// A search that leaves the chosen building with nothing closes its list.
watch(atBuilding, (now) => {
  if (building.value !== null && now.length === 0 && searching.value) building.value = null;
});
</script>

<template>
  <section class="map-place" aria-labelledby="title-map">
    <header class="head">
      <div class="titles">
        <h2 id="title-map">Where things are</h2>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <button v-if="searching" type="button" class="button outline" @click="query = ''"><Icon name="close" :size="16" />Clear search</button>
    </header>

    <div class="controls">
      <div class="filters" role="group" aria-label="Show">
        <button type="button" class="filter" :class="{ on: kind === 'both' }" :aria-pressed="kind === 'both'" @click="kind = 'both'">Found and lost</button>
        <button type="button" class="filter" :class="{ on: kind === 'found' }" :aria-pressed="kind === 'found'" @click="kind = 'found'">
          <Icon name="pin" :size="14" />Found only
        </button>
        <button type="button" class="filter" :class="{ on: kind === 'lost' }" :aria-pressed="kind === 'lost'" @click="kind = 'lost'">
          <Icon name="search" :size="14" />Lost only
        </button>
      </div>
      <div class="filters" role="group" aria-label="View">
        <button type="button" class="filter" :class="{ on: view === 'map' }" :aria-pressed="view === 'map'" @click="view = 'map'"><Icon name="map" :size="14" />Map</button>
        <button type="button" class="filter" :class="{ on: view === 'list' }" :aria-pressed="view === 'list'" @click="view = 'list'"><Icon name="list" :size="14" />List</button>
      </div>
    </div>

    <CampusMap v-if="view === 'map'" :tiles="tiles" :selected="building" @select="pick" />
    <div v-else-if="listed.length" class="grid">
      <button
        v-for="tile in listed"
        :key="tile.place"
        type="button"
        class="tile"
        :class="{ empty: tile.found + tile.lost === 0, on: building === tile.place }"
        :aria-pressed="building === tile.place"
        @click="pick(tile.place)"
      >
        <span class="name">{{ tile.name }}</span>
        <span class="counts" aria-hidden="true">
          <span v-if="kind !== 'lost'" class="count found"><Icon name="pin" :size="16" />{{ tile.found }} found</span>
          <span v-if="kind !== 'found'" class="count lost"><Icon name="search" :size="16" />{{ tile.lost }} lost</span>
        </span>
        <span class="sr-only">{{ tile.found }} found, {{ tile.lost }} lost</span>
      </button>
    </div>

    <p v-if="searching && rows.length === 0" class="empty">
      <strong>No open item on the map matches “{{ query.trim() }}”.</strong>
    </p>
    <p v-else-if="view === 'map' && building === null" class="hint muted">Choose a building on the map to list what's there.</p>

    <p v-if="elsewhere.length" class="elsewhere">
      <span>{{ rows.length ? "Also matching:" : "Matches elsewhere:" }}</span>
      <button v-for="entry in elsewhere" :key="entry.id" type="button" class="text-button" @click="choose(entry.id)">
        {{ entry.count }} in {{ entry.label }}
      </button>
    </p>

    <section v-if="building !== null" ref="here" class="here" aria-live="polite">
      <div class="here-head">
        <h3>{{ buildingName }}</h3>
        <button type="button" class="button outline" @click="building = null">Close</button>
      </div>
      <ul v-if="atBuilding.length" class="rows">
        <li v-for="row in atBuilding" :key="row.key">
          <ItemRow :row="row" :selected="chosen?.report === row.report" :query="query" @choose="choose('map', row.report)" />
        </li>
      </ul>
      <p v-else class="muted">Nothing {{ kind === "both" ? "has been reported" : kind === "found" ? "has been found" : "was lost" }} at {{ buildingName }}.</p>
    </section>
  </section>
</template>

<style scoped>
.map-place {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}
.titles h2 {
  font-size: 2rem;
  line-height: 1.15;
}
.subtitle {
  margin-top: 2px;
  color: var(--color-text-muted);
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
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
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
}
.tile.on {
  border-color: var(--color-text);
  outline: 2px solid var(--color-text);
}
.tile.empty {
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
.hint {
  font-size: var(--text-sm);
}
.empty {
  padding: var(--space-6);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
}
.elsewhere {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-line);
  font-size: var(--text-sm);
}
.here {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  scroll-margin-bottom: var(--space-6);
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
.rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>

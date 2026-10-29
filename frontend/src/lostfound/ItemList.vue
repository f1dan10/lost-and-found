<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useSession } from "../reusable/session.ts";
import Icon from "../reusable/ui/Icon.vue";
import { CATEGORIES } from "./categories.ts";
import ItemCard from "./ItemCard.vue";
import ItemRow from "./ItemRow.vue";
import { matchesElsewhere, search } from "./search.ts";
import { rowsFor, type Row, SECTIONS, type Section } from "./sections.ts";
import { useLostFound } from "./useLostFound.ts";

/**
 * The middle column: the rows of the section on screen, filtered by the search, with the controls that section needs.
 * Found and Lost have category chips and a sort; Returned has time chips; History shows 20 at a time. Sections that
 * group their rows, such as Waiting on you, show a heading per group. The items show as rows or as cards, like the list
 * and icon views of a file browser. Arrow keys move the choice.
 */
const { lists, section, selected, query, show, viewMode, setViewMode, homeCount } = useLostFound();
const { me } = useSession();

const PAGE = 20;
const DAY_MS = 24 * 60 * 60 * 1000;
const RANGES = [
  { id: "day", label: "Past day", days: 1 },
  { id: "week", label: "Past week", days: 7 },
  { id: "month", label: "Past month", days: 30 },
] as const;

const category = ref<string | null>(null);
const sort = ref<"newest" | "building">("newest");
const range = ref<(typeof RANGES)[number]["id"]>("month");
const shown = ref(PAGE);
const list = ref<HTMLElement | null>(null);

// Each section starts with its own filters cleared, and so does going home.
function clearFilters() {
  category.value = null;
  sort.value = "newest";
  range.value = "month";
  shown.value = PAGE;
}
watch([section, homeCount], clearFilters);
watch(query, () => (shown.value = PAGE));

const info = computed(() => SECTIONS.find((entry) => entry.id === section.value)!);
const username = computed(() => me.value?.username ?? null);
const browsing = computed(() => section.value === "found" || section.value === "lost");

/** The section's rows after the search and its own filters, in the order shown. */
const rows = computed<Row[]>(() => {
  let result = search(rowsFor(section.value, lists.value, username.value), query.value);
  if (browsing.value && category.value) result = result.filter((row) => row.category === category.value);
  if (section.value === "returned") {
    const since = Date.now() - RANGES.find((entry) => entry.id === range.value)!.days * DAY_MS;
    result = result.filter((row) => new Date(row.time).getTime() >= since);
  }
  if (browsing.value && sort.value === "building") {
    const first = (row: Row) => row.places[0]?.name ?? "";
    result = [...result].sort((a, b) => first(a).localeCompare(first(b), undefined, { numeric: true }));
  }
  return result;
});

const visible = computed(() => (section.value === "history" ? rows.value.slice(0, shown.value) : rows.value));

/** The rows split under their group headings, keeping their order; a section without groups is one unnamed group. */
const groups = computed(() => {
  const result: { name: string | null; rows: Row[] }[] = [];
  for (const row of visible.value) {
    const last = result.at(-1);
    if (last && last.name === row.group) last.rows.push(row);
    else result.push({ name: row.group, rows: [row] });
  }
  return result;
});

/** While searching, how many matches each other section has, for "also matching" and the empty state. */
const elsewhere = computed(() => matchesElsewhere(lists.value, username.value, query.value, section.value));

const subtitle = computed(() => {
  const count = rows.value.length;
  const noun = count === 1 ? "item" : "items";
  return query.value.trim() ? `${count} ${count === 1 ? "item matches" : "items match"} “${query.value.trim()}”` : `${count} ${noun}`;
});

/** What an empty section says, when nothing is searched. */
const EMPTY: Record<Section, string> = {
  found: "Nothing has been found yet. Seen something? Report it with the button at the top.",
  lost: "Nobody is looking for anything right now.",
  map: "",
  returned: "Nothing was claimed in this time.",
  waiting: "Nothing needs you right now. Pickups, possible matches and reports about to expire appear here.",
  reports: "You have no open reports. Use the button at the top to report something you lost or found.",
  claims: "You have nothing to pick up. When you claim a found item, it stays here until you pick it up.",
  history: "Finished things appear here: items you picked up, and reports you closed or removed.",
};

function choose(row: Row) {
  show(section.value, row.report);
}

/** How many cards fit across the grid, read from the browser's layout; 1 in the list. */
function columns(): number {
  if (viewMode.value === "list") return 1;
  const grid = list.value?.querySelector(".cards");
  return grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 1;
}

/** Up and down move the choice through the visible items, and keep the chosen one in view. In the grid, left and right step by one and up and down by a row. */
function move(step: number) {
  const all = visible.value;
  if (all.length === 0) return;
  const at = all.findIndex((row) => row.report === selected.value?.report);
  const next = all[Math.min(all.length - 1, Math.max(0, at === -1 ? 0 : at + step))]!;
  choose(next);
  void nextTick(() => {
    const element = list.value?.querySelector<HTMLElement>(`[data-report="${next.report}"]`);
    element?.focus();
    element?.scrollIntoView({ block: "nearest" });
  });
}
</script>

<template>
  <section class="items" :aria-labelledby="`title-${section}`">
    <header class="head">
      <div class="titles">
        <h2 :id="`title-${section}`">{{ info.title }}</h2>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <div class="tools">
        <button v-if="query" type="button" class="button outline clear" @click="query = ''">
          <Icon name="close" :size="16" />Clear search
        </button>
        <label v-if="browsing" class="sort">
          Sort
          <select v-model="sort">
            <option value="newest">Newest first</option>
            <option value="building">By building</option>
          </select>
        </label>
        <div class="views" role="group" aria-label="View as">
          <button type="button" class="view" :class="{ on: viewMode === 'list' }" :aria-pressed="viewMode === 'list'" aria-label="List" title="List" @click="setViewMode('list')">
            <Icon name="list" :size="18" />
          </button>
          <button type="button" class="view" :class="{ on: viewMode === 'grid' }" :aria-pressed="viewMode === 'grid'" aria-label="Grid" title="Grid" @click="setViewMode('grid')">
            <Icon name="grid" :size="18" />
          </button>
        </div>
      </div>
    </header>

    <div v-if="browsing" class="filters" role="group" aria-label="Category">
      <button type="button" class="filter" :class="{ on: category === null }" :aria-pressed="category === null" @click="category = null">All</button>
      <button
        v-for="entry in CATEGORIES"
        :key="entry.value"
        type="button"
        class="filter"
        :class="{ on: category === entry.value }"
        :aria-pressed="category === entry.value"
        @click="category = category === entry.value ? null : entry.value"
      >
        {{ entry.label }}
      </button>
    </div>
    <div v-else-if="section === 'returned'" class="filters" role="group" aria-label="Claimed in the">
      <button
        v-for="entry in RANGES"
        :key="entry.id"
        type="button"
        class="filter"
        :class="{ on: range === entry.id }"
        :aria-pressed="range === entry.id"
        @click="range = entry.id"
      >
        {{ entry.label }}
      </button>
    </div>

    <div
      v-if="visible.length"
      ref="list"
      class="groups"
      @keydown.down.prevent="move(columns())"
      @keydown.up.prevent="move(-columns())"
      @keydown.right="viewMode === 'grid' && (($event.preventDefault(), move(1)))"
      @keydown.left="viewMode === 'grid' && (($event.preventDefault(), move(-1)))"
    >
      <section v-for="group in groups" :key="group.name ?? 'all'" class="group">
        <h3 v-if="group.name" class="group-name">{{ group.name }} <span>{{ group.rows.length }}</span></h3>
        <ul class="rows" :class="{ cards: viewMode === 'grid' }">
          <li v-for="row in group.rows" :key="row.key">
            <component :is="viewMode === 'grid' ? ItemCard : ItemRow" :row="row" :selected="selected?.report === row.report" :query="query" @choose="choose(row)" />
          </li>
        </ul>
      </section>
      <button v-if="section === 'history' && rows.length > shown" type="button" class="button outline more" @click="shown += PAGE">
        Show {{ Math.min(PAGE, rows.length - shown) }} more of {{ rows.length - shown }}
      </button>
    </div>

    <div v-else class="empty">
      <template v-if="query.trim()">
        <strong>Nothing in {{ info.label }} matches “{{ query.trim() }}”.</strong>
        <span v-if="!elsewhere.length" class="muted">Try fewer words, a building number such as “32”, or a category such as “keys”.</span>
      </template>
      <span v-else class="muted">{{ EMPTY[section] }}</span>
    </div>

    <p v-if="elsewhere.length" class="elsewhere">
      <span>{{ visible.length ? "Also matching:" : "Matches elsewhere:" }}</span>
      <button v-for="entry in elsewhere" :key="entry.id" type="button" class="text-button" @click="show(entry.id)">
        {{ entry.count }} in {{ entry.label }}
      </button>
    </p>
  </section>
</template>

<style scoped>
.items {
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
.sort {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-muted);
}
.sort select {
  min-height: 40px;
  padding: 0 10px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
}
.tools {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.clear {
  flex: none;
}
.views {
  display: inline-flex;
  overflow: hidden;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
}
.view {
  display: grid;
  place-items: center;
  width: 40px;
  height: 37px;
  border: 0;
  background: var(--color-surface);
  color: var(--color-text-muted);
}
.view + .view {
  border-left: 1.5px solid var(--color-border);
}
.view.on {
  background: var(--color-text);
  color: var(--color-surface);
}
.rows.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
}
.groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.group-name {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.group-name span {
  margin-left: 4px;
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
.more {
  align-self: center;
}
.empty {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-8) var(--space-6);
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
</style>

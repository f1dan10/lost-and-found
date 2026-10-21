<script setup lang="ts">
import { computed, nextTick, ref, useId } from "vue";
import Icon from "../reusable/ui/Icon.vue";

/**
 * Choosing buildings by typing, the way apps let you add skills or tags: type part of a name or number, pick a
 * suggestion, and it becomes a chip you can remove. With `max` 1 (a found item) the one chip replaces the box.
 * People recognize "Stata" or "32" faster than they find it in a list of a hundred checkboxes.
 */
const props = defineProps<{ places: { place: string; name: string }[]; max: number; inputId?: string }>();
const chosen = defineModel<string[]>({ required: true });

const root = ref<HTMLElement | null>(null);
const input = ref<HTMLInputElement | null>(null);
const query = ref("");
const open = ref(false);
const active = ref(0);
/** True when there is more room above the box than below it inside the dialog, so the list opens upward. */
const upward = ref(false);
const listId = useId();

const byId = computed(() => new Map(props.places.map((place) => [place.place, place])));
const chips = computed(() => chosen.value.map((id) => byId.value.get(id)).filter((place) => place !== undefined));
const full = computed(() => chosen.value.length >= props.max);

/** The building number in a name, such as "32" in "Building 32 (Stata)" or "W20" in "W20 (Student Center)". */
const numberOf = (name: string) => name.replace(/^Building /, "").split(" ")[0]!.toLowerCase();

/**
 * Buildings not yet chosen that match what was typed, best first: the exact number ("3" before "32"), then names
 * that start with it, then names that contain it anywhere, such as "stata".
 */
const matches = computed(() => {
  const typed = query.value.trim().toLowerCase().replace(/^(building|bldg\.?)\s*/, "");
  const left = props.places.filter((place) => !chosen.value.includes(place.place));
  if (!typed) return left;
  const score = (name: string) => {
    const lower = name.toLowerCase();
    if (numberOf(name) === typed) return 0;
    if (numberOf(name).startsWith(typed)) return 1;
    if (lower.includes(typed)) return 2;
    return 3;
  };
  return left.filter((place) => score(place.name) < 3).sort((a, b) => score(a.name) - score(b.name));
});

function show() {
  if (full.value) return;
  const dialog = root.value?.closest("dialog");
  const box = input.value?.getBoundingClientRect();
  if (dialog && box) {
    const area = dialog.getBoundingClientRect();
    upward.value = area.bottom - box.bottom < 260 && box.top - area.top > area.bottom - box.bottom;
  }
  open.value = true;
  active.value = 0;
}

function choose(id: string) {
  chosen.value = props.max === 1 ? [id] : [...chosen.value, id];
  query.value = "";
  active.value = 0;
  if (full.value) open.value = false;
  else void nextTick(() => input.value?.focus());
}

function remove(id: string) {
  chosen.value = chosen.value.filter((other) => other !== id);
  void nextTick(() => input.value?.focus());
}

function key(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!open.value) show();
    else active.value = Math.min(active.value + 1, matches.value.length - 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    active.value = Math.max(active.value - 1, 0);
  } else if (event.key === "Enter") {
    // Enter picks the highlighted building instead of sending the form.
    event.preventDefault();
    const pick = matches.value[active.value];
    if (open.value && pick) choose(pick.place);
  } else if (event.key === "Escape" && open.value) {
    event.stopPropagation();
    event.preventDefault();
    open.value = false;
  } else if (event.key === "Backspace" && query.value === "" && chosen.value.length) {
    chosen.value = chosen.value.slice(0, -1);
  }
}

/** Closes the list when the focus leaves the picker. */
function leave(event: FocusEvent) {
  if (!(event.relatedTarget instanceof Node && root.value?.contains(event.relatedTarget))) open.value = false;
}

function typed() {
  if (!open.value) show();
  active.value = 0;
}
</script>

<template>
  <div ref="root" class="picker" @focusout="leave">
    <div class="box" :class="{ focused: open }" @click="input?.focus()">
      <span v-for="place in chips" :key="place.place" class="chosen">
        <Icon name="building" :size="14" />{{ place.name }}
        <button type="button" class="unchoose" :aria-label="`Remove ${place.name}`" @click.stop="remove(place.place)">
          <Icon name="close" :size="14" />
        </button>
      </span>
      <input
        v-show="!(max === 1 && full)"
        :id="inputId"
        ref="input"
        v-model="query"
        type="text"
        role="combobox"
        autocomplete="off"
        :aria-expanded="open"
        :aria-controls="listId"
        :aria-activedescendant="open && matches[active] ? `${listId}-${matches[active]!.place}` : undefined"
        :disabled="full"
        :placeholder="full ? `${max} buildings at most` : chips.length ? 'Add another building' : 'Type a building number or name'"
        @focus="show"
        @input="typed"
        @keydown="key"
      />
    </div>
    <ul v-if="open" :id="listId" class="list" :class="{ upward }" role="listbox">
      <li
        v-for="(place, index) in matches"
        :id="`${listId}-${place.place}`"
        :key="place.place"
        role="option"
        class="option"
        :class="{ active: index === active }"
        :aria-selected="index === active"
        @mousedown.prevent
        @mouseenter="active = index"
        @click="choose(place.place)"
      >
        <Icon name="building" :size="16" />{{ place.name }}
      </li>
      <li v-if="!matches.length" class="none">No building matches “{{ query }}”.</li>
    </ul>
  </div>
</template>

<style scoped>
.picker {
  position: relative;
}
.box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: var(--tap);
  padding: 5px 8px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: text;
}
.box.focused,
.box:focus-within {
  border-color: var(--color-text);
}
.box input {
  flex: 1 1 160px;
  min-width: 0;
  min-height: 32px;
  padding: 0 6px;
  border: 0;
  outline: none;
  background: transparent;
  font-weight: 400;
}
.chosen {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 4px 3px 10px;
  border-radius: var(--radius-full);
  background: var(--color-line);
  font-size: var(--text-sm);
  font-weight: 600;
}
.unchoose {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-muted);
}
.unchoose:hover {
  background: var(--color-border);
  color: var(--color-text);
}
.list {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 5;
  max-height: 240px;
  margin: 0;
  padding: 4px;
  overflow-y: auto;
  list-style: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
}
.list.upward {
  top: auto;
  bottom: calc(100% + 4px);
}
.option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  cursor: pointer;
}
.option :deep(svg) {
  flex: none;
  color: var(--color-text-muted);
}
.option.active {
  background: var(--color-line);
}
.none {
  padding: 10px;
  color: var(--color-text-muted);
}
</style>

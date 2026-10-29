<script setup lang="ts">
import { computed } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import { categoryIcon, categoryLabel } from "./format.ts";
import Marked from "./Marked.vue";
import { expiryOf, personOf, tagOf, whenOf } from "./rowMeta.ts";
import type { Row } from "./sections.ts";

/**
 * One item as a card, for the grid view: a large picture on top, then its title, where it is, and a tag for its state.
 * It shows the same facts as a row, so the two views can be switched without losing anything.
 */
const props = defineProps<{ row: Row; selected: boolean; query: string }>();
defineEmits<{ choose: [] }>();

const tag = computed(() => tagOf(props.row));
const when = computed(() => whenOf(props.row));
const expiry = computed(() => expiryOf(props.row));
const person = computed(() => personOf(props.row));
</script>

<template>
  <button
    type="button"
    class="card"
    :class="{ selected, [row.kind]: true, [row.state]: true }"
    :aria-current="selected ? 'true' : undefined"
    :data-report="row.report"
    @click="$emit('choose')"
  >
    <span class="picture">
      <img v-if="row.photo" :src="row.photo" alt="" />
      <span v-else class="none" aria-hidden="true"><Icon :name="categoryIcon(row.category)" :size="40" /></span>
      <span class="tag" :class="tag.tone"><Icon :name="tag.icon" :size="12" />{{ tag.text }}</span>
    </span>
    <span class="title"><Marked :text="row.description" :query="query" /></span>
    <span class="line where">
      <Icon name="building" :size="14" />
      <span class="clip">
        <template v-for="(place, index) in row.places" :key="place.place"><template v-if="index">, </template><Marked :text="place.name" :query="query" /></template>
      </span>
    </span>
    <span class="line">{{ categoryLabel(row.category) }} · {{ when }}</span>
    <span v-if="person" class="line"><Marked :text="person" :query="query" /></span>
    <span v-if="expiry" class="line">{{ expiry }}</span>
  </button>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  height: 100%;
  padding: var(--space-2) var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  text-align: left;
}
.card:hover {
  border-color: var(--color-text-muted);
}
.card.selected {
  border-color: var(--color-text);
  box-shadow: 0 0 0 1px var(--color-text);
}
.picture {
  position: relative;
  display: block;
  aspect-ratio: 4 / 3;
  margin-bottom: var(--space-2);
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--color-line);
}
.picture img,
.picture .none {
  width: 100%;
  height: 100%;
}
.picture img {
  object-fit: cover;
}
.picture .none {
  display: grid;
  place-items: center;
}
.found .none {
  background: var(--color-found-soft);
  color: var(--color-found);
}
.lost .none {
  background: var(--color-lost-soft);
  color: var(--color-lost);
}
.claimed .none,
.picked-up .none {
  background: var(--color-claimed-soft);
  color: var(--color-claimed);
}
.expired .picture,
.removed .picture,
.closed .picture {
  filter: grayscale(1);
  opacity: 0.7;
}
.tag {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 700;
  white-space: nowrap;
}
.tag.found {
  background: var(--color-found);
  color: var(--color-on-accent, #ffffff);
}
.tag.lost {
  background: var(--color-lost);
  color: var(--color-on-accent, #ffffff);
}
.tag.claimed {
  background: var(--color-claimed);
  color: var(--color-on-accent, #ffffff);
}
.tag.muted {
  background: var(--color-line);
  color: var(--color-text);
}
.title {
  overflow: hidden;
  padding: 0 var(--space-1);
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.line {
  padding: 0 var(--space-1);
  overflow: hidden;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.where {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: var(--color-text);
}
.clip {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<script setup lang="ts">
import { computed } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import { daysLeft } from "./expiry.ts";
import { categoryIcon, categoryLabel, timeAgo } from "./format.ts";
import Marked from "./Marked.vue";
import type { Row } from "./sections.ts";

/**
 * One item in a list: a small picture, its title, one line of where and who and when, and a tag for its state.
 * Rows are compact, so a laptop screen shows about ten at once; the chosen one is shown in full on the right.
 */
const props = defineProps<{ row: Row; selected: boolean; query: string }>();
defineEmits<{ choose: [] }>();

/** The tag at the end of the row: what state the item is in, in words, with the matching colour. */
const tag = computed(() => {
  const { state, kind } = props.row;
  switch (state) {
    case "open":
      return kind === "found" ? { text: "Found", tone: "found", icon: "pin" as const } : { text: "Lost", tone: "lost", icon: "search" as const };
    case "expired":
      return { text: "Expired", tone: "muted", icon: "clock" as const };
    case "claimed":
      return { text: "Claimed", tone: "claimed", icon: "check" as const };
    case "picked-up":
      return { text: "Picked up", tone: "claimed", icon: "check" as const };
    case "closed":
      return { text: kind === "lost" ? "Got it back" : "Closed", tone: "muted", icon: "check" as const };
    case "removed":
      return { text: "Removed", tone: "muted", icon: "close" as const };
  }
});

/** The time phrase that fits the section the row is in. */
const when = computed(() => {
  const { source, time } = props.row;
  if (source.type === "claim") return source.claim.collectedAt ? `picked up ${timeAgo(time)}` : `claimed ${timeAgo(time)}`;
  if (source.type === "returned") return `claimed ${timeAgo(time)}`;
  return timeAgo(time);
});

/** For my open reports, how long they stay up. */
const expiry = computed(() => {
  const { source, state } = props.row;
  if (source.type !== "mine" || state !== "open") return null;
  const left = daysLeft(source.report.expiresAt);
  return left <= 1 ? "Expires today" : `${left} days left`;
});

const person = computed(() => {
  const { source, person } = props.row;
  if (person === null) return null;
  return source.type === "claim" ? `found by ${person}` : person;
});
</script>

<template>
  <button
    type="button"
    class="row"
    :class="{ selected, [row.kind]: true, [row.state]: true }"
    :aria-current="selected ? 'true' : undefined"
    :data-report="row.report"
    @click="$emit('choose')"
  >
    <img v-if="row.photo" class="thumb" :src="row.photo" alt="" />
    <span v-else class="thumb none" aria-hidden="true"><Icon :name="categoryIcon(row.category)" :size="24" /></span>
    <span class="text">
      <span class="title"><Marked :text="row.description" :query="query" /></span>
      <span class="line">
        <span class="where">
          <Icon name="building" :size="14" />
          <template v-for="(place, index) in row.places" :key="place.place"><template v-if="index">, </template><Marked :text="place.name" :query="query" /></template>
        </span>
        <template v-if="row.spot"><span class="dot">·</span><Marked :text="row.spot" :query="query" /></template>
        <template v-if="person"><span class="dot">·</span><Marked :text="person" :query="query" /></template>
        <span class="dot">·</span>{{ when }}
      </span>
    </span>
    <span class="end">
      <span class="tag" :class="tag.tone"><Icon :name="tag.icon" :size="12" />{{ tag.text }}</span>
      <span v-if="expiry" class="expiry">{{ expiry }}</span>
      <span class="sr-only">{{ categoryLabel(row.category) }}</span>
    </span>
  </button>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  padding: var(--space-3) var(--space-4) var(--space-3) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  text-align: left;
}
.row:hover {
  border-color: #b9b7b0;
}
.row.selected {
  border-color: var(--color-text);
  box-shadow: 0 0 0 1px var(--color-text);
}
.thumb {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  background: var(--color-line);
}
.found .thumb.none {
  background: var(--color-found-soft);
  color: var(--color-found);
}
.lost .thumb.none {
  background: var(--color-lost-soft);
  color: var(--color-lost);
}
.claimed .thumb.none,
.picked-up .thumb.none {
  background: var(--color-claimed-soft);
  color: var(--color-claimed);
}
.expired .thumb,
.removed .thumb,
.closed .thumb {
  filter: grayscale(1);
  opacity: 0.7;
}
.text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.title {
  overflow: hidden;
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.line {
  overflow: hidden;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.where {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: var(--color-text);
}
.dot {
  margin: 0 6px;
}
.end {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.tag {
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
  color: #ffffff;
}
.tag.lost {
  background: var(--color-lost);
  color: #ffffff;
}
.tag.claimed {
  background: var(--color-claimed);
  color: #ffffff;
}
.tag.muted {
  background: var(--color-line);
  color: var(--color-text);
}
.expiry {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>

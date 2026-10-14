<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useSession } from "../reusable/session.ts";
import Icon from "../reusable/ui/Icon.vue";
import { categoryIcon, categoryLabel, timeAgo } from "./format.ts";
import { type Card, useLostFound } from "./useLostFound.ts";

const props = defineProps<{ card: Card; kind: "found" | "lost" }>();
defineEmits<{ claim: [card: Card] }>();
const { me } = useSession();
const { highlight } = useLostFound();

/** Cards carry the reporter's username, so a card is mine when it matches the signed-in name. */
const root = ref<HTMLElement | null>(null);

/** Scrolls the card into view when it is the one being pointed at, such as from a notice. */
function showIfHighlighted() {
  if (highlight.value === props.card.report) void nextTick(() => root.value?.scrollIntoView({ block: "center", behavior: "smooth" }));
}
onMounted(showIfHighlighted);
watch(highlight, showIfHighlighted);

const mine = computed(() => props.card.username === me.value?.username);
</script>

<template>
  <article ref="root" class="card report" :class="[kind, { highlighted: highlight === card.report }]">
    <img v-if="card.photo" class="photo" :src="card.photo" :alt="`${categoryLabel(card.category)}: ${card.description}`" />
    <div v-else class="photo none" :class="kind"><Icon :name="categoryIcon(card.category)" :size="40" /></div>
    <div class="text">
      <div class="chips">
        <span class="chip" :class="kind"><Icon :name="kind === 'found' ? 'pin' : 'search'" :size="12" />{{ kind === "found" ? "Found" : "Lost" }}</span>
        <span class="chip category">{{ categoryLabel(card.category) }}</span>
        <span v-if="mine" class="chip mine">Your report</span>
      </div>
      <p class="description">{{ card.description }}</p>
      <div class="chips">
        <span v-for="place in card.places" :key="place.place" class="chip place"><Icon name="building" :size="12" />{{ place.name }}</span>
      </div>
      <p v-if="card.spot" class="spot"><Icon name="pin" :size="14" />{{ card.spot }}</p>
      <p class="muted">by {{ card.username }} · {{ timeAgo(card.filedAt) }}</p>
      <button v-if="kind === 'found' && !mine" type="button" class="button primary claim" @click="$emit('claim', card)">
        <Icon name="check" :size="16" />Claim
      </button>
    </div>
  </article>
</template>

<style scoped>
.report {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 5px solid var(--color-found);
}
.report.lost {
  border-left-color: var(--color-lost);
}
.report.highlighted {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}
.photo {
  width: 100%;
  height: 160px;
  object-fit: cover;
  background: var(--color-line);
}
.photo.none {
  display: grid;
  place-items: center;
  background: var(--color-found-soft);
  color: var(--color-found);
}
.photo.none.lost {
  background: var(--color-lost-soft);
  color: var(--color-lost);
}
.text {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  flex: 1;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}
.chip.place,
.chip.category {
  background: var(--color-line);
  color: var(--color-text);
}
.chip.mine {
  background: var(--color-text);
  color: #ffffff;
}
.description {
  font-weight: 600;
  overflow-wrap: anywhere;
}
.spot {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.claim {
  margin-top: auto;
  align-self: flex-start;
}
</style>

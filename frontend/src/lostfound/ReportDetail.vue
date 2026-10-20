<script setup lang="ts">
import Dialog from "../reusable/ui/Dialog.vue";
import Icon from "../reusable/ui/Icon.vue";
import { categoryIcon, categoryLabel, timeAgo } from "./format.ts";
import type { CardLike } from "./useLostFound.ts";

/** A report at full size: the whole photo and the whole description, which the card may cut short. */
defineProps<{ card: CardLike; kind: "found" | "lost"; mine: boolean }>();
const emit = defineEmits<{ close: []; claim: [] }>();
</script>

<template>
  <Dialog :title="kind === 'found' ? 'Found item' : 'Lost item'" :subtitle="categoryLabel(card.category)" @close="emit('close')">
    <img v-if="card.photo" class="photo" :src="card.photo" :alt="`${categoryLabel(card.category)}: ${card.description}`" />
    <div v-else class="photo none" :class="kind"><Icon :name="categoryIcon(card.category)" :size="64" /></div>
    <p class="item-title">{{ card.description }}</p>
    <dl class="facts">
      <div>
        <dt>{{ kind === "found" ? "Left in" : "May be in" }}</dt>
        <dd>{{ card.places.map((place) => place.name).join(", ") }}</dd>
      </div>
      <div v-if="card.spot">
        <dt>Spot</dt>
        <dd>{{ card.spot }}</dd>
      </div>
      <div>
        <dt>Reported</dt>
        <dd>{{ mine ? "by you" : `by ${card.username}` }}, {{ timeAgo(card.filedAt) }}</dd>
      </div>
    </dl>
    <button v-if="kind === 'found' && !mine" type="button" class="button primary large" @click="emit('claim')">
      <Icon name="check" :size="18" />This is mine
    </button>
  </Dialog>
</template>

<style scoped>
.photo {
  display: grid;
  place-items: center;
  width: 100%;
  max-height: 50vh;
  min-height: 160px;
  object-fit: contain;
  border-radius: var(--radius-md);
  background: var(--color-line);
}
.photo.none.found {
  background: var(--color-found-soft);
  color: var(--color-found);
}
.photo.none.lost {
  background: var(--color-lost-soft);
  color: var(--color-lost);
}
.item-title {
  font-size: var(--text-xl);
}
.facts {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
}
.facts div {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: var(--space-3);
}
dt {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>

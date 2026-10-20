<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import { categoryIcon, categoryLabel, timeAgo } from "./format.ts";
import ThanksDialog from "./ThanksDialog.vue";
import { type ClaimedCard, type MyClaim, useLostFound } from "./useLostFound.ts";

/**
 * A claimed item. In the Claimed tab it says only that it was claimed and when. When it is my claim, it also says
 * where to pick it up, who found it, and lets me thank them once.
 */
const props = defineProps<{ claim: ClaimedCard; mine?: MyClaim }>();
const { highlight } = useLostFound();
const root = ref<HTMLElement | null>(null);
const thanking = ref(false);

function showIfHighlighted() {
  if (highlight.value === props.claim.report) void nextTick(() => root.value?.scrollIntoView({ block: "center", behavior: "smooth" }));
}
onMounted(showIfHighlighted);
watch(highlight, showIfHighlighted);

const where = computed(() => props.claim.places.map((place) => place.name).join(" · "));
const label = computed(() => `${categoryLabel(props.claim.category)}: ${props.claim.description}`);
</script>

<template>
  <article ref="root" class="card claimed-card" :class="{ highlighted: highlight === claim.report }">
    <img v-if="claim.photo" class="photo" :src="claim.photo" :alt="label" />
    <span v-else class="photo none"><Icon :name="categoryIcon(claim.category)" :size="44" /></span>

    <div class="what">
      <div class="chips">
        <span class="chip claimed"><Icon name="check" :size="12" />Claimed</span>
        <span class="chip">{{ categoryLabel(claim.category) }}</span>
      </div>
      <h3 class="item-title">{{ claim.description }}</h3>
    </div>
    <p class="building"><Icon name="building" :size="16" /><span>{{ where }}</span></p>
    <p class="meta">{{ mine ? "Claimed by you" : "Claimed" }} {{ timeAgo(claim.claimedAt) }}</p>

    <template v-if="mine">
      <div class="pickup">
        <Icon name="pin" :size="18" />
        <p>
          <span>Pick it up at <strong>{{ where.replaceAll(" · ", ", ") }}</strong></span>
          <span v-if="claim.spot">{{ claim.spot }}</span>
          <span class="muted">Found by {{ mine.foundBy }}.</span>
        </p>
      </div>
      <div class="actions">
        <p v-if="mine.thankedAt" class="thanked">
          <Icon name="heart" :size="16" />You thanked {{ mine.foundBy }}<template v-if="mine.thanksNote">: “{{ mine.thanksNote }}”</template>
        </p>
        <button v-else type="button" class="button outline thank" @click="thanking = true">
          <Icon name="heart" :size="16" />Say thanks to {{ mine.foundBy }}
        </button>
      </div>
      <ThanksDialog v-if="thanking" :claim="mine" @close="thanking = false" />
    </template>
  </article>
</template>

<style scoped>
.claimed-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.claimed-card.highlighted {
  outline: 3px solid var(--color-text);
  outline-offset: 2px;
}
.photo {
  display: grid;
  place-items: center;
  width: 100%;
  height: 160px;
  object-fit: cover;
  background: var(--color-claimed-soft);
  color: var(--color-claimed);
  /* A claimed item is finished, so its photo steps back. */
  filter: saturate(0.6);
}
.what {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-4) 0;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}
.building {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: var(--space-3) var(--space-4) 0;
  font-weight: 600;
}
.building :deep(svg) {
  flex: none;
  margin-top: 3px;
}
.meta {
  padding: var(--space-2) var(--space-4) var(--space-4);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.pickup {
  display: flex;
  gap: var(--space-2);
  margin: 0 var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-claimed-soft);
  font-size: var(--text-sm);
}
.pickup :deep(svg) {
  flex: none;
  color: var(--color-claimed);
}
.pickup p {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.actions {
  margin-top: auto;
  padding: var(--space-3) var(--space-4) var(--space-4);
}
.thank {
  width: 100%;
  border-radius: var(--radius-md);
}
.thanked {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}
.thanked :deep(svg) {
  flex: none;
  margin-top: 2px;
}
</style>

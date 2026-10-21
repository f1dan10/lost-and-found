<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useSession } from "../reusable/session.ts";
import Icon from "../reusable/ui/Icon.vue";
import { categoryIcon, categoryLabel, timeAgo } from "./format.ts";
import OwnerActions from "./OwnerActions.vue";
import ReportDetail from "./ReportDetail.vue";
import { type CardLike, useLostFound } from "./useLostFound.ts";

/**
 * One report, in zones read top to bottom: the photo, what it is, where it is, who and when, then what I can do.
 * `mine` is set for my own reports, which have no username; otherwise a card is mine when its username is mine.
 */
const props = defineProps<{ card: CardLike; kind: "found" | "lost"; mine?: boolean }>();
const emit = defineEmits<{ claim: [card: CardLike] }>();
const { me } = useSession();
const { selected } = useLostFound();
const highlighted = computed(() => selected.value?.report === props.card.report);
const root = ref<HTMLElement | null>(null);
const viewing = ref(false);

/** Scrolls the card into view when it is the one being pointed at, such as from a notice. */
function showIfHighlighted() {
  if (highlighted.value) void nextTick(() => root.value?.scrollIntoView({ block: "center", behavior: "smooth" }));
}
onMounted(showIfHighlighted);
watch(highlighted, showIfHighlighted);

const isMine = computed(() => props.mine === true || (props.card.username !== undefined && props.card.username === me.value?.username));
const where = computed(() => props.card.places.map((place) => place.name).join(" · "));
const label = computed(() => `${categoryLabel(props.card.category)}: ${props.card.description}`);
</script>

<template>
  <article ref="root" class="card report" :class="[kind, { highlighted }]">
    <button type="button" class="photo-button" :aria-label="`See details: ${label}`" @click="viewing = true">
      <img v-if="card.photo" class="photo" :src="card.photo" :alt="label" />
      <span v-else class="photo none" :class="kind"><Icon :name="categoryIcon(card.category)" :size="44" /></span>
    </button>

    <div class="what">
      <div class="chips">
        <span class="chip" :class="kind"><Icon :name="kind === 'found' ? 'pin' : 'search'" :size="12" />{{ kind === "found" ? "Found" : "Lost" }}</span>
        <span class="chip">{{ categoryLabel(card.category) }}</span>
        <span v-if="isMine" class="chip mine">Your report</span>
      </div>
      <h3 class="item-title clamp">
        <button type="button" class="title-button" @click="viewing = true">{{ card.description }}</button>
      </h3>
    </div>

    <div class="where">
      <p class="building"><Icon name="building" :size="16" /><span>{{ where }}</span></p>
      <p v-if="card.spot" class="spot"><Icon name="pin" :size="16" /><span>{{ card.spot }}</span></p>
    </div>

    <p class="meta">{{ isMine ? "by you" : `by ${card.username}` }} · {{ timeAgo(card.filedAt) }}</p>

    <div v-if="kind === 'found' && !isMine" class="actions">
      <button type="button" class="button primary claim" @click="emit('claim', card)"><Icon name="check" :size="18" />This is mine</button>
    </div>
    <OwnerActions v-if="isMine" :report="card.report" :kind="kind" :expires-at="card.expiresAt" :description="card.description" />

    <ReportDetail v-if="viewing" :card="card" :kind="kind" :mine="isMine" @close="viewing = false" @claim="viewing = false; emit('claim', card)" />
  </article>
</template>

<style scoped>
.report {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.report.highlighted {
  outline: 3px solid var(--color-text);
  outline-offset: 2px;
}
.photo-button {
  display: block;
  padding: 0;
  border: 0;
  background: none;
  cursor: zoom-in;
}
.photo {
  display: grid;
  place-items: center;
  width: 100%;
  height: 200px;
  object-fit: cover;
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
.chip.mine {
  background: var(--color-text);
  color: var(--color-on-accent);
}
.title-button {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.title-button:hover {
  text-decoration: underline;
}
/* Long descriptions are cut to three lines on the card; the detail shows all of it. */
.clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.where {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-3) var(--space-4) 0;
}
.where p {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  overflow-wrap: anywhere;
}
.where :deep(svg) {
  flex: none;
  margin-top: 3px;
}
.building {
  font-weight: 600;
}
.spot {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
.meta {
  padding: var(--space-2) var(--space-4) var(--space-4);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.actions {
  margin-top: auto;
  padding: 0 var(--space-4) var(--space-4);
}
.claim {
  width: 100%;
  border-radius: var(--radius-md);
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useSession } from "../reusable/session.ts";
import Icon from "../reusable/ui/Icon.vue";
import { categoryIcon, categoryLabel, timeAgo } from "./format.ts";
import OwnerActions from "./OwnerActions.vue";
import type { Row } from "./sections.ts";
import ThanksDialog from "./ThanksDialog.vue";
import { type MyClaim, type ReportId, useLostFound } from "./useLostFound.ts";

/**
 * The right column: the chosen item in full, and the one or two things that can be done with it now. Every action
 * happens here instead of in a dialog, so the list stays in view. Claiming asks first, in place, because the finder
 * sees who claimed; then the panel turns into the claim, with where to pick it up.
 */
const props = defineProps<{ row: Row }>();
const { claim, collect, resolve, working, mine, reporting, justClaimed } = useLostFound();
const { me } = useSession();

/** Whether the person is being asked "Is this yours?" before claiming. */
const confirming = ref(false);
/** Lost reports closed from the offer after a claim. */
const closed = ref<ReportId[]>([]);
const thanking = ref<MyClaim | null>(null);

watch(
  () => props.row.report,
  (now) => {
    confirming.value = false;
    // "It's yours" is shown only while the claimed item stays chosen.
    if (justClaimed.value !== now) justClaimed.value = null;
  },
);

const source = computed(() => props.row.source);
const username = computed(() => me.value?.username ?? null);
/** An open item in Found or Lost that I filed myself. */
const myCard = computed(() => source.value.type === "card" && source.value.card.username === username.value);
const canClaim = computed(() => source.value.type === "card" && props.row.kind === "found" && !myCard.value);
const othersLost = computed(() => source.value.type === "card" && props.row.kind === "lost" && !myCard.value);
/** My report that is still open (or expired and renewable), whichever list it was chosen from. */
const ownOpen = computed(() => {
  const value = source.value;
  if (value.type === "card" && myCard.value) return { report: value.card.report, expiresAt: value.card.expiresAt };
  if (value.type === "mine" && value.report.status === "OPEN") return { report: value.report.report, expiresAt: value.report.expiresAt };
  return null;
});
const myClaim = computed(() => (source.value.type === "claim" ? source.value.claim : null));
const closedReport = computed(() => (source.value.type === "mine" && source.value.report.status !== "OPEN" ? source.value.report : null));

const where = computed(() => props.row.places.map((place) => place.name).join(", "));
const label = computed(() => `${categoryLabel(props.row.category)}: ${props.row.description}`);

/** The facts about the item, as label and value pairs, in the order a person asks them. */
const facts = computed(() => {
  const list: { label: string; value: string }[] = [];
  const value = source.value;
  const claimed = myClaim.value;
  list.push({
    label: claimed ? (claimed.collectedAt ? "Picked up from" : "Pick up at") : props.row.kind === "found" ? "Left in" : "May be in",
    value: where.value,
  });
  if (props.row.spot) list.push({ label: "Spot", value: props.row.spot });
  if (value.type === "card") list.push({ label: "Reported by", value: myCard.value ? "you" : value.card.username });
  if (value.type === "claim") list.push({ label: "Found by", value: value.claim.foundBy });
  if (value.type === "card" || value.type === "mine") list.push({ label: "Reported", value: timeAgo(value.type === "card" ? value.card.filedAt : value.report.filedAt) });
  if (value.type === "claim") list.push({ label: "Claimed", value: timeAgo(value.claim.claimedAt) });
  if (value.type === "returned") list.push({ label: "Claimed", value: timeAgo(value.claim.claimedAt) });
  list.push({ label: "Category", value: categoryLabel(props.row.category) });
  return list;
});

/** My open lost reports of the same category, which the claim probably answers. */
const myLost = computed(() =>
  mine.value.filter(
    (report) => report.status === "OPEN" && report.kind === "LOST" && report.category === props.row.category && !closed.value.includes(report.report),
  ),
);

async function confirmClaim() {
  await claim(props.row.report);
  confirming.value = false;
}

async function closeLost(report: ReportId) {
  if (await resolve(report)) closed.value.push(report);
}
</script>

<template>
  <article class="detail" :aria-label="label">
    <img v-if="row.photo" class="photo" :src="row.photo" :alt="label" />
    <div v-else class="photo none" :class="row.kind" aria-hidden="true"><Icon :name="categoryIcon(row.category)" :size="56" /></div>

    <h2 class="item-title">{{ row.description }}</h2>

    <dl class="facts">
      <div v-for="fact in facts" :key="fact.label">
        <dt>{{ fact.label }}</dt>
        <dd>{{ fact.value }}</dd>
      </div>
    </dl>

    <!-- Someone else's found item: claim it, after a question -->
    <template v-if="canClaim">
      <div v-if="confirming" class="ask" role="group" aria-label="Confirm claim">
        <p><strong>Is this yours?</strong> {{ row.person }} will see your username, and you'll see where to pick it up.</p>
        <div class="buttons">
          <button type="button" class="button outline" @click="confirming = false">Cancel</button>
          <button type="button" class="button primary" :disabled="working" @click="confirmClaim">Yes, it's mine</button>
        </div>
      </div>
      <button v-else type="button" class="button primary large" @click="confirming = true"><Icon name="check" :size="18" />This is mine</button>
    </template>

    <!-- Someone else's lost item: report it as found -->
    <div v-else-if="othersLost" class="note">
      <p>Seen it? Report it as found, in the building where it is, and {{ row.person }} is told.</p>
      <button type="button" class="button outline" @click="reporting = 'found'"><Icon name="pin" :size="16" />Report it as found</button>
    </div>

    <!-- My own open report -->
    <OwnerActions
      v-else-if="ownOpen"
      class="owner"
      :report="ownOpen.report"
      :kind="row.kind"
      :expires-at="ownOpen.expiresAt"
      :description="row.description"
    />

    <!-- An item I claimed -->
    <template v-else-if="myClaim">
      <p v-if="justClaimed === row.report && !myClaim.collectedAt" class="success" role="status"><Icon name="check" :size="18" /><strong>It's yours.</strong> Here's where to get it.</p>
      <div v-if="!myClaim.collectedAt" class="pickup">
        <Icon name="pin" :size="20" />
        <p>
          <span>Pick it up at <strong>{{ where }}</strong></span>
          <span v-if="row.spot">{{ row.spot }}</span>
          <span class="muted">Found by {{ myClaim.foundBy }}</span>
        </p>
      </div>
      <div v-for="lost in justClaimed === row.report && !myClaim.collectedAt ? myLost : []" :key="lost.report" class="offer">
        <p>Close your lost report <strong>“{{ lost.description }}”</strong>? Nobody will send you matches for it anymore.</p>
        <button type="button" class="button outline" :disabled="working" @click="closeLost(lost.report)">Close it</button>
      </div>
      <p v-if="myClaim.collectedAt" class="done"><Icon name="check" :size="16" />You picked it up {{ timeAgo(myClaim.collectedAt) }}.</p>
      <button v-else type="button" class="button primary large" :disabled="working" @click="collect(row.report, myClaim.foundBy)">
        <Icon name="check" :size="18" />I picked it up
      </button>
      <p v-if="myClaim.thankedAt" class="done">
        <Icon name="heart" :size="16" /><span>You thanked {{ myClaim.foundBy }}<template v-if="myClaim.thanksNote">: “{{ myClaim.thanksNote }}”</template></span>
      </p>
      <button v-else type="button" class="button outline" @click="thanking = myClaim"><Icon name="heart" :size="16" />Say thanks to {{ myClaim.foundBy }}</button>
    </template>

    <!-- One of my reports that is finished -->
    <div v-else-if="closedReport" class="outcome">
      <template v-if="closedReport.claimedBy">
        <p><Icon name="check" :size="16" />Claimed by <strong>{{ closedReport.claimedBy }}</strong>.</p>
        <p v-if="closedReport.collectedAt" class="muted">Picked up {{ timeAgo(closedReport.collectedAt) }}.</p>
        <p v-else class="muted">Not picked up yet.</p>
        <p v-if="closedReport.thankedAt" class="thanks">
          <Icon name="heart" :size="16" /><span>{{ closedReport.claimedBy }} thanked you<template v-if="closedReport.thanksNote">: “{{ closedReport.thanksNote }}”</template></span>
        </p>
      </template>
      <p v-else-if="closedReport.status === 'WITHDRAWN'"><Icon name="close" :size="16" />You removed this report.</p>
      <p v-else-if="closedReport.kind === 'LOST'"><Icon name="check" :size="16" />You said you got it back.</p>
      <p v-else><Icon name="check" :size="16" />You closed this report.</p>
    </div>

    <!-- Someone else's item that was claimed -->
    <p v-else-if="row.source.type === 'returned'" class="note muted">
      This item is back with its owner. Only the finder and the person who claimed it see who that is.
    </p>

    <ThanksDialog v-if="thanking" :claim="thanking" @close="thanking = null" />
  </article>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-5) var(--space-8);
}
.photo {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-lg);
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
  grid-template-columns: 116px minmax(0, 1fr);
  gap: var(--space-3);
}
dt {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.large {
  width: 100%;
}
.ask,
.note,
.offer,
.outcome {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-page);
}
.ask {
  border-color: var(--color-text);
}
.buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
.note .button {
  align-self: flex-start;
}
.owner {
  margin: 0 calc(-1 * var(--space-5));
}
.success {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-text);
  color: var(--color-on-accent);
}
.pickup {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-claimed-soft);
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
.offer p {
  font-size: var(--text-sm);
}
.offer .button {
  align-self: flex-start;
}
.done,
.outcome p,
.thanks {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}
.done {
  color: var(--color-text-muted);
}
.done :deep(svg),
.outcome :deep(svg) {
  flex: none;
  margin-top: 3px;
}
</style>

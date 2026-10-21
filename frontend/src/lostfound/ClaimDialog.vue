<script setup lang="ts">
import { computed, ref } from "vue";
import { useSession } from "../reusable/session.ts";
import Dialog from "../reusable/ui/Dialog.vue";
import Icon from "../reusable/ui/Icon.vue";
import { categoryLabel } from "./format.ts";
import { type CardLike, useLostFound } from "./useLostFound.ts";

/**
 * Asks before claiming, because the finder sees who claimed. Once the claim is accepted the dialog says where to
 * pick the item up, and offers to close my own open lost report of the same category, which the claim made
 * unnecessary. A refusal closes the dialog and shows in the page's banner, and the lists are already refreshed.
 */
const props = defineProps<{ card: CardLike }>();
const emit = defineEmits<{ close: [] }>();
const { claim, resolve, working, reports, show } = useLostFound();
const { me } = useSession();
const claimed = ref(false);
const closed = ref<string[]>([]);

const where = computed(() => props.card.places.map((place) => place.name).join(", "));
/** My open lost reports of the same category, which this find probably answers. */
const myLost = computed(() =>
  reports.value.lost.filter(
    (card) => card.username === me.value?.username && card.category === props.card.category && !closed.value.includes(card.report),
  ),
);

async function confirm() {
  if (await claim(props.card.report)) claimed.value = true;
  else emit("close");
}

async function closeLost(report: CardLike["report"]) {
  if (await resolve(report)) closed.value.push(report);
}

function seeMyClaims() {
  show("claims", props.card.report);
  emit("close");
}
</script>

<template>
  <Dialog v-if="!claimed" title="Is this yours?" :subtitle="`${categoryLabel(card.category)}: ${card.description}`" @close="emit('close')">
    <p class="ask">
      Claim it only if it's yours. {{ card.username }} will see your username, and you'll be told where to pick it up.
    </p>
    <div class="buttons">
      <button type="button" class="button outline" @click="emit('close')">Cancel</button>
      <button type="button" class="button primary" :disabled="working" @click="confirm">Yes, it's mine</button>
    </div>
  </Dialog>

  <Dialog v-else title="It's yours" :subtitle="`${categoryLabel(card.category)}: ${card.description}`" @close="emit('close')">
    <div class="pickup">
      <Icon name="pin" :size="22" />
      <p>
        <span>Pick it up at <strong>{{ where }}</strong></span>
        <span v-if="card.spot">{{ card.spot }}</span>
        <span class="muted">Found by {{ card.username }}. These details stay under Yours.</span>
      </p>
    </div>
    <div v-for="lost in myLost" :key="lost.report" class="close-lost">
      <p>Close your lost report <strong>“{{ lost.description }}”</strong>? Nobody will be told about matches for it anymore.</p>
      <button type="button" class="button outline" :disabled="working" @click="closeLost(lost.report)">Close it</button>
    </div>
    <div class="buttons">
      <button type="button" class="button outline" @click="seeMyClaims">See my claims</button>
      <button type="button" class="button primary" @click="emit('close')">Done</button>
    </div>
  </Dialog>
</template>

<style scoped>
.ask {
  color: var(--color-text-muted);
}
.buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
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
.close-lost {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.close-lost p {
  flex: 1 1 220px;
  font-size: var(--text-sm);
}
</style>

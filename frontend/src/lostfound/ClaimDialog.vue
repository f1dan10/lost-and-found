<script setup lang="ts">
import Dialog from "../reusable/ui/Dialog.vue";
import { categoryLabel } from "./format.ts";
import { type Card, useLostFound } from "./useLostFound.ts";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ close: [] }>();
const { claim, working } = useLostFound();

/**
 * Claims the report. Whatever the answer, the dialog closes: a refusal such as NOT_FOUND or CONFLICT is
 * shown in the page's banner, and `claim` has already refreshed the lists, which no longer show the item.
 */
async function confirm() {
  await claim(props.card.report);
  emit("close");
}
</script>

<template>
  <Dialog title="Claim this item?" :subtitle="`${categoryLabel(card.category)}: ${card.description}`" @close="emit('close')">
    <p class="ask">Your username will be shown to the finder.</p>
    <div class="buttons">
      <button type="button" class="button outline" @click="emit('close')">Cancel</button>
      <button type="button" class="button primary" :disabled="working" @click="confirm">Claim</button>
    </div>
  </Dialog>
</template>

<style scoped>
.ask {
  padding: var(--space-2) var(--space-6) var(--space-4);
  color: var(--color-text-muted);
}
.buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: 0 var(--space-6) var(--space-6);
}
</style>

<script setup lang="ts">
import { computed, ref } from "vue";
import Dialog from "../reusable/ui/Dialog.vue";
import Icon from "../reusable/ui/Icon.vue";
import { daysLeft, expiryLabel } from "./expiry.ts";
import { type ReportId, useLostFound } from "./useLostFound.ts";

/**
 * What the person who filed an open report can do with it, in one footer so the actions read as a group:
 * keep it up for two more weeks, close it because the item is back, or remove it. Removing asks first.
 */
const props = defineProps<{ report: ReportId; kind: "found" | "lost"; expiresAt: string; description: string }>();
const { withdraw, resolve, renew, working } = useLostFound();
const removing = ref(false);

const left = computed(() => daysLeft(props.expiresAt));
const label = computed(() => expiryLabel(props.expiresAt));
/** The last three days are worth noticing; before that the expiry is quiet. */
const soon = computed(() => left.value <= 3);

async function confirmRemove() {
  await withdraw(props.report);
  removing.value = false;
}
</script>

<template>
  <div class="owner" role="group" aria-label="Your report">
    <p class="expiry" :class="{ soon }">
      <Icon name="clock" :size="15" />{{ label }}
      <span v-if="!soon" class="muted">· renew to keep it up</span>
    </p>
    <div class="buttons">
      <button type="button" class="button outline" :disabled="working" @click="renew(report)">
        {{ kind === "lost" ? "Still looking" : "Still there" }}
      </button>
      <button v-if="kind === 'lost'" type="button" class="button outline" :disabled="working" @click="resolve(report)">
        <Icon name="check" :size="16" />I got it back
      </button>
      <button type="button" class="button outline remove" :disabled="working" @click="removing = true">Remove</button>
    </div>
    <Dialog v-if="removing" title="Remove this report?" :subtitle="description" @close="removing = false">
      <p class="explain">
        It leaves the {{ kind === "lost" ? "Lost" : "Found" }} list and the map, and nobody can
        {{ kind === "lost" ? "match it to a found item" : "claim it" }} anymore. You can't undo this.
      </p>
      <div class="confirm">
        <button type="button" class="button outline" @click="removing = false">Keep it</button>
        <button type="button" class="button danger" :disabled="working" @click="confirmRemove">Remove report</button>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.owner {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4) var(--space-4);
  border-top: 1px solid var(--color-border);
  background: var(--color-page);
}
.expiry {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-sm);
  font-weight: 600;
}
.expiry.soon {
  color: var(--color-lost);
}
.expiry .muted {
  font-weight: 400;
}
.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.buttons .button {
  flex: 1 1 auto;
}
.remove {
  color: var(--color-danger);
}
.explain {
  color: var(--color-text-muted);
}
.confirm {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>

<script setup lang="ts">
import { ref } from "vue";
import Dialog from "../reusable/ui/Dialog.vue";
import { type MyClaim, useLostFound } from "./useLostFound.ts";

/** Thanks the finder once, with an optional short note; a preset fills the note in one tap. */
const props = defineProps<{ claim: MyClaim }>();
const emit = defineEmits<{ close: [] }>();
const { thank, working } = useLostFound();

const MAX_NOTE = 140;
const PRESETS = ["Thank you so much!", "You saved my day!", "Thanks for leaving it somewhere safe."];
const note = ref("");
const refusal = ref<string | null>(null);

async function send() {
  if (note.value.trim().length > MAX_NOTE) {
    refusal.value = "Keep the note under 140 characters.";
    return;
  }
  if (await thank(props.claim.report, note.value)) emit("close");
  else refusal.value = "That didn't go through. The message at the top of the page says why.";
}
</script>

<template>
  <Dialog :title="`Thank ${claim.foundBy}`" :subtitle="claim.description" @close="emit('close')">
    <form class="form" novalidate @submit.prevent="send">
      <div class="presets" role="group" aria-label="Quick notes">
        <button v-for="preset in PRESETS" :key="preset" type="button" class="filter" :class="{ on: note === preset }" @click="note = preset">
          {{ preset }}
        </button>
      </div>
      <label class="field">
        Note <span class="hint">Optional. {{ claim.foundBy }} sees it with their report.</span>
        <textarea v-model="note" rows="3" :maxlength="MAX_NOTE" placeholder="Write a few words, or send thanks without a note." />
        <span class="hint counter">{{ note.length }} / {{ MAX_NOTE }}</span>
      </label>
      <p v-if="refusal" class="refusal" role="alert">{{ refusal }}</p>
      <button type="submit" class="button primary large" :disabled="working">
        {{ working ? "Sending…" : "Send thanks" }}
      </button>
    </form>
  </Dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.counter {
  align-self: flex-end;
}
</style>

<script setup lang="ts">
import { computed, ref } from "vue";
import Dialog from "../reusable/ui/Dialog.vue";
import Icon from "../reusable/ui/Icon.vue";
import { CATEGORIES, categoryLabel } from "./format.ts";
import { shrinkPhoto } from "./photo.ts";
import { type FileInput, useLostFound } from "./useLostFound.ts";

const props = defineProps<{ kind: "found" | "lost" }>();
const emit = defineEmits<{ close: [] }>();
const { places, working, tab, highlight, fileReport, showToast } = useLostFound();

const MAX_DESCRIPTION = 500;
const MAX_SPOT = 100;
const MAX_PLACES = 12;

const category = ref("");
const description = ref("");
/** One building for a found item. */
const building = ref("");
/** Up to 12 buildings for a lost item. */
const buildings = ref<string[]>([]);
const spot = ref("");
const photo = ref<string | null>(null);
const refusal = ref<string | null>(null);

const lost = computed(() => props.kind === "lost");
/** Buildings in the order people expect: Building 2 before Building 10. */
const sorted = computed(() => [...places.value].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
const chosen = computed(() => (lost.value ? buildings.value : building.value ? [building.value] : []));
const atMost = computed(() => buildings.value.length >= MAX_PLACES);

/** The first thing wrong with the form, using the same limits as the server. */
const problem = computed(() => {
  if (!category.value) return "Pick a category.";
  const length = description.value.trim().length;
  if (length < 1 || description.value.length > MAX_DESCRIPTION) return "Write a description of 1 to 500 characters.";
  if (chosen.value.length < 1) return lost.value ? "Choose at least one building." : "Choose a building.";
  if (chosen.value.length > MAX_PLACES) return "Choose at most 12 buildings.";
  if (spot.value.trim().length > MAX_SPOT) return "A spot can have at most 100 characters.";
  return null;
});

async function choosePhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    photo.value = await shrinkPhoto(file);
    refusal.value = null;
  } catch (error) {
    refusal.value = error instanceof Error ? error.message : "That photo can't be used.";
  }
}

async function submit() {
  if (problem.value) {
    refusal.value = problem.value;
    return;
  }
  const request = {
    kind: props.kind.toUpperCase(),
    category: category.value,
    description: description.value,
    places: chosen.value,
    ...(photo.value ? { photo: photo.value } : {}),
    ...(spot.value.trim() ? { spot: spot.value.trim() } : {}),
  } as FileInput;
  const result = await fileReport(request);
  if ("error" in result) {
    // Keep what the person typed, and say what went wrong.
    refusal.value = result.error;
    return;
  }
  tab.value = props.kind;
  highlight.value = result.report;
  const what = categoryLabel(category.value).toLowerCase();
  if (lost.value) showToast(`Posted. You'll be told when someone finds a ${what} in one of your buildings.`);
  else {
    const name = places.value.find((place) => place.place === building.value)?.name ?? "that building";
    showToast(`Posted. Anyone who lost a ${what} in ${name} will be told.`);
  }
  emit("close");
}
</script>

<template>
  <Dialog :title="lost ? 'Report something you lost' : 'Report something you found'" :subtitle="lost ? 'You are told when someone finds a match in one of your buildings.' : 'Leave the item where it is. Its owner will come to it.'" @close="emit('close')">
    <form class="form" novalidate @submit.prevent="submit">
      <label class="field">
        Category
        <select v-model="category" required>
          <option value="" disabled>Pick a category</option>
          <option v-for="entry in CATEGORIES" :key="entry.value" :value="entry.value">{{ entry.label }}</option>
        </select>
      </label>

      <label class="field">
        Description
        <textarea v-model="description" rows="3" :maxlength="MAX_DESCRIPTION" required />
        <span class="hint counter">{{ description.length }} / {{ MAX_DESCRIPTION }}</span>
      </label>

      <fieldset v-if="lost" class="field">
        <legend>Buildings <span class="hint">Where it may have been. {{ MAX_PLACES }} at most.</span></legend>
        <div class="checks">
          <label v-for="place in sorted" :key="place.place" class="check">
            <input
              v-model="buildings"
              type="checkbox"
              :value="place.place"
              :aria-label="place.name"
              :disabled="atMost && !buildings.includes(place.place)"
            />
            {{ place.name }}
          </label>
        </div>
      </fieldset>
      <label v-else class="field">
        Building
        <select v-model="building" required>
          <option value="" disabled>Where you left it</option>
          <option v-for="place in sorted" :key="place.place" :value="place.place">{{ place.name }}</option>
        </select>
      </label>

      <label class="field">
        Spot <span class="hint">Optional</span>
        <input v-model="spot" :maxlength="MAX_SPOT" placeholder="By the lobby bench" />
      </label>

      <div class="field">
        Photo <span class="hint">Optional</span>
        <div v-if="photo" class="preview">
          <img :src="photo" alt="Chosen photo" />
          <button type="button" class="button outline" @click="photo = null">Remove</button>
        </div>
        <label v-else class="button outline pick">
          <Icon name="camera" :size="16" />Take or choose a photo
          <input class="file" type="file" accept="image/*" capture="environment" @change="choosePhoto" />
        </label>
      </div>

      <p v-if="refusal" class="refusal" role="alert">{{ refusal }}</p>
      <button type="submit" class="button primary large" :disabled="working">
        {{ working ? "Posting…" : lost ? "Post lost item" : "Post found item" }}
      </button>
    </form>
  </Dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-6) var(--space-6);
  overflow-y: auto;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  border: 0;
  padding: 0;
}
.hint {
  font-size: var(--text-xs);
  font-weight: 400;
  color: var(--color-text-muted);
}
.counter {
  align-self: flex-end;
}
.checks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 6px 12px;
  max-height: 220px;
  overflow-y: auto;
}
/* A whole row is the target, not just the box (Fitts's law). */
.check {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  font-weight: 400;
  cursor: pointer;
}
.check:hover {
  background: var(--color-line);
}
.check input {
  width: 18px;
  height: 18px;
}
.preview {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.preview img {
  max-width: 160px;
  max-height: 120px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}
.pick {
  position: relative;
  align-self: flex-start;
  cursor: pointer;
}
/* Hidden from sight but still reachable by keyboard; the label around it shows the focus. */
.file {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.pick:focus-within {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}
</style>

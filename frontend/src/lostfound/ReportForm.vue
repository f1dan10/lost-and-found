<script setup lang="ts">
import { computed, ref } from "vue";
import Dialog from "../reusable/ui/Dialog.vue";
import Icon from "../reusable/ui/Icon.vue";
import BuildingPicker from "./BuildingPicker.vue";
import { CATEGORIES, categoryLabel } from "./format.ts";
import { shrinkPhoto } from "./photo.ts";
import { type FileInput, useLostFound } from "./useLostFound.ts";

/**
 * Reporting something, laid out to fit a laptop screen without scrolling: what it is (category chips and a
 * description), where it is (buildings by search, and an optional spot), then an optional photo beside the button.
 */
const props = defineProps<{ kind: "found" | "lost" }>();
const emit = defineEmits<{ close: [] }>();
const { places, working, show, fileReport, showToast } = useLostFound();

const MAX_DESCRIPTION = 500;
const MAX_SPOT = 100;
const MAX_PLACES = 12;

const category = ref("");
const description = ref("");
/** One building for a found item, up to 12 for a lost one. */
const buildings = ref<string[]>([]);
const spot = ref("");
const photo = ref<string | null>(null);
const refusal = ref<string | null>(null);

const lost = computed(() => props.kind === "lost");
/** Buildings in the order people expect: Building 2 before Building 10. */
const sorted = computed(() => [...places.value].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));

/** The first thing wrong with the form, using the same limits as the server. */
const problem = computed(() => {
  if (!category.value) return "Pick what kind of thing it is.";
  const length = description.value.trim().length;
  if (length < 1 || description.value.length > MAX_DESCRIPTION) return "Describe it in 1 to 500 characters.";
  if (buildings.value.length < 1) return lost.value ? "Add at least one building it may be in." : "Add the building you left it in.";
  if (buildings.value.length > MAX_PLACES) return "Add at most 12 buildings.";
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
    places: buildings.value,
    ...(photo.value ? { photo: photo.value } : {}),
    ...(spot.value.trim() ? { spot: spot.value.trim() } : {}),
  } as FileInput;
  const result = await fileReport(request);
  if ("error" in result) {
    // Keep what the person typed, and say what went wrong.
    refusal.value = result.error;
    return;
  }
  show(props.kind, result.report);
  const what = categoryLabel(category.value).toLowerCase();
  if (lost.value) showToast(`Posted. You'll be told when someone finds a ${what} in one of your buildings.`);
  else {
    const name = places.value.find((place) => place.place === buildings.value[0])?.name ?? "that building";
    showToast(`Posted. Anyone who lost a ${what} in ${name} will be told.`);
  }
  emit("close");
}
</script>

<template>
  <Dialog
    wide
    :title="lost ? 'Report something you lost' : 'Report something you found'"
    :subtitle="lost ? 'You are told when someone finds a match in one of your buildings.' : 'Leave the item where it is. Its owner will come to it.'"
    @close="emit('close')"
  >
    <form class="form" novalidate @submit.prevent="submit">
      <fieldset class="field">
        <legend>What is it?</legend>
        <div class="categories">
          <button
            v-for="entry in CATEGORIES"
            :key="entry.value"
            type="button"
            class="category"
            :class="{ on: category === entry.value }"
            :aria-pressed="category === entry.value"
            @click="category = entry.value"
          >
            <Icon :name="entry.icon" :size="18" />{{ entry.label }}
          </button>
        </div>
      </fieldset>

      <label class="field">
        <span class="label-row">Description <span class="hint">{{ description.length }} / {{ MAX_DESCRIPTION }}</span></span>
        <textarea
          v-model="description"
          rows="2"
          :maxlength="MAX_DESCRIPTION"
          :placeholder="lost ? 'Pink water bottle with a cat sticker' : 'Pink Hydro Flask with a cat sticker'"
          required
        />
      </label>

      <div class="where">
        <div class="field">
          <label class="label-row" for="report-buildings">
            {{ lost ? "Buildings" : "Building" }}
            <span class="hint">{{ lost ? `Where it may be, up to ${MAX_PLACES}` : "Where you left it" }}</span>
          </label>
          <BuildingPicker v-model="buildings" input-id="report-buildings" :places="sorted" :max="lost ? MAX_PLACES : 1" />
        </div>
        <label class="field">
          <span class="label-row">Spot <span class="hint">Optional</span></span>
          <input v-model="spot" :maxlength="MAX_SPOT" :placeholder="lost ? 'Probably the 2nd floor lounge' : 'By the lobby bench'" />
        </label>
      </div>

      <p v-if="refusal" class="refusal" role="alert">{{ refusal }}</p>

      <div class="finish">
        <div v-if="photo" class="preview">
          <img :src="photo" alt="Chosen photo" />
          <button type="button" class="button outline" @click="photo = null">Remove photo</button>
        </div>
        <label v-else class="button outline pick">
          <Icon name="camera" :size="18" />Add a photo <span class="hint">optional</span>
          <input class="file" type="file" accept="image/*" @change="choosePhoto" />
        </label>
        <button type="submit" class="button primary large post" :disabled="working">
          {{ working ? "Posting…" : lost ? "Post lost item" : "Post found item" }}
        </button>
      </div>
    </form>
  </Dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  font-size: var(--text-sm);
  font-weight: 600;
}
legend {
  margin-bottom: 8px;
  padding: 0;
}
.label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}
.hint {
  font-size: var(--text-xs);
  font-weight: 400;
  color: var(--color-text-muted);
}
.categories {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.category {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: var(--tap);
  padding: 0 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  font-weight: 600;
}
.category.on {
  border-color: var(--color-text);
  background: var(--color-text);
  color: var(--color-on-accent);
}
textarea {
  min-height: 72px;
}
/* Where it is: the buildings and the spot side by side, since they answer the same question. */
.where {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: var(--space-4);
  align-items: start;
}
.finish {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}
.post {
  flex: 1 1 200px;
}
.preview {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.preview img {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}
.pick {
  position: relative;
  cursor: pointer;
}
.pick .hint {
  margin-left: 2px;
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

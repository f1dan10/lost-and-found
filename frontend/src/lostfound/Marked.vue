<script setup lang="ts">
import { computed } from "vue";
import { marks } from "./search.ts";

/** Text with the words that match the search highlighted, so a person can see why a row matched. */
const props = defineProps<{ text: string; query: string }>();
const parts = computed(() => marks(props.text, props.query));
</script>

<template>
  <template v-for="(part, index) in parts" :key="index"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template>
</template>

<style scoped>
mark {
  padding: 0 1px;
  border-radius: 3px;
  background: #fde68a;
  color: inherit;
}
</style>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import { useLostFound } from "./useLostFound.ts";

/**
 * One search box for the whole app. It filters the section on screen as you type, and the sidebar counts show
 * where else it matches. Press / anywhere to jump to it (a shortcut for experienced users); Esc clears it.
 */
const { query } = useLostFound();
const input = ref<HTMLInputElement | null>(null);

/** "/" focuses the box, unless the person is already typing somewhere. */
function shortcut(event: KeyboardEvent) {
  if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
  const target = event.target as HTMLElement | null;
  if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
  if (document.querySelector("dialog[open]")) return;
  event.preventDefault();
  input.value?.focus();
}

function escape() {
  if (query.value) query.value = "";
  else input.value?.blur();
}

onMounted(() => document.addEventListener("keydown", shortcut));
onUnmounted(() => document.removeEventListener("keydown", shortcut));
</script>

<template>
  <div class="search" role="search">
    <Icon name="search" :size="20" />
    <label for="app-search" class="sr-only">Search items, buildings or people</label>
    <input
      id="app-search"
      ref="input"
      v-model="query"
      type="search"
      autocomplete="off"
      spellcheck="false"
      placeholder="Search items, buildings or people"
      @keydown.escape.prevent="escape"
    />
    <button v-if="query" type="button" class="clear" aria-label="Clear search" @click="query = ''; input?.focus()">
      <Icon name="close" :size="16" />
    </button>
    <kbd v-else aria-hidden="true">/</kbd>
  </div>
</template>

<style scoped>
.search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 560px;
  min-height: var(--tap);
  padding: 0 8px 0 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-page);
  color: var(--color-text-muted);
}
.search:focus-within {
  border-color: var(--color-text);
  background: var(--color-surface);
  color: var(--color-text);
}
input {
  flex: 1;
  min-width: 0;
  height: 40px;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: var(--text-base);
}
input::-webkit-search-cancel-button {
  display: none;
}
kbd {
  padding: 1px 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
}
.clear {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-muted);
}
.clear:hover {
  background: var(--color-line);
  color: var(--color-text);
}
</style>

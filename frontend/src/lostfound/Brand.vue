<script setup lang="ts">
import Icon from "../reusable/ui/Icon.vue";

/**
 * The app's name as a wordmark: the heading serif at display size, with an italic ampersand joining the two halves
 * of the app, and a short line saying whose lost-and-found it is. `large` is for the sign-in screen.
 */
defineProps<{ large?: boolean }>();
</script>

<template>
  <span class="brand" :class="{ large }">
    <span class="logo" aria-hidden="true"><Icon name="logo" :size="large ? 30 : 24" /></span>
    <span class="words">
      <span class="name">Lost<span class="amp">&amp;</span>Found</span>
      <span class="tagline">The MIT campus lost and found</span>
    </span>
  </span>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-on-accent);
}
.words {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}
.name {
  font-family: var(--font-heading);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.amp {
  margin: 0 0.04em;
  font-style: italic;
  font-weight: 500;
  color: var(--color-text-muted);
}
.tagline {
  margin-top: 3px;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.large {
  flex-direction: column;
  gap: 16px;
  text-align: center;
}
.large .logo {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);
}
.large .name {
  font-size: 2.5rem;
}
.large .tagline {
  margin-top: 6px;
  font-size: var(--text-sm);
}
</style>

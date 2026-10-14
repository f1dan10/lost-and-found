<script setup lang="ts">
/** Line icons, each drawn as the paths of a 24×24 outline. */
const paths = {
  logo: [
    "M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0",
    "m20 20-3.5-3.5",
    "M8.5 11.5l1.8 1.8 3.2-3.6",
  ],
  plus: ["M12 5v14M5 12h14"],
  bell: ["M6 16V11a6 6 0 0 1 12 0v5l2 2H4z", "M10 20a2 2 0 0 0 4 0"],
  camera: [
    "M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z",
    "M9 13a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  ],
  check: ["m5 12.5 4.5 4.5L19 7.5"],
  pin: ["M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z", "M9.5 9.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0"],
  building: ["M5 21V4h9v17", "M14 9h5v12", "M3 21h18", "M8 8h2M8 12h2M8 16h2"],
  close: ["M6 6l12 12M18 6 6 18"],
  more: ["M5 12h.01M12 12h.01M19 12h.01"],
} as const;

export type IconName = keyof typeof paths;

withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 18 });
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="name === 'more' ? 3.5 : 1.9"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="d in paths[name]" :key="d" :d="d" />
  </svg>
</template>

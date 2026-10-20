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
  search: ["M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0", "m20 20-3.5-3.5"],
  building: ["M5 21V4h9v17", "M14 9h5v12", "M3 21h18", "M8 8h2M8 12h2M8 16h2"],
  bottle: ["M10 3h4v3l1.5 2.5V20a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V8.5L10 6z", "M8.5 12h7"],
  clothing: ["M8 4 3 7l2 4 3-1v10h8V10l3 1 2-4-5-3a4 4 0 0 1-8 0z"],
  electronics: ["M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z", "M11 18h2"],
  keys: ["M3 15a4 4 0 1 0 8 0a4 4 0 1 0-8 0", "m10 12 9-9", "m16 6 3 3"],
  bag: ["M5 8h14l1 12H4z", "M9 8V6a3 3 0 0 1 6 0v2"],
  jewelry: ["M6 15a6 6 0 1 0 12 0a6 6 0 1 0-12 0", "m9 7 3-4 3 4"],
  other: ["M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7", "M12 17h.01"],
  close: ["M6 6l12 12M18 6 6 18"],
  clock: ["M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0", "M12 7v5l3 2"],
  map: ["M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z", "M9 4v14", "M15 6v14"],
  list: ["M9 6h11M9 12h11M9 18h11", "M4.5 6h.01M4.5 12h.01M4.5 18h.01"],
  heart: ["M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"],
  user: ["M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0", "M4 20a8 8 0 0 1 16 0"],
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

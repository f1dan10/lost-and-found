<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useLostFound } from "./lostfound/useLostFound.ts";

const { startPolling, reset } = useLostFound();

onMounted(startPolling);
// Leaving the page means signing out or a session that ended: stop polling and forget the lists.
onUnmounted(reset);
</script>

<template>
  <section class="page">
    <p class="muted">Nothing here yet.</p>
  </section>
</template>

<style scoped>
.page {
  max-width: 1168px;
  margin: 0 auto;
}
</style>

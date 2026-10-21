<script setup lang="ts">
import { onMounted } from "vue";
import AppShell from "./AppShell.vue";
import Brand from "./lostfound/Brand.vue";
import PasswordForm from "./reusable/PasswordForm.vue";
import SignIn from "./reusable/SignIn.vue";
import { useSession } from "./reusable/session.ts";

const { me, checked, load } = useSession();

onMounted(load);
</script>

<template>
  <template v-if="checked">
    <AppShell v-if="me" />
    <main v-else class="welcome">
      <Brand large />
      <SignIn icon="logo" lead="Find what you lost. Report what you found.">
        <PasswordForm />
      </SignIn>
    </main>
  </template>
</template>

<style scoped>
.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-12) var(--space-6);
}
/* The wordmark above already shows the logo, so the sign-in card doesn't repeat it. */
.welcome :deep(.form-card) {
  margin-top: var(--space-8);
}
.welcome :deep(.form-card > .logo) {
  display: none;
}
</style>

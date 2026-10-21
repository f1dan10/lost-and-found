<script setup lang="ts">
import { onMounted } from "vue";
import LostFoundPage from "./LostFoundPage.vue";
import Brand from "./lostfound/Brand.vue";
import NotificationBell from "./lostfound/NotificationBell.vue";
import PasswordForm from "./reusable/PasswordForm.vue";
import SignIn from "./reusable/SignIn.vue";
import { useSession } from "./reusable/session.ts";
import Avatar from "./reusable/ui/Avatar.vue";
import Menu from "./reusable/ui/Menu.vue";

const { me, checked, load, signOut } = useSession();

onMounted(load);
</script>

<template>
  <header v-if="me" class="topbar">
    <Brand />
    <div class="actions">
      <NotificationBell />
      <Menu label="Account">
        <template #button><Avatar :username="me.username" :size="44" /></template>
        <p class="signed-in">Signed in as <strong>{{ me.username }}</strong></p>
        <button type="button" @click="signOut">Sign out</button>
      </Menu>
    </div>
  </header>
  <main v-if="checked" class="content">
    <LostFoundPage v-if="me" />
    <div v-else class="welcome">
      <Brand large />
      <SignIn icon="logo" lead="Find what you lost. Report what you found.">
        <PasswordForm />
      </SignIn>
    </div>
  </main>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  max-width: 1168px;
  margin: 0 auto;
  padding: 20px 24px 12px;
}
.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: var(--space-12);
}
/* The wordmark above already shows the logo, so the sign-in card doesn't repeat it. */
.welcome :deep(.form-card) {
  margin-top: var(--space-8);
}
.welcome :deep(.form-card > .logo) {
  display: none;
}
.actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.signed-in {
  padding: 8px 10px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.signed-in strong {
  color: var(--color-text);
}
.content {
  padding: var(--space-2) var(--space-6) var(--space-12);
}
@media (max-width: 600px) {
  .topbar {
    padding: 14px 16px;
  }
  .content {
    padding: var(--space-1) var(--space-4) var(--space-8);
  }
}
</style>

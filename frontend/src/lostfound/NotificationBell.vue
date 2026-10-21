<script setup lang="ts">
import { computed } from "vue";
import Icon from "../reusable/ui/Icon.vue";
import Menu from "../reusable/ui/Menu.vue";
import { categoryLabel, timeAgo } from "./format.ts";
import { useSession } from "../reusable/session.ts";
import { sectionOf } from "./sections.ts";
import { type Notification, useLostFound } from "./useLostFound.ts";

const { lists, notifications, show, markRead, working } = useLostFound();
const { me } = useSession();

const count = computed(() => notifications.value.length);
const badge = computed(() => (count.value > 9 ? "9+" : String(count.value)));

/**
 * Opens the notice: marks it read, then shows the section where the report it is about lives now and chooses it.
 * A match opens Found; a claim, a thank-you or a pickup of my report opens History; an item I claimed opens Waiting on
 * you. A notice about a report that is in no section only shows its text.
 */
async function open(notice: Notification) {
  const where = sectionOf(notice.subject, lists.value, me.value?.username ?? null);
  if (where) show(where, notice.subject);
  await markRead(notice.notification);
}
</script>

<template>
  <Menu :label="count ? `Notifications, ${count} unread` : 'Notifications'">
    <template #button>
      <span class="bell">
        <Icon name="bell" :size="24" />
        <span v-if="count" class="badge" aria-hidden="true">{{ badge }}</span>
      </span>
    </template>
    <div class="notices">
      <p v-if="!count" class="empty muted">No new notices</p>
      <ul v-else>
        <li v-for="notice in notifications" :key="notice.notification" class="notice">
          <button type="button" class="open" :disabled="working" @click="open(notice)">
            <strong>{{ notice.message }}</strong>
            <span class="what">{{ categoryLabel(notice.category) }}: {{ notice.description }}</span>
            <span v-if="notice.claimedBy" class="claimed">Claimed by {{ notice.claimedBy }}</span>
            <span class="muted">{{ timeAgo(notice.sentAt) }}</span>
          </button>
          <button type="button" class="button outline read" :disabled="working" @click.stop="markRead(notice.notification)">
            Mark read
          </button>
        </li>
      </ul>
    </div>
  </Menu>
</template>

<style scoped>
.bell {
  position: relative;
  display: inline-flex;
}
.badge {
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--radius-full);
  background: var(--color-danger);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}
.notices {
  width: min(360px, calc(100vw - 32px));
  max-height: 70vh;
  overflow-y: auto;
}
.empty {
  padding: var(--space-4);
  text-align: center;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.notice {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-line);
}
.open {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 6px 8px;
  border: 0;
  background: none;
  text-align: left;
}
.what {
  font-size: var(--text-sm);
  overflow-wrap: anywhere;
}
.claimed {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-claimed);
}
.read {
  min-height: 36px;
  font-size: var(--text-xs);
}
</style>

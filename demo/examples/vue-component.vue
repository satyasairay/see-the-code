<!--
  Example: Vue Component
  Demonstrates selectors in Vue single-file component format
-->
<template>
  <div class="user-profile" :id="`user-${user.id}`" :data-user-id="user.id">
    <div class="profile-header">
      <img 
        :src="user.avatar" 
        :alt="user.name"
        class="avatar"
        data-testid="user-avatar"
      />
      <div class="user-info">
        <h2 class="user-name">{{ user.name }}</h2>
        <p class="user-email">{{ user.email }}</p>
      </div>
    </div>

    <div class="profile-stats">
      <div class="stat-item" v-for="stat in stats" :key="stat.label">
        <span class="stat-value">{{ stat.value }}</span>
        <span class="stat-label">{{ stat.label }}</span>
      </div>
    </div>

    <div class="profile-actions">
      <button 
        class="action-btn primary"
        @click="handleEdit"
        data-action="edit"
      >
        Edit Profile
      </button>
      <button 
        class="action-btn secondary"
        @click="handleSettings"
        data-action="settings"
      >
        Settings
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserProfile',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      stats: [
        { label: 'Posts', value: 42 },
        { label: 'Followers', value: 1234 },
        { label: 'Following', value: 567 }
      ]
    };
  },
  methods: {
    handleEdit() {
      console.log('Edit profile');
    },
    handleSettings() {
      console.log('Open settings');
    }
  }
};
</script>

<style scoped>
.user-profile {
  padding: 20px;
}
</style>


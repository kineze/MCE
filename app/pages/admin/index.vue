<script setup lang="ts">
import type { AdminDashboardSummary, AuthenticatedUser } from '#shared/types/auth'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Dashboard · ${appName}` })

const currentUser = useState<AuthenticatedUser | null>('current-user', () => null)
const summary = useState<AdminDashboardSummary | null>('admin-summary', () => null)
const welcomeName = computed(() => currentUser.value?.displayName.trim() || 'there')

const kpis = computed(() => {
  const metrics = summary.value?.metrics
  if (!metrics) return []
  return [
    { label: 'Users', value: metrics.users, hint: 'All accounts', icon: 'i-lucide-users' },
    { label: 'Active users', value: metrics.activeUsers, hint: 'Can sign in', icon: 'i-lucide-user-check' },
    { label: 'Roles', value: metrics.roles, hint: 'Permission sets', icon: 'i-lucide-shield-check' },
    { label: 'Active sessions', value: metrics.activeSessions, hint: 'Signed in now', icon: 'i-lucide-monitor-smartphone' },
  ]
})
</script>

<template>
  <div class="dashboard-workspace">
    <section class="dashboard-hero">
      <div>
        <h1>Welcome, {{ welcomeName }}</h1>
        <p>This is the starter dashboard. Replace it with the overview your project needs.</p>
      </div>
    </section>

    <section v-if="kpis.length" class="dashboard-kpis">
      <article v-for="kpi in kpis" :key="kpi.label" class="dashboard-kpi">
        <div>
          <p>{{ kpi.label }}</p>
          <strong>{{ kpi.value }}</strong>
          <small>{{ kpi.hint }}</small>
        </div>
        <span><UIcon :name="kpi.icon" /></span>
      </article>
    </section>

    <section v-if="summary" class="dashboard-panel" style="margin-top: .75rem">
      <header class="dashboard-panel__header">
        <h2>Recent users</h2>
        <span class="dashboard-panel__meta">Latest {{ summary.recentUsers.length }}</span>
      </header>
      <div class="dashboard-table-wrap">
        <table>
          <thead>
            <tr><th>User</th><th>Roles</th><th>Status</th><th>Created</th></tr>
          </thead>
          <tbody>
            <tr v-for="user in summary.recentUsers" :key="user.id">
              <td><strong>{{ user.displayName }}</strong><small>{{ user.email }}</small></td>
              <td>
                <div class="dashboard-role-list">
                  <span v-for="role in user.roles" :key="role">{{ role.replaceAll('_', ' ') }}</span>
                </div>
              </td>
              <td>
                <span class="dashboard-status" :class="user.status === 'ACTIVE' ? 'dashboard-status--active' : 'dashboard-status--disabled'">
                  {{ user.status.toLowerCase() }}
                </span>
              </td>
              <td>{{ new Date(user.createdAt).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

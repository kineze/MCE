<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Users · ${appName}` })
</script>

<template>
  <AdminPagePlaceholder title="Users" description="Create and manage user accounts." icon="i-lucide-users" />
</template>

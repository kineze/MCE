<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Role manager · ${appName}` })
</script>

<template>
  <AdminPagePlaceholder title="Role manager" description="Group permissions into roles and assign them to users." icon="i-lucide-shield-check" />
</template>

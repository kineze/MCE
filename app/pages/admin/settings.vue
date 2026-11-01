<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Settings · ${appName}` })
</script>

<template>
  <AdminPagePlaceholder title="Settings" description="Configure system-wide settings." icon="i-lucide-sliders-horizontal" />
</template>

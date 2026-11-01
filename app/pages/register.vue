<script setup lang="ts">
definePageMeta({ layout: 'public' })

const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Register · ${appName}` })
</script>

<template>
  <div>
    <PublicPageHero eyebrow="1–6 December 2026 · Colombo" title="Register for the festival" lead="Tell us which days you plan to attend so we can welcome you." />
    <PublicRegisterSection />
  </div>
</template>

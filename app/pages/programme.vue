<script setup lang="ts">
definePageMeta({ layout: 'public' })

const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Programme · ${appName}` })

const route = useRoute()
const router = useRouter()

// The selected day lives in the URL so a day can be shared or bookmarked.
const day = computed({
  get: () => String(route.query.day ?? ''),
  set: (value: string) => {
    router.replace({ query: { ...route.query, day: value } })
  },
})
</script>

<template>
  <div>
    <PublicPageHero
      eyebrow="1–6 December 2026 · Colombo"
      title="Festival programme"
      lead="Concerts, conversations, workshops and films. All times are Sri Lanka time."
    />
    <section class="agenda agenda--page">
      <PublicMandala class="agenda__mandala" />
      <div class="agenda__inner">
        <PublicProgrammeSchedule v-model:day="day" />
      </div>
    </section>
  </div>
</template>

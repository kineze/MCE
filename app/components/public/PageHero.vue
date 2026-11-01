<script setup lang="ts">
// A short banner for inner public pages, cut from the home hero artwork.
defineProps<{
  eyebrow: string
  title: string
  lead?: string
}>()
</script>

<template>
  <section class="page-hero">
    <img class="page-hero__image" src="/images/hero.jpg" srcset="/images/hero-900.jpg 900w, /images/hero.jpg 1600w" sizes="100vw" alt="" fetchpriority="high">
    <div class="page-hero__shade" aria-hidden="true" />
    <PublicHeroMist class="public-hero__mist" />
    <div class="page-hero__content">
      <p class="public-eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p v-if="lead">{{ lead }}</p>
      <slot />
    </div>
  </section>
</template>

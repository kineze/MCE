<script setup lang="ts">
definePageMeta({ layout: 'public' })

const { public: { appName } } = useRuntimeConfig()
useHead({ title: appName })

const agendaDay = ref('')
</script>

<template>
  <div>
    <section class="public-hero">
      <img
        class="public-hero__image"
        src="/images/hero.jpg"
        srcset="/images/hero-900.jpg 900w, /images/hero.jpg 1600w"
        sizes="100vw"
        width="1600"
        height="900"
        alt="Singers and a musician in traditional dress beside the Colombo skyline at dusk"
        fetchpriority="high"
      >
      <div class="public-hero__shade" aria-hidden="true" />
      <PublicHeroMist class="public-hero__mist" />
      <PublicHeroCloud class="public-hero__cloud public-hero__cloud--top-left" />
      <PublicHeroCloud class="public-hero__cloud public-hero__cloud--bottom-right" />

      <div class="public-hero__content">
        <div class="public-hero__copy">
          <p class="public-eyebrow">1–6 December 2026 · Colombo, Sri Lanka</p>
          <h1>The Festival of Sacred Sounds</h1>
          <p class="public-hero__subtitle">South Asia 2026</p>
          <p class="public-hero__lead">“Beyond Differences Towards a Deeper Understanding of Shared Humanity”</p>
          <div class="public-hero__actions">
            <NuxtLink to="/#register" class="public-button public-button--primary public-button--large">
              Register <UIcon name="i-lucide-arrow-right" />
            </NuxtLink>
            <NuxtLink to="/#programme" class="public-button public-button--ghost public-button--large">View programme</NuxtLink>
          </div>
        </div>
      </div>
    </section>


    <PublicSponsorShowcase />

    <PublicFestivalCountdown />

    <section id="programme" class="agenda" aria-labelledby="agenda-title">
      <PublicMandala class="agenda__mandala" />
      <div class="agenda__inner">
        <header class="section-heading">
          <p class="public-eyebrow">The programme</p>
          <h2 id="agenda-title" class="festival-display">Six days of sacred sound</h2>
          <p>Concerts, conversations, workshops and films across Colombo. All times are Sri Lanka time.</p>
        </header>
        <PublicProgrammeSchedule v-model:day="agendaDay" :show-venue-filter="false" />
        <div class="agenda__more">
          <NuxtLink to="/programme" class="public-button public-button--dark public-button--large">
            See the full programme <UIcon name="i-lucide-arrow-right" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <PublicRegisterSection />
  </div>
</template>

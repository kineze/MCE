<script setup lang="ts">
// Registration: an artwork panel with what the festival offers, beside the form.
const highlights = [
  { icon: 'i-lucide-music-4', text: 'Concerts, conversations, workshops and films' },
  { icon: 'i-lucide-map-pin', text: 'Venues across Colombo, Sri Lanka' },
  { icon: 'i-lucide-calendar-days', text: 'Choose the days you plan to attend' },
]
</script>

<template>
  <section id="register" class="register-section" aria-labelledby="register-title">
    <div class="register-section__inner">
      <aside class="register-panel">
        <PublicMandala class="register-panel__mandala" />
        <p class="public-eyebrow">Register</p>
        <h2 id="register-title" class="festival-display">Reserve your place</h2>
        <p class="register-panel__lead">Join us for six days of sacred music and ideas, 1–6 December 2026.</p>
        <ul class="register-panel__list">
          <li v-for="item in highlights" :key="item.text">
            <span><UIcon :name="item.icon" /></span>
            {{ item.text }}
          </li>
        </ul>
        <p class="register-panel__quote">“Beyond Differences Towards a Deeper Understanding of Shared Humanity”</p>
      </aside>

      <div class="register-section__form">
        <PublicRegistrationForm />
      </div>
    </div>
  </section>
</template>

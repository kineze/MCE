<script setup lang="ts">
import { partnerRowOne, partnerRowTwo, principalSponsor } from '../../utils/sponsors'

const partners = [...partnerRowOne, ...partnerRowTwo]
</script>

<template>
  <section class="sponsors" aria-labelledby="sponsors-title">
    <header class="sponsors__header">
      <p class="public-eyebrow">With thanks to</p>
      <h2 id="sponsors-title">Our sponsors and partners</h2>
    </header>

    <div class="sponsors__grid">
      <article class="sponsors__principal">
        <p class="sponsors__principal-label">{{ principalSponsor.tier }}</p>
        <img :src="principalSponsor.logo" :alt="principalSponsor.name" width="720" height="240">
      </article>

      <!-- The moving rows repeat each logo, so screen readers get the list below instead. -->
      <div class="sponsors__partners" aria-hidden="true">
        <UMarquee pause-on-hover :repeat="3" class="sponsor-marquee">
          <figure v-for="partner in partnerRowOne" :key="partner.name" class="sponsor-tile">
            <img :src="partner.logo" alt="" loading="lazy">
            <figcaption>{{ partner.tier }}</figcaption>
          </figure>
        </UMarquee>
        <UMarquee pause-on-hover reverse :repeat="3" class="sponsor-marquee">
          <figure v-for="partner in partnerRowTwo" :key="partner.name" class="sponsor-tile">
            <img :src="partner.logo" alt="" loading="lazy">
            <figcaption>{{ partner.tier }}</figcaption>
          </figure>
        </UMarquee>
      </div>

      <!-- Hidden visually unless the visitor prefers reduced motion, when it replaces the rows. -->
      <ul class="sponsors__static">
        <li v-for="partner in partners" :key="partner.name" class="sponsor-tile">
          <img :src="partner.logo" :alt="partner.name" loading="lazy">
          <span>{{ partner.tier }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

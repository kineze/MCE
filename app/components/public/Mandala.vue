<script setup lang="ts">
// A line mandala echoing the ornament in the hero artwork. Decorative only.
const outer = Array.from({ length: 24 }, (_, index) => index * 15)
const inner = Array.from({ length: 12 }, (_, index) => index * 30)
</script>

<template>
  <svg class="mandala" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" stroke-width=".6">
      <circle r="96" />
      <circle r="88" stroke-dasharray="1.5 3" />
      <ellipse v-for="angle in outer" :key="`o${angle}`" rx="9" ry="34" cy="-54" :transform="`rotate(${angle})`" />
      <circle r="44" />
      <ellipse v-for="angle in inner" :key="`i${angle}`" rx="7" ry="20" cy="-26" :transform="`rotate(${angle + 15})`" />
      <circle r="14" />
      <circle r="6" stroke-dasharray="1 2" />
    </g>
  </svg>
</template>

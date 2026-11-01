<script setup lang="ts">
// A soft white cloud drawn in SVG. Blurred puffs are pushed around by fractal
// noise so the edge looks wispy. It masses in the top-left corner of its box;
// flip it with CSS for other corners.
const id = useId()
</script>

<template>
  <svg class="hero-cloud" viewBox="0 0 640 380" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <filter :id="`${id}-wisp`" x="-50%" y="-50%" width="200%" height="200%">
        <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="4" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="110" xChannelSelector="R" yChannelSelector="G" result="shaped" />
        <feGaussianBlur in="shaped" stdDeviation="16" />
      </filter>
      <filter :id="`${id}-core`" x="-50%" y="-50%" width="200%" height="200%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="60" xChannelSelector="R" yChannelSelector="G" result="shaped" />
        <feGaussianBlur in="shaped" stdDeviation="9" />
      </filter>
    </defs>

    <g :filter="`url(#${id}-wisp)`" fill="#fff" opacity=".7">
      <circle cx="420" cy="60" r="120" />
      <circle cx="560" cy="40" r="80" />
      <circle cx="320" cy="210" r="100" />
      <circle cx="120" cy="300" r="110" />
      <circle cx="230" cy="300" r="70" />
    </g>

    <g :filter="`url(#${id}-core)`" fill="#fff">
      <rect x="-60" y="-60" width="300" height="200" />
      <circle cx="70" cy="60" r="150" />
      <circle cx="230" cy="40" r="130" />
      <circle cx="360" cy="55" r="95" />
      <circle cx="130" cy="170" r="105" />
      <circle cx="260" cy="150" r="80" />
      <circle cx="40" cy="240" r="85" />
    </g>
  </svg>
</template>

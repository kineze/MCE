<script setup lang="ts">
// A thin band of white mist along the top of the hero. Its lower edge is broken up by
// fractal noise so the photo dissolves into the header unevenly instead of along a line.
const id = useId()
</script>

<template>
  <svg class="hero-mist" viewBox="0 0 1600 140" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
    <defs>
      <filter :id="`${id}-mist`" x="-10%" y="-60%" width="120%" height="220%">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.03" numOctaves="3" seed="11" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="70" xChannelSelector="R" yChannelSelector="G" result="shaped" />
        <feGaussianBlur in="shaped" stdDeviation="12" />
      </filter>
    </defs>

    <g :filter="`url(#${id}-mist)`" fill="#fff">
      <rect x="-120" y="-120" width="1840" height="160" />
      <ellipse cx="160" cy="40" rx="120" ry="34" />
      <ellipse cx="470" cy="34" rx="90" ry="26" />
      <ellipse cx="760" cy="44" rx="140" ry="30" />
      <ellipse cx="1060" cy="32" rx="95" ry="24" />
      <ellipse cx="1330" cy="42" rx="130" ry="32" />
      <ellipse cx="1560" cy="30" rx="90" ry="24" />
    </g>
    <g :filter="`url(#${id}-mist)`" fill="#fff" opacity=".55">
      <ellipse cx="320" cy="70" rx="80" ry="18" />
      <ellipse cx="900" cy="74" rx="110" ry="16" />
      <ellipse cx="1450" cy="70" rx="70" ry="16" />
    </g>
  </svg>
</template>

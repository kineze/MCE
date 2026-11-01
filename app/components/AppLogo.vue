<script setup lang="ts">
withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false,
})
</script>

<template>
  <span class="app-logo" :class="{ 'app-logo--compact': compact }">
    <img
      v-if="compact"
      src="/brand/mce-mark.png"
      alt="The MCE Festival"
      width="256"
      height="256"
      class="app-logo__mark"
    >
    <img
      v-else
      src="/brand/mce-logo.png"
      alt="The MCE Festival: Festival of Sacred Sounds, South Asia"
      width="920"
      height="245"
      class="app-logo__full"
    >
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  compact?: boolean
  inverse?: boolean
}>(), {
  compact: false,
  inverse: false,
})

const { public: { appName } } = useRuntimeConfig()
</script>

<template>
  <div class="app-logo" :class="{ 'app-logo--compact': compact, 'app-logo--inverse': inverse }">
    <span class="app-logo__mark" aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none">
        <path d="M18 3.5 31 11v14L18 32.5 5 25V11L18 3.5Z" stroke="currentColor" stroke-width="2.2" />
        <path d="m11 13 7 4 7-4M18 17v8M11 23l7 4 7-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
    <span v-if="!compact" class="app-logo__copy">
      <strong>{{ appName }}</strong>
    </span>
  </div>
</template>

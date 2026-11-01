<script setup lang="ts">
defineProps<{
  title: string
  description: string
  icon: string
}>()
</script>

<template>
  <div class="dashboard-workspace">
    <section class="dashboard-hero">
      <div>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
    </section>

    <section class="dashboard-panel" style="margin-top: .75rem">
      <div class="dashboard-empty">
        <span><UIcon :name="icon" /></span>
        <strong>Not built yet</strong>
        <p>This page is a placeholder from the starter shell.</p>
      </div>
    </section>
  </div>
</template>

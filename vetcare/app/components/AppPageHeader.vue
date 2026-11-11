<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
  back?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-4 border-b border-default py-8 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-start gap-3">
      <UButton
        v-if="back"
        :to="back"
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
        aria-label="Voltar"
        class="mt-0.5"
      />
      <div
        v-else-if="icon"
        class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
      >
        <UIcon
          :name="icon"
          class="size-5 text-primary"
        />
      </div>

      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          {{ title }}
        </h1>
        <p
          v-if="description"
          class="mt-1 text-sm text-muted"
        >
          {{ description }}
        </p>
      </div>
    </div>

    <div
      v-if="$slots.actions"
      class="flex flex-wrap gap-2"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

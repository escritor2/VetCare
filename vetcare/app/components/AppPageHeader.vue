<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
  back?: string
}>()
const { isAdmin } = useAuth()
const route = useRoute()
const tone = computed(() => route.path.startsWith('/admin') ? 'lilac' : route.path === '/minha-conta' ? 'pink' : 'blue')
</script>

<template>
  <div class="page-banner" :class="`page-banner-${tone}`">
    <div class="page-banner-content">
      <UButton
        v-if="back"
        :to="back"
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
        aria-label="Voltar"
        class="shrink-0"
      />
      <div
        v-else-if="icon"
        class="page-banner-icon"
      >
        <UIcon
          :name="icon"
          class="size-5 text-primary"
        />
      </div>

      <div>
        <p class="workspace-eyebrow">{{ isAdmin ? 'Área da equipe · VetCare' : 'Cuidado em cada detalhe' }}</p>
        <h1>
          {{ title }}
        </h1>
        <p
          v-if="description"
          class="page-banner-description"
        >
          {{ description }}
        </p>
      </div>
    </div>

    <div
      v-if="$slots.actions"
      class="page-banner-actions"
    >
      <slot name="actions" />
    </div>
    <UIcon name="i-lucide-paw-print" class="page-banner-paw" aria-hidden="true" />
  </div>
</template>

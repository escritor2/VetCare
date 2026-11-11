<script setup lang="ts">
withDefaults(defineProps<{
  nome: string
  especie: string
  foto?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}>(), {
  foto: '',
  size: 'md'
})
</script>

<template>
  <UAvatar
    :src="foto || undefined"
    :alt="nome"
    :icon="foto ? undefined : speciesIcon(especie)"
    :size="size"
    class="bg-primary/10 text-primary ring-2 ring-default"
  />
</template>

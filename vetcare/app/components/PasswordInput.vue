<script setup lang="ts">
const model = defineModel<string>({ default: '' })
const visible = ref(false)
</script>

<template>
  <UInput v-model="model" :type="visible ? 'text' : 'password'" icon="i-lucide-lock-keyhole" :ui="{ trailing: 'pe-1.5' }">
    <template #trailing>
      <UButton
        type="button"
        :icon="visible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
        :aria-label="visible ? 'Ocultar senha' : 'Mostrar senha'"
        :aria-pressed="visible"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="visible = !visible"
      />
    </template>
  </UInput>
</template>

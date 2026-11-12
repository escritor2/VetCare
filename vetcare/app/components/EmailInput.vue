<script setup lang="ts">
const model = defineModel<string>({ default: '' })

function onBlur(event: FocusEvent) {
  model.value = normalizeEmail((event.target as HTMLInputElement).value)
}
</script>

<template>
  <UInput
    v-model="model"
    type="email"
    inputmode="email"
    autocomplete="email"
    autocapitalize="none"
    :spellcheck="false"
    :maxlength="254"
    placeholder="voce@exemplo.com"
    icon="i-lucide-mail"
    @blur="onBlur"
  />
</template>

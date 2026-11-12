<script setup lang="ts">
defineOptions({ inheritAttrs: false })
const model = defineModel<string>({ default: '' })
let before = { value: '', start: 0, end: 0 }

function onBeforeInput(event: Event) {
  const input = event.target as HTMLInputElement
  before = { value: input.value, start: input.selectionStart ?? 0, end: input.selectionEnd ?? 0 }
}

async function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const inputEvent = event as InputEvent
  let raw = input.value
  let count = raw.slice(0, input.selectionStart ?? raw.length).replace(/\D/g, '').length
  if (inputEvent.inputType === 'deleteContentBackward' && before.start === before.end
    && raw.replace(/\D/g, '') === before.value.replace(/\D/g, '')) {
    const index = before.value.slice(0, before.start).search(/\d\D*$/)
    if (index >= 0) {
      raw = before.value.slice(0, index) + before.value.slice(index + 1)
      count = before.value.slice(0, index).replace(/\D/g, '').length
    }
  }
  const countryRemoved = raw.replace(/\D/g, '').length - phoneDigits(raw).length
  const formatted = formatPhone(raw)
  model.value = formatted
  input.value = formatted
  await nextTick()
  let position = 0
  let seen = 0
  const wanted = Math.max(0, count - countryRemoved)
  while (position < formatted.length && seen < wanted) {
    if (/\d/.test(formatted[position] ?? '')) seen++
    position++
  }
  input.setSelectionRange(position, position)
}
</script>

<template>
  <UInput
    v-bind="$attrs"
    :model-value="formatPhone(model)"
    type="tel"
    inputmode="tel"
    autocomplete="tel-national"
    placeholder="(19) 99999-9999"
    icon="i-lucide-phone"
    :maxlength="22"
    @beforeinput="onBeforeInput"
    @input="onInput"
  />
</template>

<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import type { TutorInput } from '~/composables/useClientes'

const props = defineProps<{
  initial?: Partial<TutorInput> | null
  submitLabel?: string
  emailRequired?: boolean
  saving?: boolean
}>()

const emit = defineEmits<{
  submit: [data: TutorInput]
  cancel: []
}>()

const state = reactive(fillFrom(emptyTutor(), props.initial))

function validate(s: Partial<TutorInput>): FormError[] {
  return validateTutorFields(s, props.emailRequired)
}

function onSubmit() {
  if (props.saving) return
  emit('submit', { ...trimStrings({ ...state }), telefone: formatPhone(state.telefone), email: normalizeEmail(state.email) })
}
</script>

<template>
  <UForm
    :state="state"
    :validate="validate"
    novalidate
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField
      label="Nome do tutor"
      name="nome"
      required
    >
      <UInput
        v-model="state.nome"
        autocomplete="name"
        :maxlength="120"
        placeholder="Ex: Maria Silva"
        icon="i-lucide-user"
        class="w-full"
      />
    </UFormField>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <UFormField
        label="Telefone / WhatsApp"
        name="telefone"
        required
      >
        <PhoneInput
          v-model="state.telefone"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="E-mail"
        name="email"
        :hint="emailRequired ? undefined : 'Opcional'"
        :required="emailRequired"
      >
        <EmailInput
          v-model="state.email"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField
      label="Endereço"
      name="endereco"
      hint="Opcional"
    >
      <UInput
        v-model="state.endereco"
        autocomplete="street-address"
        :maxlength="300"
        placeholder="Rua, número, bairro, cidade"
        icon="i-lucide-map-pin"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Observações"
      name="observacoes"
      hint="Opcional"
    >
      <UTextarea
        v-model="state.observacoes"
        :maxlength="2000"
        :rows="2"
        class="w-full"
      />
    </UFormField>

    <div class="flex justify-end gap-2 pt-2">
      <UButton
        variant="soft"
        color="neutral"
        :disabled="saving"
        @click="emit('cancel')"
      >
        Cancelar
      </UButton>
      <UButton
        type="submit"
        :loading="saving"
        icon="i-lucide-check"
      >
        {{ submitLabel ?? 'Salvar' }}
      </UButton>
    </div>
  </UForm>
</template>

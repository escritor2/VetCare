<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import type { TutorInput } from '~/composables/useClientes'

const props = defineProps<{
  initial?: Partial<TutorInput> | null
  submitLabel?: string
}>()

const emit = defineEmits<{
  submit: [data: TutorInput]
  cancel: []
}>()

const state = reactive(fillFrom(emptyTutor(), props.initial))

function validate(s: Partial<TutorInput>): FormError[] {
  const errors: FormError[] = []
  if (!s.nome?.trim()) errors.push({ name: 'nome', message: 'Informe o nome' })
  if (!s.telefone?.trim()) errors.push({ name: 'telefone', message: 'Informe o telefone' })
  if (s.email?.trim() && !s.email.includes('@')) errors.push({ name: 'email', message: 'E-mail inválido' })
  return errors
}
</script>

<template>
  <UForm
    :state="state"
    :validate="validate"
    class="space-y-4"
    @submit="emit('submit', trimStrings({ ...state }))"
  >
    <UFormField
      label="Nome do tutor"
      name="nome"
      required
    >
      <UInput
        v-model="state.nome"
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
        <UInput
          v-model="state.telefone"
          type="tel"
          placeholder="(19) 99999-9999"
          icon="i-lucide-phone"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="E-mail"
        name="email"
        hint="Opcional"
      >
        <UInput
          v-model="state.email"
          type="email"
          icon="i-lucide-mail"
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
        :rows="2"
        class="w-full"
      />
    </UFormField>

    <div class="flex justify-end gap-2 pt-2">
      <UButton
        variant="soft"
        color="neutral"
        @click="emit('cancel')"
      >
        Cancelar
      </UButton>
      <UButton
        type="submit"
        icon="i-lucide-check"
      >
        {{ submitLabel ?? 'Salvar' }}
      </UButton>
    </div>
  </UForm>
</template>

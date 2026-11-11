<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import type { PetFields } from '~/composables/useClientes'

const props = defineProps<{
  initial?: Partial<PetFields> | null
  submitLabel?: string
}>()

const emit = defineEmits<{
  submit: [data: PetFields]
  cancel: []
}>()

const state = reactive(fillFrom(emptyPet(), props.initial))

function validate(s: Partial<PetFields>): FormError[] {
  const errors: FormError[] = []
  if (!s.nome?.trim()) errors.push({ name: 'nome', message: 'Informe o nome' })
  if (!s.especie) errors.push({ name: 'especie', message: 'Selecione a espécie' })
  if (s.nascimento && s.nascimento > todayISO()) errors.push({ name: 'nascimento', message: 'Data no futuro' })
  return errors
}

const fileInput = ref<HTMLInputElement | null>(null)
const fotoLoading = ref(false)
const fotoError = ref('')

async function onFotoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  fotoError.value = ''
  fotoLoading.value = true
  try {
    state.foto = await compressImage(file)
  } catch {
    fotoError.value = 'Não foi possível usar essa imagem. Tente outra foto (JPG ou PNG).'
  } finally {
    fotoLoading.value = false
  }
}
</script>

<template>
  <UForm
    :state="state"
    :validate="validate"
    class="space-y-4"
    @submit="emit('submit', trimStrings({ ...state }))"
  >
    <!-- Foto -->
    <div class="flex items-center gap-4">
      <PetAvatar
        :nome="state.nome || 'Pet'"
        :especie="state.especie"
        :foto="state.foto"
        size="3xl"
      />
      <div class="space-y-1">
        <div class="flex flex-wrap gap-2">
          <UButton
            icon="i-lucide-camera"
            variant="soft"
            size="sm"
            :loading="fotoLoading"
            @click="fileInput?.click()"
          >
            {{ state.foto ? 'Trocar foto' : 'Adicionar foto' }}
          </UButton>
          <UButton
            v-if="state.foto"
            icon="i-lucide-trash-2"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="state.foto = ''"
          >
            Remover
          </UButton>
        </div>
        <p
          v-if="fotoError"
          class="text-sm text-error"
        >
          {{ fotoError }}
        </p>
        <p
          v-else
          class="text-xs text-muted"
        >
          Opcional. A foto é reduzida automaticamente.
        </p>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFotoChange"
      >
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <UFormField
        label="Nome do pet"
        name="nome"
        required
      >
        <UInput
          v-model="state.nome"
          placeholder="Ex: Mel"
          icon="i-lucide-paw-print"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Espécie"
        name="especie"
        required
      >
        <USelect
          v-model="state.especie"
          :items="SPECIES"
          placeholder="Selecione"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Raça"
        name="raca"
        hint="Opcional"
      >
        <UInput
          v-model="state.raca"
          placeholder="Ex: Golden Retriever, SRD"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Sexo"
        name="sexo"
        hint="Opcional"
      >
        <USelect
          v-model="state.sexo"
          :items="SEXOS"
          placeholder="Selecione"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Nascimento"
        name="nascimento"
        hint="Aproximado serve"
      >
        <UInput
          v-model="state.nascimento"
          type="date"
          :max="todayISO()"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField
      label="Alergias / observações"
      name="observacoes"
      hint="Opcional"
    >
      <UTextarea
        v-model="state.observacoes"
        placeholder="Alergias, doenças crônicas, temperamento..."
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

<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import type { PetFields, TutorInput } from '~/composables/useClientes'

/** Agendamento feito pelo admin em nome de um cliente (ex.: atendimento por telefone) */
const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ date: string, time?: string }>()

const toast = useToast()
const { tutores } = useTutores()
const { createTutor, createPet } = useClientesActions()
const { book } = useAgendaActions()

type Mode = 'form' | 'novo-cliente' | 'novo-pet'
const mode = ref<Mode>('form')

const emptyState = () => ({
  tutorId: '',
  petId: '',
  serviceType: '',
  date: props.date,
  time: props.time ?? '',
  notes: ''
})
const state = reactive(emptyState())

watch(open, (o) => {
  if (o) {
    Object.assign(state, emptyState())
    mode.value = 'form'
  }
})

const tutor = computed(() => tutores.value.find(t => t.id === state.tutorId))
const { pets } = usePets(() => state.tutorId || undefined)
const pet = computed(() => pets.value.find(p => p.id === state.petId))

watch(() => state.tutorId, () => {
  state.petId = ''
})
watch(pets, (list) => {
  if (!state.petId && list.length === 1) state.petId = list[0]!.id
})

const tutorItems = computed(() => tutores.value.map(t => ({ label: t.nome, value: t.id, description: t.telefone })))
const petItems = computed(() => pets.value.map(p => ({ label: `${p.nome} (${p.especie})`, value: p.id })))

const { ocupados } = useHorariosOcupados(() => state.date)
const timeItems = computed(() => {
  if (!isValidISODate(state.date) || state.date < todayISO() || state.date > maxBookingDate() || !isDiaUtil(state.date)) return []
  return SLOT_TIMES.filter(t => !ocupados.value.has(t) && !isSlotPast(state.date, t))
})
watch(timeItems, (list) => {
  if (state.time && !list.includes(state.time)) state.time = ''
})

function validate(s: typeof state): FormError[] {
  const errors: FormError[] = []
  if (!s.tutorId) errors.push({ name: 'tutorId', message: 'Escolha o cliente' })
  if (!s.petId) errors.push({ name: 'petId', message: 'Escolha o pet' })
  if (!SERVICE_TYPES.includes(s.serviceType)) errors.push({ name: 'serviceType', message: 'Escolha o serviço' })
  if (!s.date) errors.push({ name: 'date', message: 'Escolha a data' })
  else if (!isValidISODate(s.date) || s.date < todayISO() || s.date > maxBookingDate()) errors.push({ name: 'date', message: 'Escolha uma data válida nos próximos 60 dias.' })
  else if (!isDiaUtil(s.date)) errors.push({ name: 'date', message: 'A clínica não abre no fim de semana' })
  if (!s.time) errors.push({ name: 'time', message: 'Escolha o horário' })
  else if (!timeItems.value.includes(s.time)) errors.push({ name: 'time', message: 'Este horário não está mais disponível.' })
  if (s.notes.length > 2000) errors.push({ name: 'notes', message: 'Use no máximo 2.000 caracteres.' })
  return errors
}

/* Novo cliente / novo pet sem sair do agendamento */
const savingSub = ref(false)

async function onNovoCliente(data: TutorInput) {
  if (savingSub.value) return
  savingSub.value = true
  try {
    const { id, synced } = createTutor(data)
    await synced
    state.tutorId = id
    mode.value = 'novo-pet'
    toast.add({ title: 'Cliente cadastrado', description: 'Agora cadastre o pet.', color: 'success', icon: 'i-lucide-user-check' })
  } catch {
    toast.add({ title: 'Não foi possível cadastrar o cliente', color: 'error' })
  } finally {
    savingSub.value = false
  }
}

async function onNovoPet(data: PetFields) {
  if (!state.tutorId || savingSub.value) return
  savingSub.value = true
  try {
    const { id, synced } = createPet({ ...data, tutorId: state.tutorId })
    await synced
    state.petId = id
    mode.value = 'form'
  } catch {
    toast.add({ title: 'Não foi possível cadastrar o pet', color: 'error' })
  } finally {
    savingSub.value = false
  }
}

const saving = ref(false)
async function onSubmit() {
  if (!tutor.value || !pet.value || saving.value) return
  saving.value = true
  try {
    await book({
      tutorId: tutor.value.id,
      tutorName: tutor.value.nome,
      phone: tutor.value.telefone,
      petId: pet.value.id,
      petName: pet.value.nome,
      species: pet.value.especie,
      serviceType: state.serviceType,
      notes: state.notes.trim(),
      date: state.date,
      time: state.time
    })
    toast.add({
      title: 'Agendamento criado',
      description: `${pet.value.nome} — ${formatLongDate(state.date)} às ${state.time}`,
      color: 'success',
      icon: 'i-lucide-calendar-check'
    })
    open.value = false
  } catch (e) {
    const code = e instanceof AgendaError ? e.code : 'desconhecido'
    const description = code === 'ja-tem'
      ? 'Este cliente já tem um agendamento futuro. Cancele-o antes de marcar outro.'
      : AGENDA_ERROR_MESSAGES[code]
    toast.add({ title: 'Não foi possível agendar', description, color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    saving.value = false
  }
}

const title = computed(() => ({
  'form': 'Novo agendamento',
  'novo-cliente': 'Cadastrar cliente',
  'novo-pet': `Cadastrar pet${tutor.value ? ` de ${tutor.value.nome}` : ''}`
}[mode.value]))
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <TutorForm
        v-if="mode === 'novo-cliente'"
        submit-label="Cadastrar cliente"
        :saving="savingSub"
        @submit="onNovoCliente"
        @cancel="mode = 'form'"
      />

      <PetForm
        v-else-if="mode === 'novo-pet'"
        submit-label="Cadastrar pet"
        :saving="savingSub"
        @submit="onNovoPet"
        @cancel="mode = 'form'"
      />

      <UForm
        v-else
        :state="state"
        :validate="validate"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField
            label="Cliente"
            name="tutorId"
            required
          >
            <div class="flex gap-2">
              <USelectMenu
                v-model="state.tutorId"
                :items="tutorItems"
                value-key="value"
                placeholder="Buscar cliente..."
                :search-input="{ placeholder: 'Nome do cliente' }"
                class="min-w-0 flex-1"
              />
              <UTooltip text="Novo cliente">
                <UButton
                  icon="i-lucide-user-plus"
                  color="neutral"
                  variant="outline"
                  aria-label="Cadastrar cliente"
                  @click="mode = 'novo-cliente'"
                />
              </UTooltip>
            </div>
          </UFormField>

          <UFormField
            label="Pet"
            name="petId"
            required
          >
            <div class="flex gap-2">
              <USelect
                v-model="state.petId"
                :items="petItems"
                :disabled="!state.tutorId"
                :placeholder="state.tutorId ? (petItems.length ? 'Escolha o pet' : 'Nenhum pet cadastrado') : 'Escolha o cliente primeiro'"
                class="min-w-0 flex-1"
              />
              <UTooltip text="Novo pet">
                <UButton
                  icon="i-lucide-plus"
                  color="neutral"
                  variant="outline"
                  :disabled="!state.tutorId"
                  aria-label="Cadastrar pet"
                  @click="mode = 'novo-pet'"
                />
              </UTooltip>
            </div>
          </UFormField>

          <UFormField
            label="Serviço"
            name="serviceType"
            required
          >
            <USelect
              v-model="state.serviceType"
              :items="SERVICE_TYPES"
              placeholder="Escolha o serviço"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-2">
            <UFormField
              label="Data"
              name="date"
              required
            >
              <UInput
                v-model="state.date"
                type="date"
                :min="todayISO()"
                :max="maxBookingDate()"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Horário"
              name="time"
              required
            >
              <USelect
                v-model="state.time"
                :items="timeItems"
                :placeholder="timeItems.length ? 'Livre' : 'Sem horário'"
                :disabled="!timeItems.length"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <UFormField
          label="Observações / sintomas"
          name="notes"
          hint="Opcional"
        >
          <UTextarea
            v-model="state.notes"
            :rows="2"
            :maxlength="2000"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            variant="soft"
            color="neutral"
            @click="open = false"
          >
            Cancelar
          </UButton>
          <UButton
            type="submit"
            icon="i-lucide-check"
            :loading="saving || savingSub"
          >
            Agendar
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

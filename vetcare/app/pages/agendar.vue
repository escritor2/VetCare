<script setup lang="ts">
import type { PetFields } from '~/composables/useClientes'

definePageMeta({ access: 'public' })
useSeoMeta({ title: 'Agendar consulta' })

const route = useRoute()
const toast = useToast()
const { user, isCliente, isAdmin } = useAuth()

const q = (k: string) => (typeof route.query[k] === 'string' ? route.query[k] as string : '')

const state = reactive({
  serviceType: SERVICE_TYPES.includes(q('servico')) ? q('servico') : '',
  date: isValidISODate(q('data')) && q('data') >= todayISO() && q('data') <= maxBookingDate() && isDiaUtil(q('data')) ? q('data') : '',
  time: SLOT_TIMES.includes(q('hora')) ? q('hora') : '',
  petId: '',
  notes: ''
})

const clienteId = computed(() => (isCliente.value ? user.value?.uid : undefined))
const { data: tutor } = useTutor(clienteId)
const { pets, pending: petsPending } = usePets(clienteId)
const { proximo, pending: agPending } = useMeusAgendamentos(clienteId)
const { book, cancel } = useAgendaActions()
const { createPet } = useClientesActions()
const report = useSyncReporter()

// Seleciona o pet automaticamente se só houver um
watch(pets, (list) => {
  if (!state.petId && list.length === 1) state.petId = list[0]!.id
}, { immediate: true })

const selectedPet = computed(() => pets.value.find(p => p.id === state.petId))
const ready = computed(() => state.serviceType && state.date && state.time)
const canConfirm = computed(() => ready.value && selectedPet.value && tutor.value)

/** Para visitante: guarda a escolha e volta para cá depois do login/cadastro */
const returnPath = computed(() => {
  const params = new URLSearchParams()
  if (state.serviceType) params.set('servico', state.serviceType)
  if (state.date) params.set('data', state.date)
  if (state.time) params.set('hora', state.time)
  const qs = params.toString()
  return qs ? `/agendar?${qs}` : '/agendar'
})

const petModal = ref(false)
function onCreatePet(data: PetFields) {
  if (!clienteId.value) return
  const { id, synced } = createPet({ ...data, tutorId: clienteId.value })
  report(synced)
  state.petId = id
  petModal.value = false
  toast.add({ title: `${data.nome} cadastrado!`, color: 'success', icon: 'i-lucide-paw-print' })
}

const saving = ref(false)
async function onConfirm() {
  if (saving.value || !canConfirm.value) return
  const pet = selectedPet.value
  if (!pet || !tutor.value || !clienteId.value) return
  saving.value = true
  try {
    await book({
      tutorId: clienteId.value,
      tutorName: tutor.value.nome,
      phone: tutor.value.telefone,
      petId: pet.id,
      petName: pet.nome,
      species: pet.especie,
      serviceType: state.serviceType,
      notes: state.notes.trim(),
      date: state.date,
      time: state.time
    })
    toast.add({
      title: 'Agendamento confirmado!',
      description: `${pet.nome} — ${formatLongDate(state.date)} às ${state.time}`,
      color: 'success',
      icon: 'i-lucide-calendar-check'
    })
    await navigateTo('/minha-conta')
  } catch (e) {
    const code = e instanceof AgendaError ? e.code : 'desconhecido'
    toast.add({ title: 'Não foi possível agendar', description: e instanceof InputValidationError ? e.message : AGENDA_ERROR_MESSAGES[code], color: 'error', icon: 'i-lucide-circle-alert' })
    if (code === 'ocupado') state.time = ''
  } finally {
    saving.value = false
  }
}

const cancelling = ref(false)
async function onCancelProximo() {
  if (!proximo.value || !confirm('Cancelar este agendamento?')) return
  cancelling.value = true
  try {
    await cancel(proximo.value)
    toast.add({ title: 'Agendamento cancelado', description: 'Agora você pode escolher um novo horário.', color: 'neutral', icon: 'i-lucide-calendar-x' })
  } catch (e) {
    const code = e instanceof AgendaError ? e.code : 'desconhecido'
    toast.add({ title: 'Não foi possível cancelar', description: code === 'offline' ? AGENDA_ERROR_MESSAGES.offline : 'Tente novamente.', color: 'error' })
  } finally {
    cancelling.value = false
  }
}
</script>

<template>
  <UContainer class="workspace-page booking-page">
    <AppPageHeader
      title="Agendar consulta"
      description="Segunda a sexta, das 8h às 19h. Escolha o serviço, o dia e o horário."
      icon="i-lucide-calendar-plus"
    />

    <UAlert
      v-if="isAdmin"
      class="mt-6"
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      title="Você está como administrador"
      description="Esta é a tela dos clientes. Para ver os agendamentos, use a Agenda do painel."
    />

    <!-- Já tem agendamento futuro: regra de 1 por cliente -->
    <div
      v-if="isCliente && !agPending && proximo"
      class="mt-8 space-y-4"
    >
      <UAlert
        color="warning"
        variant="subtle"
        icon="i-lucide-calendar-clock"
        title="Você já tem um agendamento"
        description="Cada cliente pode ter um agendamento futuro por vez. Para marcar outro horário, cancele o atual."
      />
      <AgendamentoCard
        :agendamento="proximo"
        show-date
        cancelable
        :cancelling="cancelling"
        @cancel="onCancelProximo"
      />
    </div>

    <div
      v-else
      class="mt-8 space-y-8"
    >
      <!-- 1. Serviço -->
      <section class="booking-panel">
        <h2 class="mb-3 flex items-center gap-2 font-semibold text-highlighted">
          <span class="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-inverted">1</span>
          Qual serviço?
        </h2>
        <div class="booking-service-options grid grid-cols-2 gap-3 md:grid-cols-4">
          <button
            v-for="s in SERVICE_TYPES"
            :key="s"
            type="button"
            class="service-choice card-hover flex flex-col items-center gap-2 rounded-lg p-4 text-center ring transition-colors"
            :class="state.serviceType === s ? 'bg-primary/10 ring-2 ring-primary' : 'bg-default ring-default'"
            :aria-pressed="state.serviceType === s"
            @click="state.serviceType = s"
          >
            <UIcon
              :name="SERVICE_ICONS[s] ?? 'i-lucide-paw-print'"
              class="size-7 text-primary"
            />
            <span class="text-sm font-medium text-highlighted">{{ s }}</span>
          </button>
        </div>
      </section>

      <!-- 2. Dia e horário -->
      <section class="booking-panel">
        <h2 class="mb-3 flex items-center gap-2 font-semibold text-highlighted">
          <span class="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-inverted">2</span>
          Quando?
        </h2>
        <UCard>
          <AgendaSlotPicker
            v-model:date="state.date"
            v-model:time="state.time"
          />
        </UCard>
      </section>

      <!-- 3. Pet e confirmação -->
      <section class="booking-panel">
        <h2 class="mb-3 flex items-center gap-2 font-semibold text-highlighted">
          <span class="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-inverted">3</span>
          Para qual pet?
        </h2>

        <!-- Visitante -->
        <UCard v-if="!user">
          <div class="flex flex-col items-center gap-4 py-4 text-center">
            <UIcon
              name="i-lucide-lock-keyhole"
              class="size-8 text-primary"
            />
            <div>
              <p class="font-semibold text-highlighted">
                Entre ou crie sua conta para confirmar
              </p>
              <p class="mt-1 text-sm text-muted">
                Sua escolha fica guardada. É rapidinho!
              </p>
            </div>
            <div class="flex flex-wrap justify-center gap-2">
              <UButton :to="{ path: '/cadastro', query: { redirect: returnPath } }">
                Criar conta
              </UButton>
              <UButton
                :to="{ path: '/login', query: { redirect: returnPath } }"
                color="neutral"
                variant="outline"
              >
                Já tenho conta
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Cliente -->
        <UCard v-else-if="isCliente">
          <div
            v-if="petsPending"
            class="flex gap-3"
          >
            <USkeleton
              v-for="i in 2"
              :key="i"
              class="h-20 w-32"
            />
          </div>

          <div
            v-else
            class="flex flex-wrap gap-3"
          >
            <button
              v-for="p in pets"
              :key="p.id"
              type="button"
              class="card-hover flex w-32 flex-col items-center gap-2 rounded-lg p-3 ring"
              :class="state.petId === p.id ? 'bg-primary/10 ring-2 ring-primary' : 'ring-default'"
              :aria-pressed="state.petId === p.id"
              @click="state.petId = p.id"
            >
              <PetAvatar
                :nome="p.nome"
                :especie="p.especie"
                :foto="p.foto"
                size="xl"
              />
              <span class="w-full truncate text-sm font-medium text-highlighted">{{ p.nome }}</span>
            </button>

            <button
              type="button"
              class="flex w-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-default p-3 text-muted transition-colors hover:border-primary hover:text-primary"
              @click="petModal = true"
            >
              <UIcon
                name="i-lucide-plus"
                class="size-6"
              />
              <span class="text-sm font-medium">{{ pets.length ? 'Outro pet' : 'Cadastrar pet' }}</span>
            </button>
          </div>

          <UFormField
            label="Observações / sintomas"
            hint="Opcional"
            class="mt-6"
          >
            <UTextarea
              v-model="state.notes"
              placeholder="Conte brevemente o motivo da visita..."
              :rows="3"
              :maxlength="2000"
              class="w-full"
            />
          </UFormField>

          <template #footer>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p
                v-if="ready && selectedPet"
                class="text-sm text-muted"
              >
                <span class="font-semibold text-highlighted">{{ state.serviceType }}</span>
                para <span class="font-semibold text-highlighted">{{ selectedPet.nome }}</span>,
                <span class="capitalize">{{ formatLongDate(state.date) }}</span> às
                <span class="font-semibold text-highlighted">{{ state.time }}</span>
              </p>
              <p
                v-else
                class="text-sm text-muted"
              >
                Escolha serviço, dia, horário e pet.
              </p>
              <UButton
                size="lg"
                icon="i-lucide-check"
                :disabled="!canConfirm"
                :loading="saving"
                @click="onConfirm"
              >
                Confirmar agendamento
              </UButton>
            </div>
          </template>
        </UCard>
      </section>
    </div>

    <UModal
      v-model:open="petModal"
      title="Cadastrar pet"
    >
      <template #body>
        <PetForm
          submit-label="Cadastrar"
          @submit="onCreatePet"
          @cancel="petModal = false"
        />
      </template>
    </UModal>
  </UContainer>
</template>

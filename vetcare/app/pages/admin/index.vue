<script setup lang="ts">
import { parseDate } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import type { Agendamento } from '~/composables/useAgenda'

definePageMeta({ access: 'admin' })
useSeoMeta({ title: 'Agenda' })

const toast = useToast()
const { cancel, setLimiteSemanal } = useAgendaActions()

/** Começa no próximo dia útil se hoje for fim de semana */
function proximoDiaUtil(iso: string) {
  let d = iso
  while (!isDiaUtil(d)) d = addDaysISO(d, 1)
  return d
}

const selectedDate = ref(proximoDiaUtil(todayISO()))
const isToday = computed(() => selectedDate.value === todayISO())
const aberto = computed(() => isDiaUtil(selectedDate.value))

const calendarValue = computed({
  get: () => parseDate(selectedDate.value),
  set: (v: DateValue | undefined) => {
    if (v) selectedDate.value = v.toString().slice(0, 10)
  }
})

const { agendamentos, pending, error } = useAgendamentosDoDia(selectedDate)
const { total: totalSemana, limiteSemanal, lotada } = useSemana(selectedDate)

const porHorario = computed(() => new Map(agendamentos.value.map(a => [a.time, a])))

const somenteOcupados = ref(false)
const linhas = computed(() => SLOT_TIMES
  .map(time => ({
    time,
    agendamento: porHorario.value.get(time),
    passado: isSlotPast(selectedDate.value, time)
  }))
  .filter(l => !somenteOcupados.value || l.agendamento))

const livres = computed(() => (aberto.value
  ? SLOT_TIMES.filter(t => !porHorario.value.has(t) && !isSlotPast(selectedDate.value, t)).length
  : 0))

/* Novo agendamento */
const bookingOpen = ref(false)
const bookingTime = ref('')
function openBooking(time = '') {
  bookingTime.value = time
  bookingOpen.value = true
}

/* Cancelamento */
const cancellingId = ref('')
async function onCancel(a: Agendamento) {
  if (!confirm(`Cancelar o agendamento de ${a.petName} (${a.tutorName}) às ${a.time}?`)) return
  cancellingId.value = a.id
  try {
    await cancel(a)
    toast.add({ title: 'Agendamento cancelado', description: 'O horário foi liberado.', color: 'neutral', icon: 'i-lucide-calendar-x' })
  } catch (e) {
    const code = e instanceof AgendaError ? e.code : 'desconhecido'
    toast.add({ title: 'Não foi possível cancelar', description: code === 'offline' ? AGENDA_ERROR_MESSAGES.offline : 'Tente novamente.', color: 'error' })
  } finally {
    cancellingId.value = ''
  }
}

/* Limite semanal */
const limiteModal = ref(false)
const novoLimite = ref(50)
watch(limiteModal, (open) => {
  if (open) novoLimite.value = limiteSemanal.value ?? 50
})

const savingLimite = ref(false)
async function onSaveLimite() {
  savingLimite.value = true
  try {
    await setLimiteSemanal(novoLimite.value)
    limiteModal.value = false
    toast.add({ title: 'Limite semanal atualizado', color: 'success', icon: 'i-lucide-check-circle' })
  } catch {
    toast.add({ title: 'Não foi possível salvar', color: 'error' })
  } finally {
    savingLimite.value = false
  }
}
</script>

<template>
  <UContainer class="workspace-page admin-page">
    <AppPageHeader
      title="Agenda"
      description="Agendamentos da clínica em tempo real."
      icon="i-lucide-calendar-days"
    >
      <template #actions>
        <UButton
          icon="i-lucide-calendar-plus"
          size="lg"
          @click="openBooking()"
        >
          Novo agendamento
        </UButton>
      </template>
    </AppPageHeader>

    <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr] xl:grid-cols-[22rem_1fr]">
      <!-- Lateral: calendário e números -->
      <aside class="space-y-4">
        <UCard :ui="{ body: 'p-3 sm:p-4' }">
          <UCalendar
            v-model="calendarValue"
            :is-date-disabled="(d: DateValue) => !isDiaUtil(d.toString().slice(0, 10))"
            class="mx-auto"
          />
          <UButton
            v-if="!isToday"
            block
            variant="soft"
            color="neutral"
            size="sm"
            class="mt-3"
            @click="selectedDate = proximoDiaUtil(todayISO())"
          >
            Voltar para hoje
          </UButton>
        </UCard>

        <div class="agenda-stats grid grid-cols-3 gap-3 lg:grid-cols-1">
          <UCard :ui="{ body: 'p-4 sm:p-4' }">
            <p class="text-xs text-muted sm:text-sm">
              Agendados no dia
            </p>
            <p class="mt-1 text-2xl font-bold text-highlighted sm:text-3xl">
              {{ pending ? '–' : agendamentos.length }}
            </p>
          </UCard>

          <UCard :ui="{ body: 'p-4 sm:p-4' }">
            <p class="text-xs text-muted sm:text-sm">
              Horários livres
            </p>
            <p class="mt-1 text-2xl font-bold text-highlighted sm:text-3xl">
              {{ livres }}
            </p>
          </UCard>

          <UCard :ui="{ body: 'p-4 sm:p-4' }">
            <div class="flex items-start justify-between gap-1">
              <p class="text-xs text-muted sm:text-sm">
                Semana
              </p>
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-lucide-settings-2"
                aria-label="Configurar limite semanal"
                class="-mr-2 -mt-1"
                @click="limiteModal = true"
              />
            </div>
            <p class="text-2xl font-bold text-highlighted sm:text-3xl">
              {{ totalSemana }}<span class="text-base font-medium text-muted"> / {{ limiteSemanal ?? '∞' }}</span>
            </p>
            <UProgress
              v-if="limiteSemanal"
              :model-value="Math.min(totalSemana, limiteSemanal)"
              :max="limiteSemanal"
              :color="lotada ? 'error' : 'primary'"
              size="sm"
              class="mt-2"
            />
            <p
              v-else
              class="mt-1 text-xs text-warning"
            >
              Sem limite definido
            </p>
          </UCard>
        </div>
      </aside>

      <!-- Grade do dia -->
      <section class="min-w-0">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="outline"
              aria-label="Dia anterior"
              @click="selectedDate = addDaysISO(selectedDate, -1)"
            />
            <h2 class="agenda-date-heading text-center text-lg font-semibold capitalize text-highlighted">
              {{ formatLongDate(selectedDate) }}
            </h2>
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="outline"
              aria-label="Próximo dia"
              @click="selectedDate = addDaysISO(selectedDate, 1)"
            />
          </div>

          <USwitch
            v-if="aberto"
            v-model="somenteOcupados"
            label="Só ocupados"
          />
        </div>

        <UAlert
          v-if="lotada && aberto"
          class="mb-4"
          color="warning"
          variant="subtle"
          icon="i-lucide-calendar-x"
          title="Semana lotada"
          description="O limite semanal foi atingido. Aumente o limite (engrenagem no card Semana) para liberar novos agendamentos."
        />

        <UCard v-if="!aberto">
          <div class="flex flex-col items-center py-12 text-center">
            <UIcon
              name="i-lucide-moon"
              class="size-10 text-muted"
            />
            <p class="mt-4 font-semibold text-highlighted">
              Clínica fechada
            </p>
            <p class="mt-1 text-sm text-muted">
              Não há atendimento aos fins de semana.
            </p>
          </div>
        </UCard>

        <UAlert
          v-else-if="error"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          title="Não foi possível carregar a agenda"
          :description="dataErrorMessage(error)"
        />

        <div
          v-else-if="pending"
          class="space-y-2"
        >
          <USkeleton
            v-for="i in 6"
            :key="i"
            class="h-16 w-full"
          />
        </div>

        <ul
          v-else
          class="grid grid-cols-1 gap-2 2xl:grid-cols-2"
        >
          <li
            v-for="l in linhas"
            :key="l.time"
          >
            <AgendamentoCard
              v-if="l.agendamento"
              :agendamento="l.agendamento"
              show-tutor
              :cancelable="!l.passado"
              :cancelling="cancellingId === l.agendamento.id"
              @cancel="onCancel(l.agendamento)"
            />

            <div
              v-else
              class="empty-agenda-slot flex items-center gap-4 rounded-lg border border-dashed border-default px-4 py-3"
              :class="l.passado && 'opacity-50'"
            >
              <span class="w-16 text-center font-mono text-sm font-semibold text-muted">{{ l.time }}</span>
              <span class="flex-1 text-sm text-muted">{{ l.passado ? 'Horário encerrado' : 'Livre' }}</span>
              <UButton
                v-if="!l.passado && !lotada"
                size="sm"
                variant="soft"
                icon="i-lucide-plus"
                @click="openBooking(l.time)"
              >
                Agendar
              </UButton>
            </div>
          </li>

          <li
            v-if="!linhas.length"
            class="rounded-lg border border-dashed border-default py-10 text-center text-sm text-muted"
          >
            Nenhum agendamento neste dia.
          </li>
        </ul>
      </section>
    </div>

    <AdminBookingModal
      v-model:open="bookingOpen"
      :date="aberto ? selectedDate : proximoDiaUtil(todayISO())"
      :time="bookingTime"
    />

    <UModal
      v-model:open="limiteModal"
      title="Limite semanal de agendamentos"
      description="Total máximo de agendamentos da clínica por semana (seg–sex)."
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Máximo por semana">
            <UInputNumber
              v-model="novoLimite"
              :min="1"
              :max="1000"
              class="w-full"
            />
          </UFormField>
          <p class="text-sm text-muted">
            A grade tem 110 horários por semana (22 por dia). Agendamentos já feitos não são afetados.
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              variant="soft"
              color="neutral"
              @click="limiteModal = false"
            >
              Cancelar
            </UButton>
            <UButton
              :loading="savingLimite"
              icon="i-lucide-check"
              @click="onSaveLimite"
            >
              Salvar
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>

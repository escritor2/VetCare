<script setup lang="ts">
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

const { agendamentos, pending, error } = useAgendamentosDoDia(selectedDate)
const { ocupados } = useHorariosOcupados(selectedDate)
const { total: totalSemana, limiteSemanal, lotada } = useSemana(selectedDate)

const livresHoje = computed(() =>
  isDiaUtil(selectedDate.value)
    ? SLOT_TIMES.filter(t => !ocupados.value.has(t) && !isSlotPast(selectedDate.value, t)).length
    : 0
)

function shiftDay(days: number) {
  selectedDate.value = addDaysISO(selectedDate.value, days)
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
  <UContainer class="max-w-4xl pb-16">
    <AppPageHeader
      title="Agenda"
      description="Agendamentos da clínica em tempo real."
      icon="i-lucide-calendar-days"
    />

    <!-- Resumo -->
    <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <UCard>
        <p class="text-sm text-muted">
          Agendamentos no dia
        </p>
        <p class="mt-1 text-3xl font-bold text-highlighted">
          {{ pending ? '–' : agendamentos.length }}
        </p>
      </UCard>

      <UCard>
        <p class="text-sm text-muted">
          Horários livres no dia
        </p>
        <p class="mt-1 text-3xl font-bold text-highlighted">
          {{ livresHoje }}
        </p>
      </UCard>

      <UCard>
        <div class="flex items-start justify-between">
          <p class="text-sm text-muted">
            Semana
          </p>
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-settings-2"
            aria-label="Configurar limite semanal"
            @click="limiteModal = true"
          />
        </div>
        <p class="text-3xl font-bold text-highlighted">
          {{ totalSemana }}<span class="text-lg font-medium text-muted"> / {{ limiteSemanal ?? '∞' }}</span>
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

    <!-- Navegação de datas -->
    <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="outline"
          aria-label="Dia anterior"
          @click="shiftDay(-1)"
        />
        <UInput
          v-model="selectedDate"
          type="date"
        />
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="outline"
          aria-label="Próximo dia"
          @click="shiftDay(1)"
        />
        <UButton
          v-if="!isToday"
          color="neutral"
          variant="ghost"
          @click="selectedDate = todayISO()"
        >
          Hoje
        </UButton>
      </div>

      <p class="text-sm capitalize text-muted">
        {{ formatLongDate(selectedDate) }}
      </p>
    </div>

    <UAlert
      v-if="!isDiaUtil(selectedDate)"
      class="mt-6"
      color="neutral"
      variant="subtle"
      icon="i-lucide-moon"
      title="Clínica fechada"
      description="Não há atendimento aos fins de semana."
    />

    <UAlert
      v-else-if="error"
      class="mt-6"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Não foi possível carregar a agenda"
      :description="error.message"
    />

    <div
      v-else-if="pending"
      class="mt-6 space-y-3"
    >
      <USkeleton
        v-for="i in 3"
        :key="i"
        class="h-24 w-full"
      />
    </div>

    <ul
      v-else-if="agendamentos.length"
      class="mt-6 space-y-3"
    >
      <li
        v-for="a in agendamentos"
        :key="a.id"
      >
        <AgendamentoCard
          :agendamento="a"
          show-tutor
          :cancelable="!isSlotPast(a.date, a.time)"
          :cancelling="cancellingId === a.id"
          @cancel="onCancel(a)"
        />
      </li>
    </ul>

    <UCard
      v-else
      class="mt-6"
    >
      <div class="flex flex-col items-center py-10 text-center">
        <div class="flex size-12 items-center justify-center rounded-full bg-elevated">
          <UIcon
            name="i-lucide-calendar-x"
            class="size-6 text-muted"
          />
        </div>
        <p class="mt-4 font-semibold text-highlighted">
          Nenhum agendamento para este dia
        </p>
        <p class="mt-1 text-sm text-muted">
          Os agendamentos feitos pelos clientes aparecem aqui na hora.
        </p>
      </div>
    </UCard>

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

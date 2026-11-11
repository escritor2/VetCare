<script setup lang="ts">
import { parseDate } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'

const date = defineModel<string>('date', { default: '' })
const time = defineModel<string>('time', { default: '' })

const minDate = todayISO()
const maxDate = maxBookingDate()

const calendarValue = computed({
  get: () => (date.value ? parseDate(date.value) : undefined),
  set: (v: DateValue | undefined) => {
    date.value = v ? v.toString().slice(0, 10) : ''
    time.value = ''
  }
})

function isDateDisabled(d: DateValue) {
  const iso = d.toString().slice(0, 10)
  return !isDiaUtil(iso) || iso < minDate || iso > maxDate
}

const { ocupados, pending } = useHorariosOcupados(date)
const { lotada } = useSemana(date)

const slots = computed(() => SLOT_TIMES.map(t => ({
  time: t,
  disabled: !date.value || lotada.value || ocupados.value.has(t) || isSlotPast(date.value, t)
})))

const livres = computed(() => slots.value.filter(s => !s.disabled).length)

// Se o horário escolhido for ocupado por outra pessoa enquanto a tela está aberta, desmarca
watch(slots, (list) => {
  if (time.value && list.find(s => s.time === time.value)?.disabled) time.value = ''
})
</script>

<template>
  <div class="grid grid-cols-1 gap-8 md:grid-cols-[auto_1fr]">
    <div class="flex justify-center md:justify-start">
      <UCalendar
        v-model="calendarValue"
        :min-value="parseDate(minDate)"
        :max-value="parseDate(maxDate)"
        :is-date-disabled="isDateDisabled"
        :week-starts-on="0"
      />
    </div>

    <div>
      <p
        v-if="!date"
        class="flex h-full min-h-32 items-center justify-center rounded-lg border border-dashed border-default p-6 text-center text-sm text-muted"
      >
        Escolha um dia no calendário para ver os horários livres.
      </p>

      <template v-else>
        <div class="mb-3 flex items-baseline justify-between gap-2">
          <p class="font-semibold capitalize text-highlighted">
            {{ formatLongDate(date) }}
          </p>
          <span
            v-if="!pending"
            class="text-xs text-muted"
          >
            {{ livres }} {{ livres === 1 ? 'horário livre' : 'horários livres' }}
          </span>
        </div>

        <UAlert
          v-if="lotada"
          color="warning"
          variant="subtle"
          icon="i-lucide-calendar-x"
          title="Semana lotada"
          description="A agenda desta semana já atingiu o limite. Escolha um dia em outra semana."
          class="mb-3"
        />

        <div
          v-if="pending"
          class="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6"
        >
          <USkeleton
            v-for="i in 12"
            :key="i"
            class="h-9"
          />
        </div>

        <div
          v-else
          class="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6"
        >
          <UButton
            v-for="s in slots"
            :key="s.time"
            :label="s.time"
            :disabled="s.disabled"
            :variant="time === s.time ? 'solid' : 'outline'"
            :color="time === s.time ? 'primary' : 'neutral'"
            block
            class="font-mono"
            :class="s.disabled && 'line-through'"
            @click="time = s.time"
          />
        </div>
      </template>
    </div>
  </div>
</template>

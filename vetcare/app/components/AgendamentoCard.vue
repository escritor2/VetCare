<script setup lang="ts">
import type { Agendamento } from '~/composables/useAgenda'

const props = defineProps<{
  agendamento: Agendamento
  /** Mostra dados do tutor (visão do admin) */
  showTutor?: boolean
  /** Mostra a data por extenso (visão do cliente) */
  showDate?: boolean
  cancelable?: boolean
  cancelling?: boolean
}>()

defineEmits<{ cancel: [] }>()

const whatsapp = computed(() => whatsappLink(props.agendamento.phone))
</script>

<template>
  <UCard class="appointment-card" :ui="{ body: 'p-4 sm:p-4' }">
    <div class="flex items-start gap-4">
      <div class="flex w-16 shrink-0 flex-col items-center rounded-lg bg-primary/10 py-2">
        <UIcon
          name="i-lucide-clock"
          class="size-4 text-primary"
        />
        <span class="mt-1 font-mono text-sm font-semibold text-highlighted">{{ agendamento.time }}</span>
      </div>

      <div class="min-w-0 flex-1 space-y-1">
        <p
          v-if="showDate"
          class="text-sm font-semibold capitalize text-primary"
        >
          {{ formatLongDate(agendamento.date) }}
        </p>

        <div class="flex flex-wrap items-center gap-2">
          <UIcon
            :name="speciesIcon(agendamento.species)"
            class="size-4 text-muted"
          />
          <span class="font-semibold text-highlighted">{{ agendamento.petName }}</span>
          <UBadge
            :label="agendamento.serviceType"
            :icon="SERVICE_ICONS[agendamento.serviceType]"
            :color="SERVICE_COLORS[agendamento.serviceType] ?? 'neutral'"
            variant="subtle"
          />
        </div>

        <p
          v-if="showTutor"
          class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted"
        >
          <span class="flex items-center gap-1">
            <UIcon
              name="i-lucide-user"
              class="size-4"
            />{{ agendamento.tutorName }}
          </span>
          <ULink
            v-if="whatsapp"
            :to="whatsapp"
            target="_blank"
            class="flex items-center gap-1 hover:text-primary"
          >
            <UIcon
              name="i-simple-icons-whatsapp"
              class="size-4"
            />{{ formatPhone(agendamento.phone) }}
          </ULink>
          <span
            v-else
            class="flex items-center gap-1"
          >
            <UIcon
              name="i-lucide-phone"
              class="size-4"
            />{{ formatPhone(agendamento.phone) }}
          </span>
        </p>

        <p
          v-if="agendamento.notes"
          class="text-sm text-default"
        >
          {{ agendamento.notes }}
        </p>
      </div>

      <UButton
        v-if="cancelable"
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        :loading="cancelling"
        aria-label="Cancelar agendamento"
        @click="$emit('cancel')"
      />
    </div>
  </UCard>
</template>

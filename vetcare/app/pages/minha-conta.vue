<script setup lang="ts">
import type { Pet, PetFields, TutorInput } from '~/composables/useClientes'

definePageMeta({ access: 'cliente' })
useSeoMeta({ title: 'Minha conta' })

const toast = useToast()
const report = useSyncReporter()
const { user } = useAuth()
const uid = computed(() => user.value?.uid)

const { data: tutor } = useTutor(uid)
const { pets, pending: petsPending } = usePets(uid)
const { proximo, historico, pending: agPending } = useMeusAgendamentos(uid)
const { cancel } = useAgendaActions()
const { createPet, updatePet, updateTutor } = useClientesActions()

const primeiroNome = computed(() => tutor.value?.nome.split(' ')[0] ?? '')

/* Pets */
const petModal = ref(false)
const editingPet = ref<Pet | null>(null)

function openNewPet() {
  editingPet.value = null
  petModal.value = true
}

function openEditPet(p: Pet) {
  editingPet.value = p
  petModal.value = true
}

function onSavePet(data: PetFields) {
  if (!uid.value) return
  if (editingPet.value) {
    report(updatePet(editingPet.value.id, data))
    toast.add({ title: 'Pet atualizado', color: 'success', icon: 'i-lucide-check-circle' })
  } else {
    report(createPet({ ...data, tutorId: uid.value }).synced)
    toast.add({ title: `${data.nome} cadastrado!`, color: 'success', icon: 'i-lucide-paw-print' })
  }
  petModal.value = false
}

/* Dados pessoais */
const dadosModal = ref(false)
function onSaveDados(data: TutorInput) {
  if (!uid.value) return
  report(updateTutor(uid.value, data))
  dadosModal.value = false
  toast.add({ title: 'Dados atualizados', color: 'success', icon: 'i-lucide-check-circle' })
}

/* Cancelamento */
const cancelling = ref(false)
async function onCancel() {
  if (!proximo.value || !confirm('Cancelar este agendamento?')) return
  cancelling.value = true
  try {
    await cancel(proximo.value)
    toast.add({ title: 'Agendamento cancelado', color: 'neutral', icon: 'i-lucide-calendar-x' })
  } catch (e) {
    const code = e instanceof AgendaError ? e.code : 'desconhecido'
    toast.add({ title: 'Não foi possível cancelar', description: code === 'offline' ? AGENDA_ERROR_MESSAGES.offline : 'Tente novamente.', color: 'error' })
  } finally {
    cancelling.value = false
  }
}
</script>

<template>
  <UContainer class="max-w-4xl pb-16">
    <AppPageHeader
      :title="primeiroNome ? `Olá, ${primeiroNome}!` : 'Minha conta'"
      description="Seus agendamentos e seus pets."
      icon="i-lucide-user"
    >
      <template #actions>
        <UButton
          variant="soft"
          color="neutral"
          icon="i-lucide-user-pen"
          @click="dadosModal = true"
        >
          Meus dados
        </UButton>
      </template>
    </AppPageHeader>

    <!-- Próximo agendamento -->
    <section class="mt-8">
      <h2 class="mb-3 font-semibold text-highlighted">
        Próximo agendamento
      </h2>

      <USkeleton
        v-if="agPending"
        class="h-24 w-full"
      />

      <AgendamentoCard
        v-else-if="proximo"
        :agendamento="proximo"
        show-date
        cancelable
        :cancelling="cancelling"
        @cancel="onCancel"
      />

      <UCard v-else>
        <div class="flex flex-col items-center gap-3 py-6 text-center">
          <span class="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <UIcon
              name="i-lucide-calendar-heart"
              class="size-6 text-primary"
            />
          </span>
          <p class="font-semibold text-highlighted">
            Nenhum agendamento marcado
          </p>
          <UButton
            to="/agendar"
            icon="i-lucide-calendar-plus"
          >
            Agendar consulta
          </UButton>
        </div>
      </UCard>
    </section>

    <!-- Pets -->
    <section class="mt-10">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="font-semibold text-highlighted">
          Meus pets
        </h2>
        <UButton
          size="sm"
          variant="soft"
          icon="i-lucide-plus"
          @click="openNewPet"
        >
          Adicionar pet
        </UButton>
      </div>

      <div
        v-if="petsPending"
        class="grid gap-4 sm:grid-cols-2"
      >
        <USkeleton
          v-for="i in 2"
          :key="i"
          class="h-24"
        />
      </div>

      <div
        v-else-if="pets.length"
        class="grid gap-4 sm:grid-cols-2"
      >
        <button
          v-for="p in pets"
          :key="p.id"
          type="button"
          class="card-hover flex items-center gap-4 rounded-lg bg-default p-4 text-left ring ring-default"
          @click="openEditPet(p)"
        >
          <PetAvatar
            :nome="p.nome"
            :especie="p.especie"
            :foto="p.foto"
            size="2xl"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-highlighted">
              {{ p.nome }}
            </p>
            <p class="truncate text-sm text-muted">
              {{ [p.especie, p.raca, idade(p.nascimento)].filter(Boolean).join(' · ') }}
            </p>
            <p
              v-if="p.observacoes"
              class="mt-1 truncate text-xs text-muted"
            >
              {{ p.observacoes }}
            </p>
          </div>
          <UIcon
            name="i-lucide-pencil"
            class="size-4 text-muted"
          />
        </button>
      </div>

      <UCard v-else>
        <p class="py-4 text-center text-sm text-muted">
          Cadastre seu pet para agendar consultas.
        </p>
      </UCard>
    </section>

    <!-- Histórico -->
    <section
      v-if="historico.length"
      class="mt-10"
    >
      <h2 class="mb-3 font-semibold text-highlighted">
        Histórico
      </h2>
      <ul class="space-y-3">
        <li
          v-for="a in historico"
          :key="a.id"
          class="opacity-80"
        >
          <AgendamentoCard
            :agendamento="a"
            show-date
          />
        </li>
      </ul>
    </section>

    <UModal
      v-model:open="petModal"
      :title="editingPet ? `Editar ${editingPet.nome}` : 'Adicionar pet'"
    >
      <template #body>
        <PetForm
          :key="editingPet?.id ?? 'novo'"
          :initial="editingPet"
          :submit-label="editingPet ? 'Salvar' : 'Cadastrar'"
          @submit="onSavePet"
          @cancel="petModal = false"
        />
      </template>
    </UModal>

    <UModal
      v-model:open="dadosModal"
      title="Meus dados"
    >
      <template #body>
        <TutorForm
          :initial="tutor"
          @submit="onSaveDados"
          @cancel="dadosModal = false"
        />
      </template>
    </UModal>
  </UContainer>
</template>

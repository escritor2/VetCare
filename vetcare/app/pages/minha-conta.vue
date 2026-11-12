<script setup lang="ts">
import type { Pet, PetFields, TutorInput } from '~/composables/useClientes'

definePageMeta({ access: 'cliente' })
useSeoMeta({ title: 'Minha conta' })

const toast = useToast()
const report = useSyncReporter()
const { user } = useAuth()
const uid = computed(() => user.value?.uid)

const { data: tutor, pending: tutorPending, error: tutorError } = useTutor(uid)
const { pets, pending: petsPending, error: petsError } = usePets(uid)
const { proximo, historico, pending: agPending, error: agError } = useMeusAgendamentos(uid)
const accountError = computed(() => tutorError.value || petsError.value || agError.value)
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
  <UContainer class="workspace-page account-page">
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
          :disabled="tutorPending || !tutor"
          @click="dadosModal = true"
        >
          Meus dados
        </UButton>
      </template>
    </AppPageHeader>

    <UAlert v-if="accountError" class="mt-6" title="Não foi possível carregar sua conta" :description="dataErrorMessage(accountError)" color="error" variant="subtle" icon="i-lucide-circle-alert" />

    <div v-if="!accountError" class="account-stats">
      <div><span class="stat-icon stat-pink"><UIcon name="i-lucide-paw-print" /></span><div><strong>{{ petsPending ? '—' : pets.length }}</strong><p>{{ pets.length === 1 ? 'pet na família' : 'pets na família' }}</p></div></div>
      <div><span class="stat-icon stat-blue"><UIcon name="i-lucide-calendar-heart" /></span><div><strong>{{ agPending ? '—' : proximo ? '1' : '0' }}</strong><p>consulta marcada</p></div></div>
      <div><span class="stat-icon stat-lilac"><UIcon name="i-lucide-history" /></span><div><strong>{{ agPending ? '—' : historico.length }}</strong><p>no histórico</p></div></div>
    </div>

    <div v-if="!accountError" class="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_24rem] xl:grid-cols-[1fr_28rem]">
      <div class="min-w-0 space-y-10">
        <!-- Próximo agendamento -->
        <section>
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

        <!-- Histórico -->
        <section
          v-if="historico.length"
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
      </div>

      <aside class="min-w-0">
        <!-- Pets -->
        <section>
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
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1"
          >
            <USkeleton
              v-for="i in 2"
              :key="i"
              class="h-24"
            />
          </div>

          <div
            v-else-if="pets.length"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1"
          >
            <button
              v-for="p in pets"
              :key="p.id"
              type="button"
              class="pet-summary-card card-hover flex items-center gap-4 rounded-lg bg-default p-4 text-left ring ring-default"
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
      </aside>
    </div>

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
          email-required
          @submit="onSaveDados"
          @cancel="dadosModal = false"
        />
      </template>
    </UModal>
  </UContainer>
</template>

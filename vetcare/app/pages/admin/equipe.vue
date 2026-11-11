<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import { FirebaseError } from 'firebase/app'
import type { NewStaff, StaffMember } from '~/composables/useStaff'

definePageMeta({ access: 'admin' })
useSeoMeta({ title: 'Equipe' })

const { user } = useAuth()
const { staff, pending, error } = useStaffList()
const { addStaff, removeStaff } = useStaffActions()
const toast = useToast()

const state = reactive<NewStaff>({ nome: '', email: '', senha: '' })
const saving = ref(false)
const formError = ref('')

function validate(s: Partial<NewStaff>): FormError[] {
  const errors: FormError[] = []
  if (!s.nome?.trim()) errors.push({ name: 'nome', message: 'Informe o nome' })
  if (!s.email?.trim()) errors.push({ name: 'email', message: 'Informe o e-mail' })
  if (!s.senha || s.senha.length < 8) errors.push({ name: 'senha', message: 'Mínimo de 8 caracteres' })
  return errors
}

function describeError(e: unknown) {
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case 'auth/email-already-in-use':
        return 'Já existe uma conta com este e-mail.'
      case 'auth/invalid-email':
        return 'E-mail inválido.'
      case 'auth/weak-password':
        return 'Senha muito fraca.'
      case 'auth/network-request-failed':
        return 'Sem conexão com a internet.'
      case 'permission-denied':
        return 'Sem permissão. Confira se as regras do Firestore foram publicadas.'
    }
  }
  return 'Não foi possível cadastrar. Tente novamente.'
}

async function onSubmit() {
  saving.value = true
  formError.value = ''
  try {
    const nome = state.nome.trim()
    await addStaff({ nome, email: state.email.trim(), senha: state.senha })
    toast.add({
      title: 'Admin cadastrado',
      description: `${nome} já pode entrar com o e-mail e a senha informados.`,
      color: 'success',
      icon: 'i-lucide-user-check'
    })
    Object.assign(state, { nome: '', email: '', senha: '' })
  } catch (e) {
    formError.value = describeError(e)
  } finally {
    saving.value = false
  }
}

async function onRemove(member: StaffMember) {
  if (!confirm(`Remover o acesso de ${member.nome || member.email}?`)) return
  try {
    await removeStaff(member.uid)
    toast.add({ title: 'Acesso removido', color: 'neutral', icon: 'i-lucide-user-x' })
  } catch {
    toast.add({ title: 'Não foi possível remover', color: 'error', icon: 'i-lucide-circle-alert' })
  }
}
</script>

<template>
  <UContainer class="pb-12">
    <AppPageHeader
      title="Equipe"
      description="Administradores com acesso ao VetCare. Todos têm o mesmo nível de acesso."
      icon="i-lucide-shield-check"
    />

    <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
      <!-- Lista -->
      <section class="space-y-3 lg:col-span-3">
        <h2 class="font-semibold text-highlighted">
          Administradores
          <UBadge
            v-if="!pending"
            :label="String(staff.length)"
            variant="subtle"
            class="ms-1"
          />
        </h2>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          title="Não foi possível carregar a equipe"
          :description="error.message"
        />

        <template v-else-if="pending">
          <USkeleton
            v-for="i in 3"
            :key="i"
            class="h-16 w-full"
          />
        </template>

        <ul
          v-else
          class="space-y-3"
        >
          <li
            v-for="member in staff"
            :key="member.uid"
          >
            <UCard :ui="{ body: 'p-4 sm:p-4' }">
              <div class="flex items-center gap-3">
                <UAvatar
                  :alt="member.nome || member.email"
                  size="md"
                />
                <div class="min-w-0 flex-1">
                  <p class="flex items-center gap-2 font-medium text-highlighted">
                    <span class="truncate">{{ member.nome || 'Sem nome' }}</span>
                    <UBadge
                      v-if="member.uid === user?.uid"
                      label="Você"
                      color="neutral"
                      variant="outline"
                      size="sm"
                    />
                  </p>
                  <p class="truncate text-sm text-muted">
                    {{ member.email || member.uid }}
                  </p>
                </div>
                <UButton
                  v-if="member.uid !== user?.uid"
                  icon="i-lucide-user-x"
                  color="neutral"
                  variant="ghost"
                  aria-label="Remover acesso"
                  @click="onRemove(member)"
                />
              </div>
            </UCard>
          </li>
        </ul>
      </section>

      <!-- Novo admin -->
      <section class="lg:col-span-2">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2 font-semibold text-highlighted">
              <UIcon
                name="i-lucide-user-plus"
                class="size-5 text-primary"
              />
              Novo administrador
            </div>
          </template>

          <UForm
            :state="state"
            :validate="validate"
            class="space-y-4"
            @submit="onSubmit"
          >
            <UFormField
              label="Nome"
              name="nome"
            >
              <UInput
                v-model="state.nome"
                placeholder="Ex: Dra. Ana Souza"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="E-mail"
              name="email"
            >
              <UInput
                v-model="state.email"
                type="email"
                autocomplete="off"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Senha inicial"
              name="senha"
              help="Passe para a pessoa; ela pode trocar depois em “Esqueci minha senha”."
            >
              <UInput
                v-model="state.senha"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </UFormField>

            <UAlert
              v-if="formError"
              :description="formError"
              color="error"
              variant="subtle"
              icon="i-lucide-circle-alert"
            />

            <UButton
              type="submit"
              :loading="saving"
              icon="i-lucide-user-plus"
              block
            >
              Cadastrar
            </UButton>
          </UForm>
        </UCard>
      </section>
    </div>
  </UContainer>
</template>

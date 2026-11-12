<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import { FirebaseError } from 'firebase/app'

definePageMeta({ access: 'guest' })
useSeoMeta({ title: 'Criar conta' })

const { role, signupCliente, completeProfile, logout } = useAuth()
const route = useRoute()

/** Logou mas não terminou o cadastro: só pede nome/telefone */
const completing = computed(() => role.value === 'incompleto')

const redirect = computed(() => {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : '/minha-conta'
})

const state = reactive({ nome: '', telefone: '', email: '', senha: '', aceite: false })
const loading = ref(false)
const errorMessage = ref('')

function validate(s: Partial<typeof state>): FormError[] {
  const errors: FormError[] = []
  errors.push(...validateTutorFields(s, !completing.value))
  if (!completing.value) {
    if (passwordError(s.senha)) errors.push({ name: 'senha', message: passwordError(s.senha) })
  }
  if (!s.aceite) errors.push({ name: 'aceite', message: 'É preciso aceitar para continuar' })
  return errors
}

function describeError(e: unknown) {
  if (e instanceof InputValidationError) return e.message
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case 'auth/email-already-in-use':
        return 'Já existe uma conta com este e-mail. Entre ou use “Esqueci minha senha”.'
      case 'auth/invalid-email':
        return 'E-mail inválido.'
      case 'auth/weak-password':
        return 'Senha muito fraca.'
      case 'auth/network-request-failed':
        return 'Sem conexão com a internet.'
    }
  }
  return 'Não foi possível criar a conta. Tente novamente.'
}

async function onSubmit() {
  if (loading.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const nome = state.nome.trim()
    const telefone = formatPhone(state.telefone)
    if (completing.value) {
      await completeProfile({ nome, telefone })
    } else {
      await signupCliente({ nome, telefone, email: normalizeEmail(state.email), senha: state.senha })
    }
    await navigateTo(redirect.value)
  } catch (e) {
    errorMessage.value = describeError(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthPageShell title="Uma conta. Muitos momentos juntos." description="Deixe os cuidados organizados e aproveite o que mais importa: a companhia do seu pet." tone="pink">
    <UCard class="auth-card">
      <div class="auth-form-heading">
        <span class="auth-form-icon"><UIcon name="i-lucide-paw-print" /></span>
        <p class="workspace-eyebrow">Comece por aqui</p>
        <h1>
          {{ completing ? 'Complete seu cadastro' : 'Crie sua conta' }}
        </h1>
        <p class="text-sm text-muted">
          Para agendar consultas e acompanhar seus pets.
        </p>
      </div>

      <UForm
        :state="state"
        :validate="validate"
        novalidate
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Nome completo"
          name="nome"
        >
          <UInput
            v-model="state.nome"
            autocomplete="name"
            :maxlength="120"
            icon="i-lucide-user"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Telefone / WhatsApp"
          name="telefone"
        >
          <PhoneInput
            v-model="state.telefone"
            class="w-full"
          />
        </UFormField>

        <template v-if="!completing">
          <UFormField
            label="E-mail"
            name="email"
          >
            <EmailInput
              v-model="state.email"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Senha"
            name="senha"
            help="Mínimo de 8 caracteres."
          >
            <PasswordInput
              v-model="state.senha"
              autocomplete="new-password"
              :maxlength="128"
              class="w-full"
            />
          </UFormField>
        </template>

        <UFormField name="aceite">
          <UCheckbox v-model="state.aceite">
            <template #label>
              <span class="text-sm">
                Li e aceito a
                <ULink
                  to="/privacidade"
                  target="_blank"
                  class="font-semibold text-primary"
                >política de privacidade</ULink>
                e autorizo o uso dos meus dados para agendamentos e contato da clínica.
              </span>
            </template>
          </UCheckbox>
        </UFormField>

        <UAlert
          v-if="errorMessage"
          :description="errorMessage"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
        />

        <UButton
          type="submit"
          :loading="loading"
          block
        >
          {{ completing ? 'Concluir cadastro' : 'Criar conta' }}
        </UButton>

        <UButton
          v-if="completing"
          variant="link"
          color="neutral"
          size="sm"
          block
          @click="logout"
        >
          Sair
        </UButton>
      </UForm>

      <template
        v-if="!completing"
        #footer
      >
        <p class="text-center text-sm text-muted">
          Já tem conta?
          <ULink
            :to="{ path: '/login', query: route.query.redirect ? { redirect: route.query.redirect } : {} }"
            class="font-semibold text-primary"
          >
            Entrar
          </ULink>
        </p>
      </template>
    </UCard>
  </AuthPageShell>
</template>

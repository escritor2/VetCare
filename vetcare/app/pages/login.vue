<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import { FirebaseError } from 'firebase/app'

definePageMeta({ access: 'guest' })
useSeoMeta({ title: 'Entrar' })

const { login, resetPassword, homePath } = useAuth()
const route = useRoute()

const redirect = computed(() => {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : ''
})

const state = reactive({ email: '', password: '' })
const loading = ref(false)
const resetting = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

function validate(s: Partial<typeof state>): FormError[] {
  const errors: FormError[] = []
  if (emailError(s.email)) errors.push({ name: 'email', message: emailError(s.email) })
  if (!s.password) errors.push({ name: 'password', message: 'Informe a senha' })
  return errors
}

function describeError(e: unknown) {
  if (e instanceof InputValidationError) return e.message
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'E-mail ou senha incorretos.'
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
      case 'auth/network-request-failed':
        return 'Sem conexão com a internet.'
    }
  }
  return 'Não foi possível entrar. Tente novamente.'
}

async function onSubmit() {
  if (loading.value || resetting.value) return
  loading.value = true
  errorMessage.value = ''
  infoMessage.value = ''
  try {
    await login(normalizeEmail(state.email), state.password)
    // Admin sempre cai no painel; cliente volta para onde estava (ex.: agendamento)
    await navigateTo(redirect.value && homePath.value !== '/admin' ? redirect.value : homePath.value)
  } catch (e) {
    errorMessage.value = describeError(e)
  } finally {
    loading.value = false
  }
}

async function onForgotPassword() {
  if (resetting.value || loading.value) return
  errorMessage.value = ''
  infoMessage.value = ''
  const email = normalizeEmail(state.email)
  if (emailError(email)) {
    errorMessage.value = emailError(email)
    return
  }
  resetting.value = true
  try {
    await resetPassword(email)
  } catch (e) {
    if (e instanceof FirebaseError && e.code === 'auth/network-request-failed') {
      errorMessage.value = 'Sem conexão com a internet.'
      return
    }
    // Outros erros: mesma mensagem, para não revelar quais e-mails existem
  } finally {
    resetting.value = false
  }
  infoMessage.value = `Se ${email} tiver conta, você vai receber um e-mail para redefinir a senha. Confira também o spam.`
}
</script>

<template>
  <AuthPageShell title="Mais perto de quem faz seu coração feliz." description="Consultas, cuidados e histórias de uma vida inteira. Tudo começa com um carinho.">
    <UCard class="auth-card">
      <div class="auth-form-heading">
        <span class="auth-form-icon"><UIcon name="i-lucide-heart-handshake" /></span>
        <p class="workspace-eyebrow">Bom ter você aqui</p>
        <h1>
          Bem-vindo de volta.
        </h1>
        <p class="text-sm text-muted">
          Entre para agendar e acompanhar seu pet.
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
          label="E-mail"
          name="email"
        >
          <EmailInput
            v-model="state.email"
            autocomplete="username"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Senha"
          name="password"
        >
          <PasswordInput
            v-model="state.password"
            autocomplete="current-password"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="errorMessage"
          :description="errorMessage"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
        />

        <UAlert
          v-if="infoMessage"
          :description="infoMessage"
          color="info"
          variant="subtle"
          icon="i-lucide-mail-check"
        />

        <UButton
          type="submit"
          :loading="loading"
          :disabled="resetting"
          block
        >
          Entrar
        </UButton>

        <UButton
          variant="link"
          color="neutral"
          size="sm"
          block
          :disabled="loading"
          :loading="resetting"
          @click="onForgotPassword"
        >
          Esqueci minha senha
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-muted">
          Ainda não tem conta?
          <ULink
            :to="{ path: '/cadastro', query: redirect ? { redirect } : {} }"
            class="font-semibold text-primary"
          >
            Criar conta
          </ULink>
        </p>
      </template>
    </UCard>
  </AuthPageShell>
</template>

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
const errorMessage = ref('')
const infoMessage = ref('')

function validate(s: Partial<typeof state>): FormError[] {
  const errors: FormError[] = []
  if (!s.email?.trim()) errors.push({ name: 'email', message: 'Informe o e-mail' })
  if (!s.password) errors.push({ name: 'password', message: 'Informe a senha' })
  return errors
}

function describeError(e: unknown) {
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
  loading.value = true
  errorMessage.value = ''
  infoMessage.value = ''
  try {
    await login(state.email.trim(), state.password)
    // Admin sempre cai no painel; cliente volta para onde estava (ex.: agendamento)
    await navigateTo(redirect.value && homePath.value !== '/admin' ? redirect.value : homePath.value)
  } catch (e) {
    errorMessage.value = describeError(e)
  } finally {
    loading.value = false
  }
}

async function onForgotPassword() {
  errorMessage.value = ''
  infoMessage.value = ''
  const email = state.email.trim()
  if (!email) {
    errorMessage.value = 'Digite seu e-mail no campo acima e clique de novo em “Esqueci minha senha”.'
    return
  }
  try {
    await resetPassword(email)
  } catch (e) {
    if (e instanceof FirebaseError && e.code === 'auth/network-request-failed') {
      errorMessage.value = 'Sem conexão com a internet.'
      return
    }
    // Outros erros: mesma mensagem, para não revelar quais e-mails existem
  }
  infoMessage.value = `Se ${email} tiver conta, você vai receber um e-mail para redefinir a senha. Confira também o spam.`
}
</script>

<template>
  <UContainer class="flex min-h-[70vh] items-center justify-center py-12">
    <UCard class="w-full max-w-sm">
      <div class="mb-6 flex flex-col items-center text-center">
        <AppLogo />
        <h1 class="mt-4 text-xl font-bold text-highlighted">
          Bem-vindo de volta
        </h1>
        <p class="mt-1 text-sm text-muted">
          Entre para agendar e acompanhar seu pet.
        </p>
      </div>

      <UForm
        :state="state"
        :validate="validate"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="E-mail"
          name="email"
        >
          <UInput
            v-model="state.email"
            type="email"
            autocomplete="username"
            icon="i-lucide-mail"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Senha"
          name="password"
        >
          <UInput
            v-model="state.password"
            type="password"
            autocomplete="current-password"
            icon="i-lucide-lock"
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
          block
        >
          Entrar
        </UButton>

        <UButton
          variant="link"
          color="neutral"
          size="sm"
          block
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
  </UContainer>
</template>

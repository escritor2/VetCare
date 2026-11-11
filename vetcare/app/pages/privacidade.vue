<script setup lang="ts">
definePageMeta({ access: 'public' })
useSeoMeta({ title: 'Política de privacidade' })

// TODO: revisar este texto com a clínica antes de publicar
const { clinica } = useAppConfig()
</script>

<template>
  <UContainer class="max-w-3xl pb-16">
    <AppPageHeader
      title="Política de privacidade"
      :description="`Como a ${clinica.nome} trata seus dados, conforme a LGPD (Lei 13.709/2018).`"
      icon="i-lucide-shield"
    />

    <div class="mt-8 space-y-6 text-default [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-highlighted [&_p]:mt-2 [&_p]:text-muted">
      <section>
        <h2>Quais dados coletamos</h2>
        <p>
          Nome, telefone e e-mail do tutor; nome, espécie, raça, sexo, data de nascimento, foto e observações
          de saúde do pet; e os agendamentos realizados.
        </p>
      </section>

      <section>
        <h2>Para que usamos</h2>
        <p>
          Exclusivamente para agendar e realizar os atendimentos, manter o histórico clínico do pet e entrar em
          contato sobre consultas, vacinas e retornos. Não vendemos nem compartilhamos seus dados com terceiros
          para fins de marketing.
        </p>
      </section>

      <section>
        <h2>Onde ficam guardados</h2>
        <p>
          Em servidores do Google Firebase na região de São Paulo, com acesso restrito à equipe da clínica.
          Cada cliente só consegue ver os próprios dados.
        </p>
      </section>

      <section>
        <h2>Seus direitos</h2>
        <p>
          Você pode, a qualquer momento, pedir acesso, correção ou exclusão dos seus dados e revogar este
          consentimento, entrando em contato pelo e-mail
          <ULink
            :to="`mailto:${clinica.email}`"
            class="text-primary"
          >{{ clinica.email }}</ULink>
          ou pelo telefone {{ clinica.telefone }}.
        </p>
      </section>
    </div>
  </UContainer>
</template>

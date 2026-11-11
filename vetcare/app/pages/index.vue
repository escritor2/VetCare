<script setup lang="ts">
definePageMeta({ access: 'public' })

const { clinica } = useAppConfig()
const waUrl = `https://wa.me/${clinica.whatsapp}`
const telUrl = `tel:${clinica.telefone.replace(/\D/g, '')}`
const { slogan, horario, telefone } = clinica
const { isAdmin } = useAuth()

const servicos = [
  { nome: 'Consulta de Rotina', texto: 'Check-up completo para acompanhar a saúde do seu pet em todas as fases da vida.' },
  { nome: 'Vacinação', texto: 'Calendário de vacinas em dia, com orientação sobre cada dose.' },
  { nome: 'Retorno', texto: 'Acompanhamento após consultas e tratamentos, sem complicação.' },
  { nome: 'Exames', texto: 'Coleta e solicitação de exames para um diagnóstico preciso.' }
]

const passos = [
  { icon: 'i-lucide-user-plus', titulo: 'Crie sua conta', texto: 'Leva menos de um minuto. Cadastre também seu pet.' },
  { icon: 'i-lucide-calendar-check', titulo: 'Escolha dia e horário', texto: 'Veja na hora os horários livres e escolha o melhor para você.' },
  { icon: 'i-lucide-heart-handshake', titulo: 'Pronto!', texto: 'É só vir. Você acompanha e cancela pelo app, se precisar.' }
]

const contatos = computed(() => [
  { icon: 'i-lucide-phone', titulo: 'Telefone', valor: clinica.telefone, to: telUrl },
  { icon: 'i-simple-icons-whatsapp', titulo: 'WhatsApp', valor: 'Fale com a gente', to: waUrl },
  { icon: 'i-lucide-mail', titulo: 'E-mail', valor: clinica.email, to: `mailto:${clinica.email}` },
  { icon: 'i-lucide-map-pin', titulo: 'Endereço', valor: clinica.endereco, to: clinica.mapsUrl }
])
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-primary/10 blur-3xl" />
      <div class="pointer-events-none absolute -bottom-40 -left-24 size-[22rem] rounded-full bg-secondary/10 blur-3xl" />

      <UContainer class="relative grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
        <div>
          <UBadge
            label="Clínica veterinária"
            icon="i-lucide-paw-print"
            variant="subtle"
            class="mb-4"
          />
          <h1 class="text-4xl font-extrabold leading-tight tracking-tight text-highlighted sm:text-5xl">
            {{ slogan }}
          </h1>
          <p class="mt-4 max-w-lg text-lg text-muted">
            Consultas, vacinas e exames com uma equipe que trata seu pet como da família.
            Agende online em poucos cliques.
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <UButton
              :to="isAdmin ? '/admin' : '/agendar'"
              size="xl"
              icon="i-lucide-calendar-plus"
            >
              {{ isAdmin ? 'Abrir agenda' : 'Agendar consulta' }}
            </UButton>
            <UButton
              :to="waUrl"
              target="_blank"
              size="xl"
              color="neutral"
              variant="outline"
              icon="i-simple-icons-whatsapp"
            >
              WhatsApp
            </UButton>
          </div>

          <p class="mt-6 flex items-center gap-2 text-sm text-muted">
            <UIcon
              name="i-lucide-clock"
              class="size-4 text-primary"
            />
            {{ horario }}
          </p>
        </div>

        <!-- Ilustração (troque por uma foto real da clínica em /public/img) -->
        <div class="relative mx-auto hidden aspect-square w-full max-w-md md:block">
          <div class="absolute inset-6 rounded-[3rem] bg-gradient-to-br from-primary-200 to-primary-400 dark:from-primary-800 dark:to-primary-600" />
          <div class="absolute inset-0 flex items-center justify-center">
            <UIcon
              name="i-lucide-dog"
              class="size-48 text-white/90 drop-shadow-lg"
            />
          </div>
          <div class="absolute bottom-10 -left-4 flex items-center gap-3 rounded-xl bg-default p-3 shadow-lg ring ring-default">
            <span class="flex size-10 items-center justify-center rounded-full bg-secondary/15">
              <UIcon
                name="i-lucide-calendar-check"
                class="size-5 text-secondary"
              />
            </span>
            <div class="text-sm">
              <p class="font-semibold text-highlighted">
                Agendamento online
              </p>
              <p class="text-muted">
                Rápido e sem ligação
              </p>
            </div>
          </div>
          <div class="absolute right-0 top-10 flex items-center gap-3 rounded-xl bg-default p-3 shadow-lg ring ring-default">
            <span class="flex size-10 items-center justify-center rounded-full bg-primary/15">
              <UIcon
                name="i-lucide-cat"
                class="size-5 text-primary"
              />
            </span>
            <p class="text-sm font-semibold text-highlighted">
              Cães e gatos
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Serviços -->
    <section class="bg-elevated/50 py-16">
      <UContainer>
        <h2 class="text-center text-3xl font-bold text-highlighted">
          Nossos serviços
        </h2>
        <p class="mx-auto mt-2 max-w-xl text-center text-muted">
          Tudo o que seu pet precisa para viver bem, num só lugar.
        </p>

        <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <UCard
            v-for="s in servicos"
            :key="s.nome"
            class="card-hover"
          >
            <span class="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <UIcon
                :name="SERVICE_ICONS[s.nome] ?? 'i-lucide-paw-print'"
                class="size-6 text-primary"
              />
            </span>
            <h3 class="mt-4 font-semibold text-highlighted">
              {{ s.nome }}
            </h3>
            <p class="mt-1 text-sm text-muted">
              {{ s.texto }}
            </p>
          </UCard>
        </div>
      </UContainer>
    </section>

    <!-- Como funciona -->
    <section class="py-16">
      <UContainer>
        <h2 class="text-center text-3xl font-bold text-highlighted">
          Como agendar
        </h2>
        <div class="mt-10 grid gap-8 md:grid-cols-3">
          <div
            v-for="(p, i) in passos"
            :key="p.titulo"
            class="text-center"
          >
            <div class="relative mx-auto flex size-16 items-center justify-center rounded-full bg-primary text-inverted shadow-md">
              <UIcon
                :name="p.icon"
                class="size-7"
              />
              <span class="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-inverted">
                {{ i + 1 }}
              </span>
            </div>
            <h3 class="mt-4 font-semibold text-highlighted">
              {{ p.titulo }}
            </h3>
            <p class="mt-1 text-sm text-muted">
              {{ p.texto }}
            </p>
          </div>
        </div>

        <div class="mt-10 text-center">
          <UButton
            to="/agendar"
            size="lg"
            trailing-icon="i-lucide-arrow-right"
          >
            Ver horários livres
          </UButton>
        </div>
      </UContainer>
    </section>

    <!-- Emergência -->
    <section class="pb-16">
      <UContainer>
        <div class="flex flex-col items-center justify-between gap-4 rounded-2xl bg-secondary p-6 text-inverted sm:flex-row sm:p-8">
          <div class="flex items-center gap-4">
            <UIcon
              name="i-lucide-siren"
              class="size-10 shrink-0"
            />
            <div>
              <p class="text-lg font-bold">
                É uma emergência?
              </p>
              <p class="text-sm opacity-90">
                Não espere pelo agendamento online. Ligue agora para a clínica.
              </p>
            </div>
          </div>
          <UButton
            :to="telUrl"
            color="neutral"
            variant="solid"
            size="lg"
            icon="i-lucide-phone"
            class="shrink-0"
          >
            {{ telefone }}
          </UButton>
        </div>
      </UContainer>
    </section>

    <!-- Contato -->
    <section
      id="contato"
      class="bg-elevated/50 py-16"
    >
      <UContainer>
        <h2 class="text-center text-3xl font-bold text-highlighted">
          Contato
        </h2>
        <p class="mt-2 text-center text-muted">
          {{ horario }}
        </p>

        <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ULink
            v-for="c in contatos"
            :key="c.titulo"
            :to="c.to"
            target="_blank"
            class="card-hover flex items-start gap-3 rounded-lg bg-default p-4 ring ring-default"
          >
            <UIcon
              :name="c.icon"
              class="mt-0.5 size-5 shrink-0 text-primary"
            />
            <div class="min-w-0">
              <p class="font-semibold text-highlighted">
                {{ c.titulo }}
              </p>
              <p class="break-words text-sm text-muted">
                {{ c.valor }}
              </p>
            </div>
          </ULink>
        </div>
      </UContainer>
    </section>
  </div>
</template>

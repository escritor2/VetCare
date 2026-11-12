export default defineAppConfig({
  ui: {
    colors: {
      primary: 'lagoon',
      secondary: 'clay',
      neutral: 'slate'
    },
    button: { slots: { base: 'rounded-full font-bold' } },
    input: { slots: { base: 'rounded-[12px]' }, defaultVariants: { size: 'lg' } },
    textarea: { slots: { base: 'rounded-[12px]' }, defaultVariants: { size: 'lg' } },
    select: { slots: { base: 'rounded-[12px]' }, defaultVariants: { size: 'lg' } },
    selectMenu: { slots: { base: 'rounded-[12px]' }, defaultVariants: { size: 'lg' } },
    card: { slots: { root: 'rounded-[24px] shadow-sm', header: 'border-default', footer: 'border-default' } },
    modal: { slots: { content: 'rounded-[24px]', title: 'font-extrabold tracking-tight' } },
    formField: { slots: { label: 'font-bold', error: 'leading-relaxed' } },
    alert: { slots: { root: 'rounded-[16px]' } },
    calendar: { slots: { root: 'rounded-[18px]', heading: 'font-extrabold' } }
  },

  // Dados da clínica exibidos no site.
  // TODO: substituir pelos dados reais da VetCare.
  clinica: {
    nome: 'VetCare',
    slogan: 'Cuidado com carinho para quem é da família.',
    telefone: '(19) 3333-0000',
    whatsapp: '5519999990000', // só números, com DDI 55 + DDD
    email: 'contato@vetcare.com.br',
    endereco: 'Rua das Flores, 123 — Centro, Campinas/SP',
    mapsUrl: 'https://maps.google.com/?q=Rua+das+Flores+123+Campinas',
    horario: 'Segunda a sexta, das 8h às 19h',
    instagram: ''
  }
})

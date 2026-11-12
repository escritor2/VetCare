# Formulários

As regras compartilhadas estão em `app/utils/validation.ts`. As telas e as funções de gravação usam as mesmas validações antes de chamar o Firebase.

- Telefones brasileiros: DDD, fixo com oito dígitos ou celular iniciado por 9 com nove dígitos. A máscara aceita colagem com `+55` e preserva números excedentes para que sejam sinalizados, em vez de salvar um telefone cortado.
- E-mails: formato, domínio, limites de tamanho e pontos inválidos. E-mails opcionais podem ficar vazios. A validação de formato não comprova a existência ou a titularidade da caixa postal.
- Senhas novas: 8 a 128 caracteres; senhas compostas apenas de espaços são rejeitadas. Senhas não são aparadas automaticamente.
- Nomes, endereços e observações respeitam os limites definidos nas regras do banco.
- Datas dos pets precisam existir no calendário e não podem estar no futuro. Datas de agendamento são limitadas a dias úteis e ao período permitido.
- Formulários com envio em andamento bloqueiam novos envios.

`PhoneInput`, `EmailInput` e `PasswordInput` mantêm o comportamento consistente entre cadastro, edição e administração.

## Verificação

Execute `npm test`, `npm run typecheck` e `npm run generate`. A suíte de validação usa o test runner do Node.js, sem dependências adicionais, e requer Node.js 22.18+ ou 24+ para importar TypeScript diretamente.

As restrições de formato de telefone e e-mail também foram adicionadas a `firestore.rules`. Elas precisam ser publicadas no Firebase para valer no servidor. Registros antigos com contatos malformados precisarão ser corrigidos ao editar. A suíte local não substitui testes de integração das regras no emulador do Firestore.

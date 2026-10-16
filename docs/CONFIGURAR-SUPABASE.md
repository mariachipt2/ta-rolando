# Conectar o seu Supabase

1. Crie um projeto Supabase. Guarde a senha do banco no seu gerenciador de senhas; a aplicação não precisa dela.
2. Abra **SQL Editor → New query**. Execute o conteúdo de `supabase/migrations/001_initial.sql`. Em seguida, execute `002_storage.sql` e `003_admin_totals.sql`. Execute cada migration uma única vez neste projeto novo.
3. Em **Project Settings → API / API Keys**, copie a URL do projeto, a Publishable key (ou anon) e a Secret key (ou service_role).
4. Abra `.env.local` no VS Code. Preencha:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
   SUPABASE_SECRET_KEY=SUA_CHAVE_SECRETA
   NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
   ```

   `VISITOR_SECRET` e `CRON_SECRET` já podem ser gerados por `node scripts/prepare-env.mjs`. Nunca coloque a chave secreta em uma variável `NEXT_PUBLIC_`. Não envie este arquivo ao GitHub nem pelo chat.
5. No Supabase, abra **Authentication → Users → Add user**. Crie sua conta administrativa com seu e-mail e uma senha forte. Desative cadastro público em Authentication, pois visitantes não precisam de contas.
6. Copie o UUID dessa conta e execute no SQL Editor, substituindo o texto:

   ```sql
   insert into public.admin_profiles(user_id, active)
   values ('UUID-DA-SUA-CONTA', true);
   ```

7. Configure a URL do site do Supabase Auth para `http://127.0.0.1:3000` no desenvolvimento. Reinicie o servidor Next.js após preencher as variáveis.
8. Acesse `/admin`, entre, crie uma categoria ou use as 13 iniciais. Cadastre o primeiro evento, envie sua capa e publique.
9. Abra o evento no site público, marque “Eu vou!”, confira Minha Agenda e retire a marcação. Recarregue para verificar a persistência. Repita em outro navegador para verificar o isolamento das agendas.

## Antes da publicação

- Crie um widget **Cloudflare Turnstile**, com seu domínio permitido, e configure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY`. Em produção, novas marcações falham de forma segura se a proteção estiver ausente. Em `npm run dev`, a ausência das chaves permite desenvolvimento local; não há esse bypass em produção.
- Defina `NEXT_PUBLIC_SITE_URL` com o domínio HTTPS definitivo. Cadastre o domínio no Supabase Auth.
- Preencha identificação e contato do responsável em `src/app/privacidade/page.tsx`, revise as informações conforme a operação real e a LGPD. O código sozinho não certifica conformidade jurídica.
- Configure backups conforme o plano Supabase escolhido; mantenha migrations versionadas.
- A rotina `GET /api/maintenance`, protegida por `Authorization: Bearer CRON_SECRET`, deve rodar diariamente. `vercel.json` já declara o horário 06:00 UTC. Confirme sua execução no provedor. Ela remove identificadores associados a eventos encerrados há mais de 180 dias e registros antigos de limitação; os totais diários agregados ficam preservados.
- Ative limites de tráfego no provedor de hospedagem. Turnstile e limites por identificador reduzem abuso, mas não impedem uma pessoa de usar outros navegadores.
- Verifique em ambiente de homologação login, revogação de administrador, uploads, calendário, dispositivos reais e instalação PWA antes de abrir ao público.

Referências: [SSR e cookies do Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Next.js](https://nextjs.org/docs/app/getting-started/installation).


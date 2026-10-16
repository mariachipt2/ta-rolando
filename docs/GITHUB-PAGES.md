# Publicar no GitHub Pages

O projeto agora tem uma versão estática própria para o Pages, que reutiliza a interface e o banco. A versão Next.js também foi preservada. No Pages, as rotas usam `#/`: por exemplo `https://mariachipt2.github.io/ta-rolando/#/admin`. Isso permite atualizar a página e compartilhar links sem depender de um servidor Node.

## 1. Abrir o site

No repositório, acesse **Settings → Pages → Build and deployment → Source → GitHub Actions**. O workflow `.github/workflows/pages.yml` compila e publica a cada push para master/main. Também pode ser acionado em **Actions → Publicar Tá Rolando no GitHub Pages → Run workflow**.

Endereço: **https://mariachipt2.github.io/ta-rolando/**.

Se o repositório usar publicação por branch, troque para GitHub Actions. O código-fonte Next.js não é um site estático e não deve ser servido diretamente pela branch.

## 2. Conectar eventos e painel

Execute as três migrations do guia Supabase. No GitHub, abra **Settings → Secrets and variables → Actions → Variables** e cadastre somente:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

Esses valores são públicos e entram no JavaScript. **Nunca inclua service_role, Secret key, VISITOR_SECRET ou TURNSTILE_SECRET_KEY no build do Pages.** O build não lê essas chaves privadas.

Publique novamente após definir as variáveis. Acesse `#/admin` com a conta autorizada em `admin_profiles`. Supabase Auth mantém a sessão; as políticas RLS do PostgreSQL e Storage autorizam as alterações, independentemente da interface.

Em Supabase Auth, ajuste Site URL para o endereço do Pages. Não há cadastro público de visitantes.

## 3. Habilitar “Eu vou!” com proteção

As operações anônimas precisam de código servidor. No Pages, ele é executado como uma **Supabase Edge Function**, não no GitHub:

1. Em Supabase → Edge Functions, crie `public-events` e use `supabase/functions/public-events/index.ts`. Ou, com a CLI Supabase autenticada: `supabase functions deploy public-events --project-ref SEU_PROJECT_REF`.
2. Desative **Verify JWT** apenas nessa função pública. A configuração versionada já faz isso via CLI. Os visitantes não precisam de conta; o endpoint verifica entrada, origem permitida, limite de requisições e Turnstile. As funções SQL privilegiadas continuam inacessíveis diretamente a anon/authenticated.
3. Nos **Secrets das Edge Functions**, defina:
   - `VISITOR_SECRET`: segredo aleatório com pelo menos 32 caracteres.
   - `TURNSTILE_SECRET_KEY`: segredo do widget Turnstile.
   - `ALLOWED_ORIGINS`: `https://mariachipt2.github.io` (sem `/ta-rolando/`). Para teste local, acrescente `,http://127.0.0.1:4173`.
4. Autorize `mariachipt2.github.io` no widget Turnstile e use sua site key nas variáveis públicas do GitHub.
5. A função usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` fornecidos pelo ambiente Supabase; não os coloque nos arquivos estáticos.

Sem a função, o site e o painel podem operar, mas agenda e marcações indicam erro de conexão. Sem Turnstile configurado, novas marcações são bloqueadas. Não existe modo que invente contadores ou salve somente no navegador.

O navegador armazena um identificador aleatório no localStorage; a função grava apenas seu HMAC. Não se trata de login nem de garantia de uma pessoa por marcação. Essa agenda é separada da versão Next.js, que usa cookie HttpOnly.

## 4. Retenção e limitações do Pages

- Configure execução diária de `select public.cleanup_private_data();` no Supabase Cron. O `vercel.json` não é usado pelo Pages.
- A revisão de privacidade e contato do responsável permanece necessária antes da abertura ao público.
- O HTML inicial tem metadados gerais do Tá Rolando. Título e conteúdo de cada evento são carregados no navegador. **Prévia individual de cada evento no WhatsApp e SEO com renderização no servidor não estão disponíveis nessa hospedagem estática**; a versão Next.js preserva esses recursos para hospedagem compatível.
- Imagens no Pages são servidas pelo Storage e usam carregamento tardio. A otimização dinâmica de imagens do Next.js não é executada no Pages.
- PWA utiliza escopo relativo `/ta-rolando/`, cache de assets e tela offline. API e dados administrativos não são armazenados no service worker.

## Testar a mesma versão localmente

```powershell
npm.cmd run build:pages
npm.cmd run preview:pages
```

Abra `http://127.0.0.1:4173/ta-rolando/`. O build local usa as variáveis públicas de `.env.local`; os segredos privados não são incluídos.

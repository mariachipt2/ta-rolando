# Ativar “Eu vou!” e Minha Agenda

Diagnóstico confirmado em 20/10/2026: as tabelas existem, mas o endpoint `public-events` responde HTTP 404 (`Requested function was not found`). Os dois recursos precisam dessa função. Executar somente os SQLs não a publica.

## 1. Preparar a proteção antirrobôs

Abra [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile), crie um widget com modo **Managed** e autorize o hostname **mariachipt2.github.io** (sem `https://` e sem `/ta-rolando/`). Não é necessário mover o domínio do site para a Cloudflare.

O widget fornece uma **Site key** pública e uma **Secret key** privada. No `.env.local` deste projeto, preencha:

```dotenv
NEXT_PUBLIC_TURNSTILE_SITE_KEY=cole_a_site_key
TURNSTILE_SECRET_KEY=cole_a_secret_key
```

Não envie a Secret key pelo chat. O assistente não precisa da senha do seu banco.

## 2. Publicar a função

Execute **CONFIGURAR-EU-VOU.cmd** na pasta do projeto. Ele usa a CLI oficial do Supabase pelo npm e pede seu login no navegador/terminal. Entre na conta que administra o projeto Tá Rolando.

O assistente configura os segredos e publica `supabase/functions/public-events/index.ts`. A configuração de acesso público da função já está em `supabase/config.toml`; as operações privilegiadas do banco continuam restritas ao serviço. O assistente não altera as tabelas, não exclui dados e não envia nada ao GitHub.

As credenciais de autenticação da CLI ficam sob o gerenciamento da própria CLI oficial. O arquivo temporário com os segredos da função é criado na pasta ignorada `work/` e removido ao final, inclusive em caso de erro.

## 3. Mostrar a proteção no site

No GitHub → repositório `ta-rolando` → **Settings → Secrets and variables → Actions → Variables**, cadastre **NEXT_PUBLIC_TURNSTILE_SITE_KEY** com a **Site key pública**.

Depois use seu aplicativo para enviar as alterações e disparar a publicação habitual. A Secret key pertence somente ao ambiente privado do Supabase, nunca às variáveis públicas do site.

## 4. Validar o fluxo

1. Abra um evento futuro publicado.
2. Aguarde a verificação de segurança e clique em “Eu vou!”.
3. Confira o contador e abra Minha Agenda no mesmo navegador.
4. Atualize a página: a marcação deve continuar lá.
5. Retire a marcação e confirme que o contador foi reduzido uma única vez.

Sem publicar a função, Minha Agenda não consegue consultar as marcações. Sem configurar Turnstile, novas marcações permanecem bloqueadas. Não foi adicionada uma alternativa que invente contadores ou salve a presença exclusivamente no navegador.

Referências oficiais: [publicação de funções Supabase](https://supabase.com/docs/guides/functions/deploy), [segredos de funções](https://supabase.com/docs/guides/functions/secrets), [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/get-started/).

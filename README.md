# Tá Rolando

**GitHub Pages agora é suportado.** Use `npm run build:pages` e siga [o guia do Pages](docs/GITHUB-PAGES.md). A versão Next.js abaixo permanece disponível para Vercel.

Plataforma de eventos de Ipatinga, com Next.js App Router, TypeScript, Tailwind CSS, Lucide, Supabase Auth/PostgreSQL/Storage, React Hook Form e Zod. Desenvolvida localmente; não publicada.

## Executar no Windows

Abra esta pasta no Visual Studio Code e dê dois cliques em **INICIAR.cmd**, ou execute:

```powershell
npm.cmd ci
node scripts/prepare-env.mjs
npm.cmd run dev
```

Site: http://127.0.0.1:3000 — painel: http://127.0.0.1:3000/admin.

Sem Supabase configurado, o site abre vazio e o login fica desabilitado. Isso permite avaliar a interface sem inventar eventos, contadores ou credenciais. Persistência, uploads, login e marcações exigem o projeto Supabase configurado. Consulte **docs/CONFIGURAR-SUPABASE.md**.

## Implementado

- Homepage responsiva, pesquisa por título, categoria, bairro/local, entrada e datas combináveis; seções automáticas, rankings baseados em registros reais.
- Detalhes públicos com metadados, Schema.org, imagens otimizadas, mapas, Waze, WhatsApp, link, calendário ICS e informações completas.
- Agenda anônima, cookie aleatório assinado e HttpOnly, identificador derivado por HMAC no banco. Unicidade e operação idempotente no PostgreSQL. Sem IP na base da aplicação.
- Login administrativo Supabase; verificação de usuário e permissão no servidor; RLS e bucket com escrita administrativa.
- Eventos: edição, cópia como rascunho, exclusão confirmada, cancelamento, despublicação para rascunho, destaque, agendamento de publicação, imagens e prévia.
- Categorias editáveis e ativáveis. Estatísticas reais por evento e gráfico de 14 dias. Métricas de visualização e ingresso com deduplicação horária por navegador.
- PWA com ícones, manifest, cache somente de arquivos estáticos e página offline. Dados do administrador, agenda e APIs não são armazenados no service worker. Consulta e marcações dependem da rede.
- SQL versionado, retenção por manutenção diária, sitemap e robots.

## Decisões de funcionamento

- Horários são armazenados como `timestamptz` e exibidos em `America/Sao_Paulo`. O formulário converte o horário de Brasília para UTC.
- Um evento sem encerramento deixa de ser “próximo” no horário de início. Informe o encerramento para mantê-lo visível durante sua duração.
- Fim de semana é sábado e domingo; no domingo, inclui o próprio domingo.
- Publicações agendadas são liberadas pela consulta no banco quando `publish_at <= now()`; não dependem de cron para aparecer. O status continua “scheduled” para preservar a intenção original.
- Desativar uma categoria oculta seus eventos do público. Rascunhos e publicações futuras nunca entram na view pública. Cancelados têm página informativa, mas não entram nas listas de próximos eventos ou rankings.
- A contagem deriva de `event_attendance`, sem contador paralelo sujeito a divergência. O índice composto cobre contagem por evento. Estatísticas de criação/retirada são atualizadas na mesma transação da marcação.
- O visitante não vê identificadores de outros navegadores. A secret key fica limitada a código servidor e rotas verificadas. A view pública contém apenas informações do evento, categoria e totais.
- Requisições de escrita validam origem, formato e permissão. Imagens são limitadas a 5 MB, com verificação de assinatura JPG/PNG/WebP. São armazenadas no bucket do próprio projeto. Remover a referência de uma imagem não apaga o arquivo remoto automaticamente, evitando apagar uma capa ainda usada por um evento duplicado.
- Instalação PWA requer navegador compatível e HTTPS, exceto localhost. iOS: compartilhar → adicionar à tela de início. Splash screen depende do sistema. O cache tem versão em `public/sw.js`, a alterar quando a estratégia mudar.
- A política de privacidade precisa receber identificação e contato do responsável antes do lançamento.

## Estrutura

```text
src/app/               páginas e endpoints
src/components/        interface pública e administrativa
src/lib/               serviços, tipos, validação, datas e segurança
supabase/migrations/   esquema, funções, RLS e Storage
tests/                 testes de domínio e integração PostgreSQL
public/                PWA e ícones
scripts/               preparação local
docs/                  configuração e validação
```

## Verificações

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Os testes usam PostgreSQL embutido via PGlite, com papéis equivalentes a anon/authenticated/service_role e a migration real. Não substituem a homologação do serviço Supabase Auth/Storage. Não há dados demonstrativos em produção nem seed automático.

## Publicação posterior na Vercel

Somente após autorização: versionar a pasta (sem `.env.local` ou `node_modules`), importar na Vercel como Next.js, configurar variáveis, executar migrations no Supabase e revisar o checklist de configuração. Comandos: `npm run build` e configuração padrão Next.js. Confirmar cron, domínio HTTPS, Turnstile e backups. Não foi criada conta, repositório remoto ou publicação nesta entrega.

Versões exatas estão em `package-lock.json`; Node.js 24 foi usado na validação. A lista de dependências usa versões instaladas estáveis, sem betas.

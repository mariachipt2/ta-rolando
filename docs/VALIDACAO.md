# Validação — 16/10/2026

## Executado

- Compilação de produção Next.js e TypeScript sem erros.
- Seis testes automatizados aprovados: PostgreSQL/RLS/Storage, calendário, datas de Brasília, exclusão de encerrados, URLs e paginação acima de 1.000 registros.
- A migration SQL real foi executada em PostgreSQL embutido (PGlite), com simulação dos papéis e tabelas de infraestrutura de Auth/Storage. Os testes incluem: anônimo sem escrita e sem acesso a identificadores; usuário autenticado sem perfil sem acesso administrativo; administrador autorizado; revogação do perfil; agendamento futuro e vencido; marcação duplicada; retirada repetida; contador e métricas; retenção de identificadores sem perda das métricas agregadas; limitação de requisições; políticas de upload.
- HTTP: início, agenda, admin, privacidade, manifest, sitemap, robots e ícone retornam 200. Evento inexistente retorna 404. Escrita administrativa anônima retorna 401, origem externa retorna 403, manutenção sem token retorna 401.
- Navegador: busca, combinação com entrada gratuita, limpeza dos filtros, navegação à agenda e login desabilitado com aviso de configuração.
- Inspeção de layout em 390×844, 768×1024 e 1440×1000. Sem rolagem horizontal nas telas verificadas. Corrigido overflow do desenho decorativo no celular.
- Auditoria npm ao instalar dependências: nenhuma vulnerabilidade reportada naquele momento.

## Ainda depende do Supabase do usuário

- Aplicar as três migrations no projeto real.
- Confirmar login/sessão e renovação de token com a conta administrativa.
- Cadastrar, editar e publicar evento real; carregar JPG/PNG/WebP no Storage.
- Marcar, retirar e recuperar “Eu vou!” pela interface em navegadores distintos.
- Validar Turnstile com domínio autorizado em modo de produção.
- Instalação e atualização PWA em Android/iPhone reais, Open Graph no WhatsApp e cron no provedor.
- Avaliação de desempenho com imagens e volume real. Não foi atribuída pontuação Lighthouse.

Não houve publicação na internet, criação de credenciais externas ou inserção de eventos fictícios na base do usuário.

## Ativacao em 20/10/2026
- public-events publicada no Supabase; preflight CORS 204 e consulta de agenda 200.
- Turnstile configurado; tentativa sem token rejeitada com 403.
- Chave publica configurada no GitHub Actions e publicacao concluida sem commit/push.
- Teste real na interface: marcar, contador 1, agenda apos recarregar e retirada bem-sucedida. A marcacao de teste foi removida.


## Sugestoes e confirmacao de gravacao - 20/10/2026
- 10 testes aprovados, incluindo permissao administrativa, rejeicao, aprovacao atomica/idempotente, rollback em falha e recibo do banco.
- Migrations 005 e 006 aplicadas ao Supabase real; acesso publico as duas tabelas privadas bloqueado (401).
- Edge Function atualizada; envio sem Turnstile rejeitado (403).
- Formulario publico inspecionado no navegador local; nao foram criados eventos ou sugestoes ficticios no banco de producao.
- Compilacoes Pages e Next aprovadas; interface aguarda publicacao pelo aplicativo do usuario.


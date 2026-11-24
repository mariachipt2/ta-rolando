# Buscar com OpenBot — integração ativada no Supabase e no OpenBot

O novo bloco fica em Admin → Buscar eventos, abaixo da seleção de fonte. A busca rápida existente continua disponível. O OpenBot recebe a fonte selecionada (Socialyte, Pystta, Lhever), coleta links, dados e cartazes e devolve resultados para revisão. Não cria eventos, rascunhos nem publicações automaticamente.

## Preparado e validado localmente

- Migração `028_openbot_search.sql`: fila privada `openbot_search_jobs`, bloqueio de acesso público, um pedido ativo por fonte e entrega por lease. Aplicada em produção em 24/11/2026.
- Função `openbot-search`: administradora solicita, acompanha ou cancela; conector retira pedido, envia heartbeat e conclui. A função valida cidade, URLs de fonte, datas e limites. Publicada em produção em 24/11/2026.
- Painel: estado aguardando, resultados recebidos, erros, cancelamento, revisão, marcações já existentes de adicionado/ignorado e reconhecimento de duplicados.
- Testes de validação e SQL/RLS, TypeScript e build Pages passaram. Fila simulada conferida em 320, 390 e 1440 px. Primeira coleta real concluída no Socialyte em 24/11/2026: 20 resultados com imagens da fonte, incluindo duas sessões das Santinhas (18 e 19/12 às 20h), recebidos pela função e persistidos na fila. Comparação dos IDs confirmou zero eventos criados durante o teste. A primeira rodada levou cerca de 16 minutos; o prompt foi ajustado para priorizar datas próximas, reaproveitar coletores e devolver pendências sem bloquear a coleta.

## Configuração autorizada e ativada em 24/11/2026

1. Criar o conector local que usa o CLI oficial `resources/cli/openbot-cli.mjs` para enviar a tarefa ao Radar de Rolês (`agent-d860da64-fe75-422c-8855-50325c39f8c7`). O agente atual usa Gemini pelo Antigravity; não mudar o modelo.
2. Permitir Local scripts/Scripts locais apenas nesse agente. O CLI atual confirma que essa integração está desativada. Não editar diretamente o banco interno do OpenBot.
3. O conector deve usar somente no Windows a credencial DPAPI já existente de integração, sem expô-la no frontend ou logs. A função valida `OPENBOT_DRAFT_TOKEN`, como a integração de rascunhos existente.
4. Aplicar a migração e publicar a função após confirmação. Publicar frontend pelo app GitHub da Maria, sem git/push nesta tarefa.
5. Testar um pedido real até a resposta no painel e confirmar que nenhum evento foi criado/publicado.

Após autorização explícita da Maria, o conector foi criado e Scripts locais foi habilitado somente no Radar de Rolês pela interface do OpenBot. O CLI confirmou o acesso. O dock foi temporariamente movido para liberar os controles e restaurado à direita. O modelo e as permissões gerais anteriores do agente foram mantidos. Há um atalho na Área de Trabalho para iniciar o conector sem terminal; não foi instalada inicialização automática.

## Contrato para o conector

POST `/functions/v1/openbot-search` com Bearer de integração local: `claim` retorna job com id/source/lease_token; `heartbeat`, `complete` e `fail` exigem id e lease_token. Complete recebe result com items e warnings; cada item segue DiscoveredEvent (datas ISO com fuso, city Ipatinga, source_url da fonte conhecida). Usar até 100 itens, corpo até 1 MB. Não inventar preço, horário ou gratuidade. Pendências viram avisos. Verificar visualmente cada cartaz antes de incluí-lo. Não enviar credenciais ao agente, não publicar, não chamar outros agentes nem enviar mensagens externas.

O conector precisa de trava local de instância, heartbeat de 30 segundos, limite de tempo, ID idempotente no CLI e tratamento de cancelamento (HTTP 409). Apenas coleta após um clique no painel; nenhuma rotina diária ou inicialização automática foi autorizada.

## Teste e operação confirmados

O CLI oficial confirmou Scripts locais no Radar. A migração e a função foram aplicadas e a consulta sem login retornou HTTP 401. Os 97 testes TypeScript, três testes do conector Python, typecheck e build Pages passaram. O conector foi iniciado sem terminal e há atalho na Área de Trabalho para reiniciá-lo após desligar o PC. O frontend continua dependendo do envio pelo app GitHub da Maria.

Conferência visual posterior: as duas sessões das Santinhas foram mantidas sem capa, pois a fonte forneceu foto promocional do elenco sem identificação do evento/data. A pendência do cartaz e a necessidade de conferir o mesmo ingresso usado em duas datas foram registradas nos avisos do resultado no Supabase. Não considerar todas as imagens coletadas como cartazes aprovados.

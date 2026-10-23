# Avisos de publicações agendadas

No topo do administrador, o botão com sininho **Publicações** mostra a quantidade de avisos não lidos. Abra para conferir os eventos que ficaram públicos após o agendamento, o horário agendado e o horário da confirmação pelo banco, em Brasília. Cada aviso permite abrir o evento e marcar como lido; também há leitura de todos os avisos recebidos até a última conferência.

Os registros ficam no Supabase, com leitura por administradora, e sobrevivem à troca de computador e aos dias sem entrar no painel. Não são notificações por e-mail, WhatsApp ou do sistema operacional. O painel consulta na abertura, a cada minuto enquanto visível e ao voltar à janela. Uma falha de consulta aparece como aviso, sem apresentar dados antigos como recém-confirmados.

## Banco

Aplicada a migração 012_publication_notifications.sql: tabelas privadas publication_notifications e publication_notification_reads, RPCs administrativas e função de coleta interna. Aplicado também enable-publication-notifications-cron.sql: tarefa nomeada do pg_cron a cada minuto. A execução real foi conferida no Supabase com status succeeded. Não há SQL pendente para a administradora.

A coleta usa o mesmo critério da visão pública: agendamento vencido, evento fora da lixeira e categoria ativa. Não altera status, conteúdo, histórico de versões ou recibo do último salvamento. O horário de confirmação representa quando o sistema verificou a visibilidade no banco; não é uma data histórica inventada nem teste de carregamento no navegador. Agendamentos antigos ainda visíveis podem ser reconhecidos na primeira coleta com confirmação atual.

A chave evento + horário agendado impede duplicação nas consultas. Cancelamento, retirada e mudança de categoria preservam avisos anteriores; a interface mostra a situação atual e só oferece o link quando disponível. Gatilhos coletam a situação anterior antes de alterações para não perder uma publicação entre duas execuções da rotina. Um novo agendamento com outro horário pode produzir outro aviso. A lista mostra até 100 registros, priorizando não lidos; os próximos aparecem ao marcar os anteriores como lidos.

## Verificação

47 testes passaram, incluindo autorização, isolamento da leitura por usuário, repetição de consultas, eventos futuros/rascunhos/cancelados/lixeira/categoria inativa, preservação após cancelamento, reagendamento e leitura de todos. Interface conferida em prévia isolada no computador e em largura de celular, com exemplos sem gravação no banco real. O site online recebe o botão depois de publicar os arquivos pelo aplicativo habitual.

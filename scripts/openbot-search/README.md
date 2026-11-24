# Conector de buscas do Tá Rolando

O painel envia pedidos privados ao Supabase. Este conector usa o CLI oficial do OpenBot para acionar somente o Radar de Rolês. Os resultados voltam para Buscar eventos; não cria ou publica eventos automaticamente.

## Uso

- Abra o OpenBot e mantenha o computador ligado.
- Inicie o atalho **Tá Rolando - Conector de buscas**, na Área de Trabalho. Ele roda sem janela de terminal. Uma segunda abertura não inicia outro conector.
- No site, abra Admin → Buscar eventos, selecione a fonte e clique **Buscar com OpenBot**.
- Aguarde os resultados e revise categoria, entrada, dados e cartaz antes de salvar um rascunho.
- Se o PC estiver desligado, o pedido permanece aguardando. O cancelamento impede receber os resultados daquele pedido; uma tarefa já iniciada pode terminar no OpenBot.

O conector usa a credencial DPAPI local existente. Nenhuma credencial entra no frontend ou no prompt do agente. Não há inicialização automática nem rotina diária: a coleta depende do pedido no painel. O modelo do Radar permanece o já configurado pela Maria.

Diagnóstico: `python connector.py --check`. Testes: `python test_connector.py`. Para execução visível de diagnóstico: `python -u connector.py --once`.

## Arquitetura

- Tabela privada: openbot_search_jobs (migração 028).
- Função Supabase: openbot-search. Administradora cria, acompanha ou cancela; conector reivindica com lease e mantém heartbeat.
- A fonte é restrita a Socialyte, Pystta ou Lhever. Resultados precisam de cidade, data/hora e fonte válidas. Campos ausentes são sinalizados, sem inventar gratuidade ou horário.
- As consultas de navegador ao Tá Rolando usam `?trafego=interno` para não contaminar métricas.
- Os JSONs em results/ são locais e ignorados pelo Git.

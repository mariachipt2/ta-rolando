# Data da agenda

A página pública passa a consultar a hora do Supabase antes de apresentar eventos. A função site_clock é pública, retorna apenas um timestamp e não exige login nem expõe dados. Migração 013_site_clock.sql já aplicada no projeto; nenhuma SQL pendente para a administradora.

O relógio do navegador é ancorado ao timestamp do banco e avança por tempo monotônico. Alterar a data do aparelho não faz um evento encerrado voltar a ser próximo. A página Pages também revalida dados e horário a cada minuto e ao recuperar foco, voltar do segundo plano ou restaurar a página, preservando os filtros. O administrador não recebe essa atualização de dados em segundo plano, para não interromper edições.

A data de referência aparece ao lado dos filtros como Data da agenda: dd/mm/aaaa · Brasília. Se a consulta inicial do horário falhar, o carregamento público sinaliza erro em vez de apresentar uma lista como se tivesse sido confirmada.

Verificação em 23/10/2026: consulta online do filtro Hoje mostrou Gertrudes no Garajão e Buteco do Marconi e Diego. O Pizero de 22/10 está cadastrado para 22h30, com encerramento às 02h30 de 23/10; não foram alterados cadastro nem histórico. Uma prévia simulou quinta no relógio, reproduziu a inclusão incorreta e confirmou a retirada após consultar a função real do Supabase. Com os dados reais, a versão corrigida mostrou 23/10 e os dois eventos de sexta.

55 testes passaram com concorrência limitada a uma execução (a execução paralela encontrou falta de memória no PC de 8 GB). Typecheck e geração Pages verificados. O novo código do site depende de publicação pelo aplicativo habitual da usuária. Uma página que já executa uma versão anterior deve ser recarregada para receber a mudança.

Conferência de todas as telas: cartões de eventos, organizadores, comparação, programação e fim de semana também acompanham a atualização do relógio. As funções compartilhadas de seleção e semelhantes usam a mesma referência. No administrador, registros publicados cujo horário terminou mostram Publicado · Encerrado; o status de publicação é preservado para manter o histórico.

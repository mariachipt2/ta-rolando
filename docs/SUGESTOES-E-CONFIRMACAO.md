# Sugestões de eventos e confirmação de gravação

No fim da página inicial, **Sugerir um evento** abre o formulário público. As sugestões exigem data futura e Turnstile. O envio só é confirmado depois de o Supabase devolver um identificador e a data de recebimento. Envios repetidos com o mesmo identificador não criam registros duplicados. Não são solicitados telefone, e-mail ou cadastro do visitante.

No painel, **Sugestões** separa pendentes, aceitas e recusadas. **Revisar e aceitar** abre o cadastro completo, permitindo corrigir dados, usar a foto enviada ou adicionar outra capa. O status começa como Publicado; se a administradora escolher Rascunho, o evento fica salvo para publicação posterior. A aprovação cria o evento e finaliza a sugestão em uma única transação. Repetir a mesma aprovação não cria outro evento. Recusar mantém o registro privado para consulta.

O painel mostra um indicador discreto **Salvo** com a data e a hora do banco em Brasília. Cada evento também mostra seu último salvamento. Durante a edição, alterações pendentes são sinalizadas; se o salvamento falhar, os campos permanecem preenchidos. Sair ou trocar de aba com mudanças pendentes pede confirmação. O aviso não é um backup: somente uma resposta de sucesso do banco confirma a gravação.

## Mudanças necessárias no Supabase

A migration **005_submissions_save_confirmation.sql** cria:

- `event_submissions`: dados enviados, status, recebimento e revisão, administradora responsável e vínculo ao evento aceito.
- `admin_save_state`: data, entidade e operação da última gravação confirmada; só administradores podem consultar.
- `categories.updated_at`: data de salvamento da categoria. Categorias antigas ficam sem data retroativa até serem editadas; não é inventado um horário antigo.
- Políticas de acesso, gatilhos e a função transacional `review_submission`.

O campo `events.updated_at` já existia e continua sendo preenchido pelo banco. A migration inicializa a última gravação global com a maior data de eventos existente. Envio público de sugestões não altera esse indicador administrativo; a revisão altera. Visualizações e marcações “Eu vou!” também não alteram o indicador.

Nesta instalação, as migrations 005 e 006 foram aplicadas e a Edge Function `public-events` atualizada em 20/10/2026. A 006 restringe explicitamente os privilégios das tabelas privadas. **Não é necessário criar campos manualmente nem executar essas migrations novamente nesse banco.** Para outro Supabase, aplicar as migrations 001 a 006, em ordem.

As sugestões nunca são listadas ao público; apenas administradores podem consultá-las e analisá-las. O serviço insere sugestões depois da validação antirrobôs. A rotina `cleanup_private_data` remove sugestões com mais de 180 dias, quando executada pelo agendamento configurado no Supabase.

## Publicação da interface

Os arquivos locais foram atualizados sem commit ou push. Publique pelo seu aplicativo habitual para o formulário e a aba de sugestões aparecerem no GitHub Pages. Não há novas variáveis de ambiente: é usada a configuração Turnstile já existente.

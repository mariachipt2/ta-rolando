# Linha do tempo mensal

A página abre no mês atual com Todos do mês selecionado. Cada evento ocupa uma linha com horário de Brasília, nome, local, categoria e preço. Cancelamentos, alterações e eventos encerrados são identificados; o link abre os detalhes completos.

As setas trocam o mês. Ir para o mês permite escolher qualquer mês; Meses com eventos pula diretamente para os meses cadastrados e mostra a contagem total, independente dos filtros. Mês atual retorna ao presente. Busca, Para crianças e Próximos/Anteriores atuam somente no mês selecionado; Limpar filtros preserva esse mês. Eventos são agrupados pela data de início em Brasília. Anteriores mostra os mais recentes primeiro.

Não requer novos campos ou SQL no Supabase. Publicar os arquivos pelo aplicativo habitual.

Filtros de Entrada (Todas, Gratuito ou Pago), Organizador e Bairro podem ser combinados com os demais. As opções vêm dos cadastros públicos de todos os meses, ignorando campos vazios e lixeira. Limpar filtros limpa todas as seleções sem trocar o mês. Nenhuma alteração no Supabase.

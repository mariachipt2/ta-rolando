# Tá Rolando — checklist para testar

Lista da versão preparada até 21/10/2026. Os recursos mais recentes aparecem no site público somente depois de publicar os arquivos pelo aplicativo habitual. Não é necessário criar campos novos no Supabase para usar esta checklist.

Site: https://mariachipt2.github.io/ta-rolando/

Administrador: https://mariachipt2.github.io/ta-rolando/#/admin

Marque cada item quando conferir. Use um evento futuro com “TESTE” no título e horários de início e encerramento; ao terminar, mova-o para a lixeira. Faça os testes de publicação e sugestão sabendo que um evento aceito/publicado fica visível para os visitantes. Depois de alterar um cadastro no painel, atualize a página pública para conferir os dados novos.

## 1. Abertura e navegação

- [ ] Abrir no computador e no celular: textos, imagens e botões ficam utilizáveis, sem conteúdo cortado lateralmente.
- [ ] Clicar no logotipo volta à página inicial.
- [ ] Abrir Explorar, Categorias, Minha Agenda, Linha do Tempo, Organizadores e Fim de Semana.
- [ ] Abrir um link direto de evento e recarregar a página: o evento continua abrindo.
- [ ] Abrir Privacidade pelo rodapé.
- [ ] Se o navegador oferecer, adicionar o site à tela inicial. A consulta ao Supabase e os salvamentos continuam exigindo internet.

## 2. Busca e descoberta

- [ ] Buscar um evento pelo título.
- [ ] Selecionar uma categoria e conferir os resultados.
- [ ] Usar Hoje, Amanhã, Fim de Semana e Próximos 7 Dias.
- [ ] Confirmar que Fim de Semana considera sexta, sábado e domingo.
- [ ] Filtrar gratuitos; no painel de filtros, alternar entre todas as entradas, gratuitos e pagos.
- [ ] Filtrar por uma data específica.
- [ ] Filtrar por local ou bairro.
- [ ] Combinar busca, categoria, data, local e entrada.
- [ ] Limpar filtros restaura a exibição normal.
- [ ] Buscar algo inexistente mostra uma mensagem de nenhum resultado.
- [ ] Conferir as seções de destaques, próximos eventos, hoje, amanhã, fim de semana e gratuitos.
- [ ] Conferir Tá Bombando e Top 10: usam as marcações reais de interesse.
- [ ] Quando houver mais eventos que o limite exibido, Mostrar mais eventos apresenta os restantes.

## 3. Fotos, cartões e crianças

- [ ] A capa aparece no cartão da página principal com o cartaz inteiro, sem recorte obrigatório.
- [ ] Sem capa, mas com fotos na galeria, o cartão usa a primeira foto da galeria.
- [ ] Sem nenhuma foto, aparece a imagem padrão do site.
- [ ] Contador de pessoas não aparece quando é zero.
- [ ] Com uma marcação, aparece “1 pessoa vai”; com mais de uma, a contagem correspondente.
- [ ] Eventos com perfil cadastrado mostram o ícone do Instagram e abrem o perfil correto.
- [ ] Marcar Adequado para crianças = Sim no administrador e confirmar que aparece no filtro Para crianças.
- [ ] Marcar Não recomendado ou Não informado e confirmar que o evento fica fora desse filtro.
- [ ] Confirmar que classificação Livre, sozinha, não faz o evento entrar no filtro infantil.
- [ ] Usar o filtro Para crianças também na Linha do Tempo.

## 4. Página do evento

- [ ] Conferir título, descrição, categoria, data e horário de início e encerramento.
- [ ] Conferir nome do local, endereço, bairro, cidade e UF.
- [ ] Conferir organizador, preço ou gratuidade, classificação indicativa e adequação para crianças.
- [ ] Conferir informações adicionais, capa e fotos da galeria.
- [ ] Google Maps e Waze abrem o local/endereço informado.
- [ ] Instagram abre o perfil cadastrado; sem perfil, o botão não aparece.
- [ ] Ingressos oficiais abre o endereço cadastrado, quando informado.
- [ ] Copiar link permite colar o endereço correto do evento.
- [ ] WhatsApp prepara título e link para escolher a conversa; o envio é confirmado por você no WhatsApp.
- [ ] Adicionar ao calendário gera o arquivo do evento com os horários corretos.

## 5. Cartaz para WhatsApp

- [ ] Criar cartaz para WhatsApp gera a prévia.
- [ ] Conferir na imagem: título, foto, data/hora em Brasília, local, endereço, link e QR Code.
- [ ] Baixar imagem gera um PNG que abre corretamente.
- [ ] Ler o QR Code pelo celular abre o evento correto do site publicado.
- [ ] Em aparelho compatível, Compartilhar cartaz abre o menu; escolher WhatsApp permite anexar a imagem.
- [ ] Em navegador sem suporte a compartilhar arquivos, a orientação para baixar e anexar manualmente aparece.
- [ ] Cancelar o compartilhamento não informa falsamente que a mensagem foi enviada.
- [ ] Fechar cartaz recolhe a prévia.

## 6. Eu vou e Minha Agenda

- [ ] Marcar Eu vou após a verificação de segurança.
- [ ] Recarregar mantém a marcação, sem somar novamente a mesma presença deste navegador.
- [ ] Abrir Minha Agenda e encontrar os eventos marcados.
- [ ] Retirar uma marcação remove o evento da seleção e atualiza a contagem.
- [ ] Evento encerrado ou cancelado não aceita uma nova marcação.
- [ ] Um evento marcado que foi alterado mostra o aviso na Minha Agenda.
- [ ] Um evento marcado que foi cancelado continua acessível com aviso de cancelamento.

As marcações são interesse, não compra de ingresso ou confirmação de presença. A agenda pertence ao navegador; não é sincronizada automaticamente com outro dispositivo.

## 7. Linha do Tempo e datas

- [ ] Abrir a Linha do Tempo: mês atual, todos os eventos em linhas compactas agrupadas por dia.
- [ ] Alternar Próximos, Anteriores e Todos do mês.
- [ ] Conferir a ordem cronológica; Anteriores mostra os mais recentes primeiro.
- [ ] Buscar por evento, local, organizador ou categoria e filtrar por mês.
- [ ] Limpar filtros remove a busca e Para crianças, volta a Todos do mês e preserva o mês escolhido.
- [ ] Usar Mês anterior, Próximo mês, Ir para o mês e Mês atual; escolher diretamente um dos Meses com eventos. O mês inteiro aparece sem Ver mais datas.
- [ ] Evento encerrado sai das recomendações futuras e aparece em Anteriores; seu cadastro não é apagado automaticamente.
- [ ] Com encerramento informado, o evento permanece em andamento até aquele horário.
- [ ] Sem encerramento, ele é considerado passado quando chega o horário de início.

## 8. Organizadores favoritos

- [ ] Todos os organizadores lista os nomes ou perfis de Instagram informados nos eventos.
- [ ] Acompanhar salva o organizador em Meus favoritos.
- [ ] Recarregar a página mantém o favorito neste navegador.
- [ ] Conferir os próximos eventos publicados desse organizador.
- [ ] Buscar um organizador pelo nome.
- [ ] Acompanhar organizador também funciona dentro da página do evento, quando o cadastro tem organizador ou Instagram.
- [ ] Deixar de acompanhar remove da lista de favoritos.
- [ ] Favorito sem próximos eventos mostra a mensagem correspondente.

Favoritos não enviam notificações e não são sincronizados entre dispositivos. Sem nome ou Instagram cadastrado, o site não inventa um organizador a partir do local.

## 9. Resumo do fim de semana

- [ ] Abrir Fim de Semana e conferir o intervalo de sexta a domingo em Brasília.
- [ ] Conferir eventos por sexta, sábado e domingo, com cada evento listado uma vez.
- [ ] Eventos que começaram antes e continuam no intervalo têm aviso explicativo.
- [ ] Eventos cancelados, na lixeira ou ainda não publicados ficam fora.
- [ ] Anterior e Próximo mudam uma semana por vez.
- [ ] Copiar o link, abrir em outra aba e conferir que as mesmas datas permanecem selecionadas.
- [ ] Compartilhar resumo no WhatsApp prepara as datas, eventos, locais e link para você confirmar o envio.
- [ ] Um fim de semana sem eventos informa isso, sem inventar resultados.

## 10. Sugestões enviadas pelos visitantes

- [ ] Abrir Sugerir um evento no final da página inicial.
- [ ] Preencher dados, categoria, início futuro, local, endereço, organizador, Instagram, entrada e ingressos.
- [ ] Selecionar classificação indicativa e adequação para crianças.
- [ ] Anexar JPG, PNG ou WebP de até 5 MB e conferir a prévia.
- [ ] Remover/trocar a foto antes do envio.
- [ ] Completar a verificação de segurança e enviar para análise.
- [ ] Conferir a confirmação de recebimento com data e hora.
- [ ] A sugestão fica pendente no administrador e não vira evento público antes da aprovação.
- [ ] A foto da sugestão permanece privada até a análise; ao aprovar, a administradora escolhe usá-la como capa ou enviar outra.
- [ ] No painel, revisar e corrigir a sugestão antes de aceitar.
- [ ] Aceitar como Publicado faz o evento aparecer; aceitar como Rascunho apenas salva no painel.
- [ ] Recusar mantém a sugestão na consulta de recusadas, sem publicar o evento.
- [ ] Alternar sugestões pendentes, aceitas e recusadas.

## 11. Informar um problema

- [ ] Abrir Informar um problema na página do evento.
- [ ] Escolher data/horário, local/endereço, cancelamento, ingressos ou outro problema.
- [ ] Escrever uma descrição, completar a verificação e enviar.
- [ ] Receber a confirmação do aviso.
- [ ] Encontrar o aviso na aba Problemas do administrador, associado ao evento correto.
- [ ] Editar evento abre o cadastro correspondente.
- [ ] Marcar resolvido move para Resolvidos; descartar move para Descartados.
- [ ] O relato do visitante não é exibido publicamente e não altera o evento por conta própria.

## 12. Login e cadastro administrativo

- [ ] Sem login, o painel pede autenticação; uma conta sem autorização não administra o site.
- [ ] Entrar com a conta administrativa e depois testar Sair.
- [ ] Criar evento preenchendo título, descrição, categoria, início, encerramento, local e endereço completo.
- [ ] Cadastrar organizador, Instagram, gratuidade/preço e link de ingressos.
- [ ] Selecionar classificação indicativa e adequação para crianças.
- [ ] Enviar capa e até 10 imagens adicionais, dentro dos formatos e tamanho permitidos.
- [ ] Remover/trocar referências de imagens no cadastro.
- [ ] Usar Pré-visualizar antes de salvar.
- [ ] Salvar como Rascunho: aparece só no painel.
- [ ] Salvar como Publicado: aparece no site público.
- [ ] Agendar publicação: fica oculto até a data escolhida e disponível depois, sem precisar editar novamente.
- [ ] Destacar evento: aparece na seção de destaques.
- [ ] Editar um evento existente e conferir as mudanças no site.
- [ ] Duplicar cria uma cópia como rascunho, sem alterar o original.
- [ ] Buscar eventos pelo título dentro do painel.

## 13. Salvamento, alterações e cancelamentos

- [ ] Depois de salvar, conferir data, hora e segundos no indicador discreto Salvo.
- [ ] Recarregar e abrir o cadastro para conferir que os dados persistiram.
- [ ] Editar sem salvar mostra Alterações não salvas.
- [ ] Tentar fechar o formulário ou trocar de aba administrativa com alterações pendentes pede confirmação.
- [ ] Se o salvamento falhar, não aparece confirmação de sucesso e o formulário mantém os dados para correção/tentativa.
- [ ] Alterar dados importantes de evento publicado gera aviso de Evento alterado.
- [ ] Preencher o aviso de alteração manualmente e conferir o texto público.
- [ ] Cancelar mantém a página informativa, mostra aviso e impede novas marcações.
- [ ] Cancelado sai das recomendações e dos semelhantes, mas continua acessível pelo link e na agenda de quem já marcou.
- [ ] Voltar um evento para Rascunho retira da exibição pública.

## 14. Eventos recorrentes

- [ ] Ao criar evento, testar semanal, a cada 2 semanas (14 dias) e mensal.
- [ ] Escolher de 2 a 24 edições, incluindo a primeira.
- [ ] Salvar e conferir as datas geradas e o horário de Brasília.
- [ ] No mensal, conferir um dia que não existe em mês mais curto: usa o último dia disponível, preservando a duração.
- [ ] Editar/cancelar uma edição não muda as outras datas.
- [ ] Repetir a confirmação do mesmo envio não cria outra série duplicada.

## 15. Lixeira e histórico

- [ ] Mover evento para a lixeira oculta no site público e o mantém na aba Lixeira.
- [ ] Restaurar evento recupera o cadastro, fotos e marcações preservadas.
- [ ] Histórico mostra as versões registradas e as diferenças entre alterações.
- [ ] Restaurar uma versão recupera o conteúdo sem apagar o histórico ou as marcações.
- [ ] Restaurar uma versão de um evento na lixeira não o retira dela; para isso, usar Restaurar evento.

O painel não oferece exclusão definitiva. O histórico começa na atualização em que foi implantado; não reconstrói mudanças anteriores.

## 16. Categorias e pendências

- [ ] Criar/editar uma categoria, seu nome e ícone.
- [ ] Desativar uma categoria oculta seus eventos do público; reativar permite a exibição novamente.
- [ ] Pendências destaca eventos sem foto, endereços a revisar e sugestões aguardando análise.
- [ ] Fotos na galeria contam como foto, mesmo sem capa definida.
- [ ] Filtrar pendências por Sem foto ou Endereço a revisar.
- [ ] Completar cadastro abre o evento certo; Revisar sugestões abre a fila.
- [ ] Corrigir, salvar e conferir que o lembrete correspondente some após atualizar os dados.
- [ ] Eventos na lixeira não entram na contagem de pendências.

Pendências são lembretes; o site não verifica geograficamente o endereço. Para local sem número, pode-se informar s/n.

## 17. Estatísticas

- [ ] Conferir totais de cadastrados, futuros, encerrados, publicados, rascunhos e marcações.
- [ ] Ver visualizações, cliques em ingressos e marcações retiradas.
- [ ] Filtrar estatísticas por um evento ou consultar todos.
- [ ] Conferir gráfico de interesse dos últimos 14 dias.
- [ ] Conferir os eventos mais populares pela quantidade de marcações.

Visualizações e cliques repetidos no mesmo navegador, evento e tipo são limitados por hora; não representam pessoas únicas. Não espere que atualizar a página repetidamente aumente o total a cada vez.

## 18. Exportação

- [ ] Abrir Exportar cadastros no administrador.
- [ ] Baixar todos os cadastros em JSON e abrir o arquivo.
- [ ] Conferir eventos, categorias, sugestões, data de preparação e última gravação confirmada.
- [ ] Conferir que inclui lixeira e sugestões pendentes, aceitas e recusadas.
- [ ] Baixar Eventos CSV e Sugestões CSV e abrir no Excel ou equivalente.
- [ ] Conferir acentos, aspas, valores e textos com várias linhas.
- [ ] Se o download não iniciar, usar Baixar arquivo preparado.
- [ ] Depois de alterar e salvar um cadastro, exportar novamente e conferir os dados novos.
- [ ] Se a consulta falhar, o painel informa o erro e não gera um arquivo parcial.

As fotos são URLs/caminhos, não arquivos de imagem dentro da exportação. Não há importação automática. Usuários, senhas, marcações individuais e histórico de versões não fazem parte dessa cópia; ela não substitui o backup completo do Supabase.

## 19. Comparar rolês

- [ ] Usar Comparar rolê em dois cartões diferentes e abrir Comparar agora.
- [ ] Tentar selecionar um terceiro: o site orienta a retirar uma opção antes de trocar.
- [ ] Recarregar mantém a seleção de comparação neste navegador.
- [ ] Conferir início, encerramento, preço/gratuidade, local, endereço, categoria, classificação, crianças, organizador e situação.
- [ ] Quando os horários conhecidos se sobrepõem, aparece um aviso; com encerramento ausente, o site informa essa limitação.
- [ ] No celular, deslizar a tabela permite conferir as duas opções.
- [ ] Retirar uma opção e limpar a comparação funcionam, sem mexer no Eu vou.

## 20. Minha programação compartilhável

- [ ] Abrir Programação pelo menu ou pelo atalho na Minha Agenda.
- [ ] Nenhum evento é selecionado automaticamente.
- [ ] Dar um título, selecionar alguns eventos e gerar o link; o limite é 20 eventos.
- [ ] Escolher da Minha Agenda permite marcar só os eventos que deseja compartilhar, sem adicionar a agenda inteira.
- [ ] Abrir a página compartilhada em outra aba mostra somente os eventos escolhidos e o título.
- [ ] O link não contém o identificador do navegador, os favoritos ou o restante das marcações.
- [ ] Abrir a página compartilhada não marca Eu vou para o visitante.
- [ ] Alterar a seleção na montagem pede gerar outro link. O link antigo mantém a seleção original.
- [ ] Evento encerrado/cancelado tem aviso; evento retirado da exibição pública fica indisponível, sem revelar seu cadastro privado.
- [ ] Copiar link e abrir o WhatsApp para escolher a conversa funcionam. O envio só ocorre ao confirmar no WhatsApp.

O título e a seleção são acessíveis a qualquer pessoa com o link. A seleção fica no próprio endereço, sem cadastro de programação no Supabase, e o site não oferece revogação dos links já compartilhados.

## Como anotar problemas

Para cada falha, anote: item desta lista, celular/computador e navegador, nome do evento, o que você fez, o resultado e uma captura da tela quando possível. Isso ajuda a reproduzir e corrigir exatamente o problema.


- [ ] Na Linha do tempo, combinar Entrada (Pago/Gratuito), Organizador e Bairro com mês, busca e Para crianças. Limpar filtros restaura todas as opções e preserva o mês.

## Busca de eventos no administrador

- [ ] Buscar eventos mostra horário da consulta (distinto de salvamento) e informa cobertura parcial.
- [ ] Conferir que só aparecem eventos futuros com local explicitamente em Ipatinga.
- [ ] Resultado incompleto lista campos para revisar e aponta para a fonte.
- [ ] Escolher categoria e confirmar entrada quando não informada; Revisar e cadastrar abre o formulário como rascunho, sem publicar automaticamente.
- [ ] Completar, salvar e conferir confirmação com horário do Supabase; retornar à lista da busca sem perder os resultados.
- [ ] Possível duplicado, inclusive na lixeira, fica destacado e não sobrescreve o cadastro.
- [ ] Conta sem sessão ou sem perfil administrativo não pode consultar a função.
- [ ] Falha da fonte e limite de buscas exibem erro sem indicar que não existem eventos na cidade.

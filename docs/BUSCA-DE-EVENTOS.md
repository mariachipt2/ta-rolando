# Busca de eventos de Ipatinga

No administrador, abrir Buscar eventos e pressionar Buscar eventos de Ipatinga. A rotina consulta a agenda pública Socialyte no momento da solicitação (cobertura parcial da programação disponível nessa página). Não faz coleta do Instagram nem garante todos os meses ou eventos da cidade.

Os resultados trazem nome, data/hora de Brasília, local e endereço disponíveis, link da fonte e pendências. Preço e gratuidade só são preenchidos com informação estruturada explícita. Sem essa informação, a administradora deve conferir na fonte e escolher Pago/Gratuito. A categoria também é escolhida antes de abrir o formulário. Bairro, Instagram, classificação e adequação infantil permanecem para revisão quando ausentes; não são inferidos. A descrição inicial contém apenas os dados básicos, para completar.

Revisar e cadastrar abre o formulário normal como rascunho, sem publicar nem salvar automaticamente. A capa não é copiada; há um link para conferir o cartaz e a autorização de uso. Após salvar, aparece a confirmação com horário do Supabase e a busca permanece disponível na sessão do painel. Recarregar o navegador descarta a lista temporária, mas não os cadastros salvos.

Possíveis duplicados são comparados com todos os cadastros, incluindo lixeira, pelo link de origem e horário ou nome/data. Nenhum cadastro existente é sobrescrito. Confira sessões e grafias diferentes antes de incluir manualmente.

Backend: função autenticada admin-discovery no Supabase, verifica usuário e admin_profiles ativo antes da consulta. Limite de seis consultas por administradora por hora. URL de origem fixa, sem fetch de links enviados pelo navegador. Resposta limitada a 4 MB e 18 segundos. A função não escreve eventos; usa apenas o contador de limite existente. O Next oferece a mesma consulta em POST /api/admin/discovery.

A consulta original não exige novos campos; as marcações persistentes usam a migração 009_discovery_marks.sql, já aplicada no projeto Supabase. Origem e data da consulta ficam no campo Informações adicionais do cadastro. Para atualizar o Pages, publicar pelo aplicativo habitual.

## Rascunhos

A aba Rascunhos mostra os cadastros salvos ainda não publicados. Ver prévia abre uma visualização privada com cartaz, dados e horário da última gravação. Editar e publicar abre o formulário do cadastro existente; a publicação só acontece após selecionar Status: Publicado e salvar com confirmação do Supabase.

Na busca de eventos, resultados já cadastrados oferecem Editar rascunho ou Abrir cadastro existente. Cadastros na lixeira orientam a restaurar pela aba Lixeira. Não há alteração SQL ou publicação automática.

## Controle do que falta revisar

A busca abre em Pendentes. As abas Já adicionados, Ignorados e Todos mostram contagens para a lista consultada. Cadastros existentes, inclusive rascunhos e lixeira, são reconhecidos automaticamente. Também é possível marcar manualmente um resultado como já adicionado ou ignorado. Essas ações não criam nem excluem eventos. Desfazer marcação remove a decisão manual; se já existe cadastro, ele continua reconhecido como adicionado.

As decisões ficam na tabela privada discovery_marks, identificadas por URL de origem e início da sessão. A função mark_discovery valida o perfil administrativo, registra usuário e horário no servidor e devolve o recibo. A interface muda a marcação somente após receber a confirmação. A consulta é protegida por RLS e a escrita é permitida apenas pela função administrativa. Migração 009 aplicada em 22/10/2026; não precisa rodar novamente.

O botão Histórico agora usa largura de texto. As alterações mostram Antes e Depois em colunas no computador e empilhadas no celular, com quebra de texto e rolagem para conteúdo extenso, sem truncar em 600 caracteres.

## Fontes Pystta e Lhever (implementadas em 22/10/2026)

O seletor Fonte dos eventos permite consultar Socialyte, Pystta ou Lhever. Cada consulta abre em Pendentes e mantém visíveis nome e link da fonte dos resultados, mesmo se a seleção for alterada antes de uma nova busca. As marcações anteriores continuam disponíveis.

Pystta e Lhever são lidos pelas páginas públicas com metadados JSON-LD: primeiro a lista e depois os detalhes. Lhever percorre até cinco páginas da agenda de Ipatinga; a consulta limita os detalhes a 60 páginas, com quatro leituras simultâneas. Há timeout e limite de tamanho. Falhas parciais são informadas; falha completa gera erro. Não são consultadas rotas internas de API, redirecionadores comerciais ou hosts fora dos permitidos.

A função reaproveita consultas completas por até dez minutos na instância ativa (parciais por um minuto), mostrando o horário original dos dados. O cache não substitui as marcações, que permanecem no banco. A cobertura é parcial e as listas podem conter inscrições ou produtos: a administradora deve revisar e ignorar o que não for um evento adequado. Endereço, bairro, preço, Instagram e classificação só são preenchidos quando disponíveis; não há cópia automática do cartaz nem publicação automática.

A identificação de cadastros existentes normaliza links de ingresso Sympla/Bileto e compara a sessão. Isso permite reconhecer um cadastro encontrado por outra fonte sem sobrescrevê-lo. Marcações manuais continuam identificadas por fonte/sessão.

Migração 010_discovery_sources.sql já aplicada, ampliando a restrição de URL de discovery_marks sem apagar dados. A função admin-discovery também foi atualizada. Para o painel novo aparecer no GitHub Pages, publicar pelo aplicativo habitual.

Verificações: testes unitários de fontes e redirecionamentos, paginação e falhas parciais, teste PostgreSQL de marcações com as três fontes, consultas reais retornando Pystta (26 resultados) e Lhever (23 resultados com aviso de páginas indisponíveis na consulta registrada), e conferência visual do seletor, rótulos, marcação e formulário no PC/celular. Nenhum evento foi criado para testes.

# Busca de eventos de Ipatinga

No administrador, abrir Buscar eventos e pressionar Buscar eventos de Ipatinga. A rotina consulta a agenda pública Socialyte no momento da solicitação (cobertura parcial da programação disponível nessa página). Não faz coleta do Instagram nem garante todos os meses ou eventos da cidade.

Os resultados trazem nome, data/hora de Brasília, local e endereço disponíveis, link da fonte e pendências. Preço e gratuidade só são preenchidos com informação estruturada explícita. Sem essa informação, a administradora deve conferir na fonte e escolher Pago/Gratuito. A categoria também é escolhida antes de abrir o formulário. Bairro, Instagram, classificação e adequação infantil permanecem para revisão quando ausentes; não são inferidos. A descrição inicial contém apenas os dados básicos, para completar.

Revisar e cadastrar abre o formulário normal como rascunho, sem publicar nem salvar automaticamente. A capa não é copiada; há um link para conferir o cartaz e a autorização de uso. Após salvar, aparece a confirmação com horário do Supabase e a busca permanece disponível na sessão do painel. Recarregar o navegador descarta a lista temporária, mas não os cadastros salvos.

Possíveis duplicados são comparados com todos os cadastros, incluindo lixeira, pelo link de origem e horário ou nome/data. Nenhum cadastro existente é sobrescrito. Confira sessões e grafias diferentes antes de incluir manualmente.

Backend: função autenticada admin-discovery no Supabase, verifica usuário e admin_profiles ativo antes da consulta. Limite de seis consultas por administradora por hora. URL de origem fixa, sem fetch de links enviados pelo navegador. Resposta limitada a 4 MB e 18 segundos. A função não escreve eventos; usa apenas o contador de limite existente. O Next oferece a mesma consulta em POST /api/admin/discovery.

Sem migração SQL ou novos campos. Origem e data da consulta ficam no campo Informações adicionais do cadastro. Para atualizar o Pages, publicar pelo aplicativo habitual.

## Rascunhos

A aba Rascunhos mostra os cadastros salvos ainda não publicados. Ver prévia abre uma visualização privada com cartaz, dados e horário da última gravação. Editar e publicar abre o formulário do cadastro existente; a publicação só acontece após selecionar Status: Publicado e salvar com confirmação do Supabase.

Na busca de eventos, resultados já cadastrados oferecem Editar rascunho ou Abrir cadastro existente. Cadastros na lixeira orientam a restaurar pela aba Lixeira. Não há alteração SQL ou publicação automática.

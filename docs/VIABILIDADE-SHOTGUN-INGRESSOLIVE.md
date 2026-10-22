# Viabilidade — Shotgun e IngressoLive

Verificação em 22/10/2026. Leitura de páginas públicas e documentação, sem alterar o site, funções ou Supabase, sem acessar contas e sem contornar bloqueios.

## Shotgun

Fontes:
- https://shotgun.live/pt-br/cities/ipatinga
- https://shotgun.live/pt-br/events/utopya
- https://shotgun.live/pt-br/venues/festautopya
- https://support-pro.shotgun.live/hc/en-us/articles/33561354477970-Find-your-Organizer-id-and-API-token

A plataforma possui página de Ipatinga, páginas de produtores e histórico de festas locais, incluindo Utopya. Isso mostra afinidade com a curadoria de festas e música proposta para o Tá Rolando. A edição Utopya consultada está encerrada; exemplos históricos não devem ser importados como eventos futuros.

O teste direto por HTTP retornou 429 e Vercel Security Checkpoint tanto para a página da cidade quanto para a página do evento. Nenhum retry com disfarce de cliente, resolução de desafio ou tentativa de contorno foi realizado. A ferramenta de pesquisa conseguiu ler versões indexadas das páginas, mas isso não prova viabilidade de uma rotina no Supabase. O robots.txt respondeu 200 com regra geral de leitura; ele não elimina a proteção de acesso encontrada.

Há documentação oficial para uma API de eventos vinculada a Organizer ID e API token, gerados no painel do próprio organizador. A documentação de suporte descreve o acesso aos dados desse organizador. Não foi confirmado um catálogo público geral por cidade para agregadores. O link da documentação detalhada de Events API fornecido pelo suporte retornou 404 na ferramenta web desta consulta; não foi possível validar seu esquema ou escopo adicional.

Conclusão: fonte editorial pertinente; coleta pelas páginas não é confiável no teste atual. Para integração estável, buscar autorização/feed da plataforma ou colaboração dos organizadores para acesso aos seus eventos. Não basta criar uma conta comum e presumir acesso ao catálogo de terceiros. Credenciais, se um dia autorizadas, devem ficar no backend.

## IngressoLive

Fontes:
- https://www.ingressolive.com/
- https://www.ingressolive.com/festa-oficial-das-atleticas
- https://www.ingressolive.com/tsl-producoes-198290

A home, a página de um evento e a página pública do organizador responderam HTTP 200. O evento das atléticas traz nome, data, horário, local/endereço, cartaz em Open Graph, classificação 18 anos e TSL Produções como realizador, além de link para outros eventos do mesmo organizador. A edição verificada é de 17/05/2025, portanto passada. Horários nos metadados e na descrição diferem em alguns minutos na amostra; manter conferência humana antes de publicar.

Não apareceu JSON-LD de Event na amostra: a extração precisa de um leitor específico para o HTML e para datas em português. Preços e lotes podem não estar disponíveis no HTML inicial; ausência de preço não significa gratuidade.

A busca por cidade usa o formulário público da home e uma consulta GET a /updateajax. Os nomes dos parâmetros foram verificados no HTML e no JavaScript público referenciado pela própria página; não foram inventados endpoints ou credenciais. O parâmetro Evento[cidade_search]=Ipatinga retornou HTTP 200 e Nenhum resultado encontrado no momento da consulta. Isso vale apenas para a busca efetuada e não significa que não existam eventos em Ipatinga. O robots.txt exclui /index.php; a consulta utilizou a rota observada na interface.

Conclusão: tecnicamente viável como fonte complementar e para pré-cadastro por link de evento. A descoberta atual de próximos eventos de Ipatinga não teve resultados no teste, então não deve ser apresentada como uma fonte abundante ou completa. Uma integração deve validar cidade, datas completas e eventos futuros e manter vínculo com a fonte original.

## Recomendação prática

1. Manter as três fontes existentes e a revisão atual.
2. Considerar importação por link da IngressoLive como uma próxima melhoria, útil quando a administradora ou um organizador encontrar uma nova edição.
3. Para a Shotgun, priorizar relacionamento com produtores locais e acesso autorizado aos eventos deles, sem prometer busca geral automática por cidade.
4. Montar uma lista de organizadores/atléticas e incentivar o envio pelo formulário do Tá Rolando. Usar eventos históricos apenas para identificar quem procurar.

Nenhuma integração foi habilitada nesta etapa de viabilidade. Não há SQL para rodar. Evidências e scripts locais em work/youth-audit/.

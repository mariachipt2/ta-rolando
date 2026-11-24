# Estatísticas: exclusão de tráfego interno

Visualizações são aberturas de páginas de eventos, não visitantes únicos. Agora são enviadas após dois segundos de página visível. Cliques em ingressos continuam sendo enviados no clique.

- O cliente ignora navegadores com `navigator.webdriver`, agentes automatizados identificáveis e a preferência de exclusão local.
- O servidor também filtra agentes de robôs, previews de redes sociais e ferramentas de consulta. Uma sessão válida de administradora, verificada no servidor, não gera visualizações ou cliques em ingressos.
- Em Estatísticas, a opção "Excluir meus acessos neste navegador" mantém a exclusão após o logout. É específica do navegador e domínio, e pode ser desmarcada.
- Bots que verificam o site em navegador devem abrir `https://tarolandoipatinga.com.br/?trafego=interno#/` (ou acrescentar `trafego=interno` na query da rota).
- Integrações que chamam a função `public-events` para testes de métricas devem enviar `X-Ta-Rolando-Traffic: internal`. Consultas de leitura REST, busca e importação de rascunhos não geram visualizações por si mesmas.

Nenhuma tabela nova é necessária. Publique a função `public-events` e o frontend. Não apague os totais anteriores: as métricas históricas são agregadas por evento e dia e não permitem separar consultas internas retroativamente.

O filtro reduz contaminação, mas não comprova que todo acesso restante é humano: bots podem esconder sua identidade e uma pessoa pode ter outros navegadores. Marcações "Eu vou!" mantêm seu comportamento e verificação Turnstile; este filtro cobre visualizações e cliques em ingressos.

# Viabilidade de novas fontes de eventos — 22/10/2026

Verificação de leitura, sem alterar o site, as funções publicadas ou o banco. Foram consultadas as páginas públicas, seus dados estruturados, robots.txt e uma amostra de detalhes do Pystta e do Lhever. Os resultados descrevem o comportamento desta consulta, não um contrato de disponibilidade nem uma garantia sobre todos os eventos.

## Resultado

| Fonte | Resultado técnico | Prioridade |
| --- | --- | --- |
| Pystta — https://www.pystta.com/eventos-em/mg/ipatinga | HTTP 200; lista com 26 entradas em JSON-LD ItemList nesta consulta. Uma página de detalhe trouxe Event com título, início e fim, local/cidade, oferta/preço, imagem, descrição e URL do ingresso original. | Primeira candidata: viabilidade técnica alta para pré-cadastro com revisão. |
| Lhever — https://lhever.com/eventos/ipatinga-mg | HTTP 200; primeira página com 20 entradas em ItemList e link público para página 2. Detalhe do Cine Kids trouxe Event com título, início/fim, local, cidade, imagem e link Bileto. A oferta da amostra não informou preço; não trouxe descrição estruturada. | Segunda candidata: alta viabilidade para descoberta, com preenchimento parcial. |
| Eventos Vale do Aço — https://eventosvaledoaco.com/ | HTTP 200; cartões HTML com nome, dia/mês, local, horário quando informado, cartaz e link da bilheteria. Não apareceu JSON-LD de eventos. Mistura cidades e contém cartões sem ano explícito ou horário. | Integração assistida possível, porém menos estável; não importar uma data completa inferindo o ano. |
| Instituto Usiminas — https://www.institutousiminas.com/em-cartaz/programacao/ | A consulta HTTP retornou 406 e a mensagem Acesso fora da rede Usiminas bloqueado. O acesso via ferramenta web também não carregou. Nenhum bloqueio foi contornado. | Não habilitar a consulta automática direta com base neste teste. |
| Bilheteria oficial do Instituto — https://site.bileto.sympla.com.br/institutousiminas/ | HTTP 200; incorpora uma agenda pública da Sympla com links para Bileto. A agenda possui títulos abreviados e datas sem ano explícito. A página Bileto do Cine Kids retornou a estrutura de uma aplicação JavaScript, sem os dados completos de Event no HTML inicial. | Útil como fonte primária para conferência. Integração completa depende de feed/API autorizado ou de outra forma estável de obter os detalhes. |

## Campos e limitações da amostra

Pystta: a amostra Workshop Trabalhista Weslley Miranda Advogados informou início em UTC e preço zero, também apresentado como Grátis na página. O endereço estruturado informou cidade e UF, mas não rua nem bairro. Organizador, classificação etária, Instagram e adequação infantil não apareceram no objeto Event. Não assumir que todos os eventos têm todos esses campos.

Lhever: a URL curta do Cine Kids redirecionou para uma página de evento com slug. O nome do local continha também texto de endereço; o endereço estruturado indicou apenas Ipatinga/MG/BR. Preço não informado não deve virar gratuito. A lista tem paginação; ler apenas a primeira página perderia resultados.

Eventos Vale do Aço: Special Queen aparece em um cartão com 11 nov e Sessão: 20h; esse cartão não fornece ano em atributo de data. Não deduzir ano pelo mês atual nem pela pasta da imagem. Outros cartões trazem informações a confirmar ou eventos fora de Ipatinga.

As listas podem misturar eventos, inscrições e produtos ligados a eventos (a lista do Pystta incluiu variações de camisetas). Devem continuar disponíveis as decisões Ignorar e Já adicionado. Várias fontes também podem anunciar o mesmo espetáculo, exigindo deduplicação pelo ingresso original e data, além de título/local.

## Acesso e manutenção

Não foi localizada uma API pública documentada nas páginas examinadas. JSON-LD é metadado público da página, não uma API com estabilidade garantida. O Pystta permite as páginas públicas em robots.txt e exclui /api/ e /ir/; uma integração deve usar as páginas públicas e o link direto de ingresso fornecido nos metadados, sem consultar essas rotas excluídas. O Lhever permite páginas públicas na regra geral e exclui /busca e /__; há também regras específicas para agentes. Eventos Vale do Aço publica as regras usuais do WordPress. Essas observações não são uma autorização para republicar textos e imagens; manter dados factuais, fonte e revisão, e conferir autorização para cartazes.

Para uma integração: executar sob demanda no backend autenticado, limitar quantidade e concorrência, manter cache, tratar falhas por fonte e não interpretar indisponibilidade como ausência de eventos. Validar cidade e horários com fuso explícito. Não copiar descrições integrais nem fotos automaticamente. Não declarar adequado para crianças a partir da categoria ou do nome.

## Alterações necessárias se a integração for solicitada

1. Adicionar leitores específicos para Pystta e Lhever e um seletor de fonte no administrador. O parser atual aceita apenas Socialyte e não lê ItemList como estas fontes exigem.
2. Remover rótulos fixos Socialyte do painel, preservando nome e URL de cada fonte.
3. Ajustar a validação da marcação no backend e a restrição de source_url da tabela discovery_marks, hoje limitada a URLs Socialyte. Isso exigirá uma nova migração SQL, sem apagar as marcações existentes. Não foi aplicada agora.
4. Guardar as decisões por fonte/sessão e detectar o mesmo evento entre fontes antes de criar cadastros. Guardar o link da bilheteria original para ajudar nessa conferência.
5. Implementar e testar primeiro uma fonte por vez, incluindo paginação, campos ausentes e falha parcial.

Recomendação: Pystta primeiro, Lhever em seguida. Manter a bilheteria oficial do Instituto como conferência primária enquanto a extração estável dos detalhes não estiver resolvida. Deixar Eventos Vale do Aço como apoio assistido.

Evidências de leitura e scripts de auditoria estão em work/source-audit/ (fora da publicação). O código de produção e o Supabase não foram alterados nesta verificação.

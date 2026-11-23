# Locais e ambiente — Tá Rolando

O cadastro agora usa uma busca de locais no administrador e no envio de sugestões. Escolher um resultado preenche nome canônico, bairro e ambiente; os dados continuam editáveis. Um local novo pode ser digitado livremente. O ambiente escolhido é da área usada pelo evento, que pode diferir do padrão do estabelecimento.

Admin → Locais permite revisar bairro, cobertura e demais dados reutilizados. Um local apenas digitado em um evento não altera silenciosamente o cadastro do estabelecimento; para fixar seus dados para os próximos cadastros, salve-o em Locais.

## Contrato dos bots

- Campo da ficha: `environment`. Valores aceitos: `coberto`, `ao_ar_livre`, `misto` ou `null`. O nome `ambiente` só é usado no dicionário de consulta, não na ficha enviada à API.
- Continue usando `venue_name` e `neighborhood`. Use o nome canônico do dicionário quando a identidade e a cidade coincidirem. Não substitua locais só porque têm nomes parecidos.
- Consulte os locais atualizados com `& (Join-Path $env:LOCALAPPDATA 'TaRolandoOpenBot\Consultar-Locais.ps1')`. O comando lê somente o diretório público e atualiza `C:\Users\maria\OpenBot\Shared\Data\locais_padronizados.json`. Se a consulta falhar, a cópia local pode estar desatualizada: não diga que consultou o banco.
- O dicionário contém `nome`, `bairro`, `ambiente` e `aliases`. `ambiente: null` significa cobertura não confirmada. Bairro vazio exige consulta; não invente o endereço ou o número.
- Prioridade: informação confirmada da área usada pelo evento; depois cadastro confirmado do local; por último `null`. Não suponha cobertura a partir do tipo “bar”, “boate” ou “teatro” no título. Um evento externo no jardim de um espaço coberto deve ser `ao_ar_livre`.
- “Misto” significa áreas cobertas e descobertas. Não prometa proteção integral contra chuva. Isto é classificação de cobertura, não previsão do tempo e não confirmação de realização sob chuva.
- O importador padroniza aliases conhecidos e completa bairro/cobertura faltantes a partir do cadastro ativo. Um valor explícito no rascunho prevalece; `null` preserva a incerteza. Dados divergentes precisam de revisão da Maria.
- Mantenha o fluxo atual: salvar como **rascunho**, devolver `review_url` e aguardar a Maria. Não publicar nem editar eventos antigos em massa por causa desta novidade. Não reenviar para criar uma cópia só para mudar o ambiente; indique o cadastro existente para revisão.
- Revisor: confira nome, cidade, bairro e ambiente com a fonte; ausência de confirmação é pendência de informação, não prova de que o evento será cancelado. Social: só use frases como “rolê coberto” se esse dado estiver confirmado para aquele evento.

Exemplo de campos adicionais (preserve os demais campos obrigatórios da ficha):
```json
{"venue_name":"Garajão","neighborhood":"Novo Centro","environment":"coberto"}
```

## Base inicial e limites

São 13 locais iniciais. Bairros vêm dos cadastros existentes; a Estação do Chopp tinha Canaã e Caçula, por isso ficou sem bairro padrão até confirmação. Não houve recategorização de eventos antigos.

Referências para a cobertura dos espaços públicos/culturais: [Parque Ipanema — Prefeitura](https://www.ipatinga.mg.gov.br/detalhe-do-estabelecimento/estabelecimento/parque-ipanema/9), [espaços do Instituto Usiminas](https://www.institutousiminas.com/locacao/) e [Centro Cultural — Prefeitura](https://turismo.ipatinga.mg.gov.br/detalhe-do-estabelecimento/estabelecimento/centro-cultural-usiminas/16). O complexo cultural é misto; o teatro é um espaço distinto coberto. Demais coberturas permanecem a confirmar.

## Implantação

Migração: `025_venue_environment.sql`. Acrescenta `environment` em events/venues, views, gravação, recorrência, histórico e restauração. Mantém permissões administrativas e expõe apenas nome, bairro, ambiente, cidade e UF de locais ativos autorizados para compartilhamento. Funções `openbot-drafts` e `public-events` atualizadas no Supabase. O frontend precisa ser publicado pelo app do GitHub.


## Confirmação da Maria — 23/11/2026
Garajão: coberto. Estação do Chopp: misto. Classificação aplicada aos eventos não excluídos e aos cadastros de locais e organizadores. Selecionar o organizador reutiliza o ambiente, editável no evento.

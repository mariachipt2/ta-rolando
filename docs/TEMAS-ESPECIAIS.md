# Temas especiais

No administrador, abra **Tema especial**. Escolha Gelo / Frozen ou Halloween,
o evento destacado e a animação (sem animação, suave ou intensa).
Use **Pré-visualizar** antes de ativar e salvar. A prévia não publica nada.

Início e término são opcionais e usam Brasília. Sem início, começa após salvar;
sem término, acompanha o encerramento do evento. O tema só aparece enquanto
o evento está público e ainda não encerrou; rascunho, cancelamento e lixeira
retiram o destaque. Só há um tema especial por vez. **Desativar agora** salva
a configuração desligada, mesmo se houver outras alterações pendentes no formulário.
As páginas abertas atualizam a configuração em até um minuto ou ao voltar à aba.

O brilho percorre os menus e os detalhes do destaque flutuam suavemente.
A preferência `prefers-reduced-motion` desliga as animações. No celular, o menu
mantém os mesmos controles. O tema Gelo usa uma cena panorâmica de castelo,
lago congelado e floresta, moldura de cristais transparente e neve animada.
A cena foi produzida a partir da proposta visual escolhida pela usuária.
Título, data, local, contagem e botão continuam sendo dados reais do evento.
No celular, a cena tem versão menor e mostra o castelo abaixo da chamada.
A abertura normal fica oculta enquanto o destaque estiver ativo.
Sem animação e redução de movimento mantêm a arte, mas retiram a neve.
O Halloween usa uma mansão panorâmica, lua, abóboras iluminadas, névoa e
morcegos animados. O destaque mantém os dados reais do evento. A animação
suave reduz os morcegos, a intensa aumenta o movimento, e sem animação
mantém o cenário estático. A preferência de reduzir movimento também é respeitada.

As artes WebP ficam em `src/assets/themes/` e são incluídas com caminhos
versionados pelo build do Vite e do Next.js. Esta atualização visual não
exige novos campos nem nova migração no Supabase.

## Supabase

A migração `014_special_theme.sql` cria `site_special_theme` e `save_special_theme`.
Foi aplicada no projeto `oiejqsgkrrwqlgohtxta` em 26/10/2026 com a configuração
desativada e sem evento selecionado. Não é necessário executar o SQL novamente.
Visitantes leem a configuração pública, mas não escrevem nem executam a função
de salvamento. A função exige administradora ativa, valida o evento e retorna
`saved_at` do banco; a gravação atualiza também o recibo geral do painel.

A implementação atende GitHub Pages/Vite e Next.js. A publicação do código no
GitHub continua sendo feita pelo aplicativo da usuária.

## Verificação

Testes de período e contagem em Brasília, estado do evento, validação de dados,
permissões e recibo em PostgreSQL local (PGlite); build Pages, verificação dos
assets e build Next.js. Interface exercitada com dados ilustrativos e transporte
simulado, sem publicar eventos nem ativar o tema em produção. Leitura pública
real da configuração e permissões conferidas no Supabase.

A revisão visual do castelo foi conferida em 1280px e 390px, com dados públicos
do evento Aventura Congelante | O Legado e a configuração de tema simulada
somente na prévia local. Busca, menu móvel, prévia do painel, animação desligada
e retorno ao visual normal foram exercitados sem gravar a configuração real.
A checagem Pages também valida os arquivos referenciados pelas URLs do CSS.

A revisão da mansão de Halloween foi conferida em 1280px e 390px, com
dados públicos do evento Halloween Mansão e configuração simulada na prévia
local. Menus, prévia isolada, animações desligadas e desativação foram
verificados. Builds Pages e Next.js e caminhos das artes no CSS passaram.
Nenhuma configuração de produção foi ativada ou alterada nesta revisão.

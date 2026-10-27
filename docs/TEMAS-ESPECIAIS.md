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
mantém os mesmos controles. A capa usada é a do próprio evento; sem capa,
aparece um símbolo do tema. As imagens conceituais geradas são referências,
não fundos incorporados ao site.

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

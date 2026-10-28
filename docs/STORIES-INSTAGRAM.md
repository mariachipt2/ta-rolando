# Minha programação em Stories

Em **Planejar rolê → Minha programação**, selecione de 1 a 20 eventos,
escolha o título e toque em **Criar Stories para Instagram**.
Cada PNG tem 1080 × 1920 pixels e até três eventos em ordem de data.
A seleção inteira fica acessível no QR code de todas as imagens e no botão
de copiar link. Com 20 eventos são geradas sete imagens, para baixar uma por vez.

Cada imagem leva cartaz, título, data/hora de Brasília, local, marca e endereço
do Tá Rolando. Foto inacessível ou bloqueada por CORS usa um quadro com a marca;
as informações do evento permanecem. Eventos cancelados/encerrados são
identificados, quando vierem da Minha Agenda. Mudanças na seleção ou no título
descartam a prévia anterior, para evitar compartilhar a seleção errada.

Baixe a imagem ou use o menu de compartilhamento do aparelho, quando suportado.
A escolha do Instagram e a publicação dependem da pessoa e dos aplicativos
disponíveis. No Story, use a figurinha de link com o endereço copiado; texto
desenhado na imagem não é clicável. A imagem é um retrato das informações na
geração; o link continua mostrando as atualizações dos eventos.

Tudo é gerado no navegador. Sem novas tabelas, campos ou SQL no Supabase,
sem postagem automática e sem acesso à conta do Instagram. O link usa apenas
os IDs dos eventos selecionados e o título, sem o identificador privado da agenda.

Validação: seleção real de quatro eventos gerou dois PNGs (três eventos + um),
ambos em 1080 × 1920, com download conferido visualmente. A troca do título
e a remoção de um evento descartaram as prévias anteriores. Layout de 390px
sem rolagem lateral. Os exemplos em docs/previews foram gerados em localhost
e não devem ser usados como imagens públicas, pois seus QR codes apontam para
o ambiente de teste. Na publicação, o endereço vem do site acessado.

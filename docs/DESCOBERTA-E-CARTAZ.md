# Filtro infantil, cartaz, semelhantes e pendências

Atualização de 20/10/2026. Não há campos, tabelas ou variáveis novos no Supabase. Publique os arquivos pelo seu aplicativo habitual.

- **Para crianças:** botão na busca principal e na linha do tempo. Usa apenas `family_friendly = true`. Classificação Livre ou categoria infantil não substituem essa confirmação; eventos com indicação não informada ficam fora desse filtro.
- **Cartaz:** na página do evento, “Criar cartaz para WhatsApp” gera um PNG com foto, título, data em Brasília, local, endereço, link escrito e QR Code. Se a foto não carregar, o cartaz pode ser gerado com as informações. A imagem é criada no navegador e não é salva no Supabase. “Compartilhar cartaz” abre o menu do aparelho quando há suporte ao envio de arquivos; escolha WhatsApp. “Baixar imagem” funciona como alternativa para anexar manualmente. Cancelar o compartilhamento não é informado como envio concluído.
- **Semelhantes:** até três outros eventos futuros da mesma categoria, ordenados por data. Não inclui o próprio evento, rascunhos, cancelados, lixeira ou publicações agendadas ainda indisponíveis. A seção não aparece quando não há opções.
- **Pendências:** resumo no início do administrador, aba própria e avisos em cada cadastro. Considera foto de capa ou galeria, dados de local/endereço ausentes e confirmação de número ou s/n. Há filtros separados, botão para completar o cadastro e atalho para sugestões aguardando análise. Lixeira não entra na contagem. A verificação é um lembrete; não é uma validação geográfica e não altera os registros.

O compartilhamento de arquivos depende do dispositivo, dos aplicativos instalados e do suporte do navegador à [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share). O QR Code é produzido localmente com [node-qrcode](https://github.com/soldair/node-qrcode), sem serviços externos de geração.

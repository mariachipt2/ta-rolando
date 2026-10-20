# Fotos, alterações e gestão de eventos

Implementado em 20/10/2026. As migrations **007_event_management.sql** e **008_submission_photos.sql** já foram aplicadas ao Supabase deste projeto e a função `public-events` foi atualizada. Não execute novamente nesse banco. Não há novas variáveis de ambiente. Publique os arquivos locais pelo aplicativo que você já usa para atualizar o GitHub Pages.

- **Foto na sugestão:** JPG, PNG ou WebP até 5 MB. A foto fica no armazenamento privado. Ao revisar a sugestão, a administradora pode usar a foto como capa ou enviar outra. A aprovação copia a imagem escolhida para o armazenamento público.
- **Alteração ou cancelamento:** editar os principais dados de um evento publicado gera aviso com data. É possível escrever uma orientação no campo “Aviso de alteração para visitantes”. O aviso aparece na página do evento e nos cartões da Minha Agenda. Cancelados saem das recomendações, mas seus links e marcações continuam disponíveis. São avisos dentro do site; não são mensagens por e-mail ou notificações no celular.
- **Informar um problema:** botão na página do evento. O visitante escolhe o tipo, escreve uma descrição e faz a verificação antirrobôs. O painel separa pendentes, resolvidos e descartados. Marcar como resolvido não altera o evento: use “Editar evento” para corrigir os dados.
- **Lixeira:** o botão da lixeira oculta o evento sem apagar imagens, marcações ou versões. Na aba Lixeira, “Restaurar evento” recupera o registro e o status anterior. Não existe exclusão definitiva no painel.
- **Histórico:** cada evento tem seu botão Histórico, com as últimas 50 versões e diferenças. Restaurar uma versão recupera o conteúdo, preservando identificador, marcações e histórico. Um evento na lixeira continua nela até ser restaurado pela aba Lixeira. O histórico começa nesta atualização; alterações mais antigas não podem ser reconstruídas.
- **Recorrentes:** ao criar um evento, escolha semanal, a cada duas semanas ou mensal e uma quantidade entre 2 e 24, incluindo a primeira edição. Todas as edições são criadas ao salvar. Cada edição pode ser editada ou cancelada separadamente. No caso mensal, o dia é ajustado para o último disponível em meses mais curtos, mantendo o horário de Brasília e a duração.
- **Crianças:** a classificação indicativa tem uma lista de opções. A adequação para crianças é uma seleção separada: Sim, Não recomendado ou Não informado. Eventos antigos não recebem uma indicação inventada: permanecem como “consulte o organizador” até serem revisados.
- **Salvamento discreto:** o indicador “Salvo” mantém a data, hora e segundos confirmados pelo banco, em Brasília. Alterações pendentes e falhas continuam visíveis. O histórico não substitui o backup do Supabase.

## Estrutura adicionada ao Supabase

| Objeto | Finalidade |
| --- | --- |
| `events.family_friendly` | Adequação para crianças |
| `events.deleted_at` | Lixeira recuperável |
| `events.change_notice`, `events.change_at` | Aviso e data de alteração |
| `events.recurrence_group`, `events.recurrence_index` | Grupo e edição recorrente |
| `event_submissions.photo_path` | Caminho da foto privada |
| `event_reports` | Avisos dos visitantes e sua análise |
| `event_versions` | Versões e diferenças dos eventos |
| `event_series` | Criação recorrente e prevenção de duplicidade |
| bucket privado `submission-images` | Fotos aguardando análise |

As novas tabelas têm acesso público bloqueado e leitura administrativa protegida. O envio público passa pela função de serviço, com Turnstile, validação e limite de requisições. Fotos de sugestões não têm leitura pública direta. Nenhum evento fictício foi criado em produção durante os testes.

# Ingressos esgotados

No administrador, abra **Editar evento**, marque **Ingressos esgotados** perto de preço e ingresso e salve. Desmarcar reabre a divulgação. O recibo de salvamento continua sendo confirmado pelo Supabase.

Os marcados ficam fora da inicial/carrossel/destaques, agenda por dia, fim de semana, especiais, Tá bombando, semelhantes e próximos eventos de artistas/organizadores. A página direta permanece acessível com aviso, e o botão de ingresso fica oculto. Administração, histórico, linha do tempo e agendas pessoais preservam os cadastros; esgotamento não significa cancelamento.

Campo `events.sold_out`, booleano, default false. Migração027 aplicada no Supabase, incluindo views, criação em série, aviso e restauração do histórico. Nenhum evento foi marcado automaticamente. O Social não seleciona esgotados. O frontend precisa ser enviado pelo app do GitHub.

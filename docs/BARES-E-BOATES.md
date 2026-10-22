# Bares, boates e locais

No administrador, abra **Bares e boates**. Consulte as fontes, confira a página de origem e use **Revisar e salvar local**. Também é possível cadastrar manualmente ou aproveitar os locais dos eventos existentes. Filtre por nome, bairro e tipo.

Um local salvo pode preencher endereço, bairro, organizador e Instagram de um novo evento. As datas, atrações e entrada devem ser preenchidas e conferidas em cada edição. Alterações do local não modificam eventos antigos.

Ative o link de programação para copiar e enviar ao estabelecimento. O formulário abre com os dados fixos preenchidos; o envio continua passando pelo Turnstile e pela aprovação administrativa. Nenhuma mensagem é enviada automaticamente. Desativar o local ou seu link impede novos acessos a esse formulário.

A consulta utiliza OpenStreetMap/Overpass e os locais publicados na agenda Socialyte. Cobertura parcial, cache de seis horas e limite de três consultas por hora por administradora. Nos testes a base de mapas ficou indisponível; a agenda retornou sete sugestões que exigem classificação. Não há garantia de todos os bares/boates, funcionamento, música ao vivo ou programação. A origem permanece visível. Campos ausentes devem ser completados pela administração.

## Supabase

A migração 011_venues.sql foi aplicada, ampliando a tabela venues existente e preservando os registros. A função admin-places exige sessão de administradora. Escrita ocorre por RPC administrativa; a consulta pública por identificador retorna somente dados básicos de locais ativos com link habilitado. Não existe listagem pública da tabela. Salvamentos administrativos registram confirmação e horário do banco.

## Conferência

- Buscar fontes e conferir aviso de cobertura.
- Revisar um resultado, classificar como bar/boate e salvar.
- Conferir data da confirmação; editar e recarregar.
- Criar evento pelo local e conferir campos fixos.
- Em outro evento, selecionar local e clicar em Preencher dados do local.
- Abrir link de programação, preencher e enviar para análise.
- Desativar link e verificar mensagem de indisponibilidade.

Validação técnica: 46 testes, incluindo permissões, preservação de cadastro antigo, idempotência e parsers. Fluxos de interface conferidos em prévia isolada sem gravar cadastros de teste no banco real.

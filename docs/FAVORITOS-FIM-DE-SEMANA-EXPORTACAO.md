# Organizadores, resumo do fim de semana e exportação

Implementado em 20/10/2026. Não há novos campos ou tabelas no Supabase, nem novas variáveis de ambiente. Publique os arquivos pelo aplicativo que você já usa.

## Organizadores favoritos

Use **Organizadores** no menu para explorar os organizadores cadastrados e acompanhar os que você preferir. A página de cada evento também tem **Acompanhar organizador**, quando existe um nome ou perfil de Instagram informado. Os próximos eventos aparecem em **Meus favoritos**.

A identificação usa primeiro o perfil do Instagram; na ausência dele, usa o nome normalizado. Mantenha nomes e perfis consistentes no cadastro para reunir os eventos corretamente. O nome do local não é usado para inventar um organizador quando o cadastro não informa nenhum.

Favoritos ficam no armazenamento deste navegador, sem login e sem notificações. Eles não são compartilhados entre dispositivos. Apagar os dados do navegador remove a lista. Os eventos continuam no Supabase independentemente dessa lista.

## Sexta a domingo

**Fim de semana** abre o próximo intervalo de sexta a domingo; durante sexta, sábado e domingo, mantém o fim de semana atual. A referência é o horário de Brasília. Os botões Anterior e Próximo mudam uma semana por vez.

O resumo inclui eventos públicos que começam ou continuam nessas datas, sem repetir cada evento por dia. Eventos cancelados, na lixeira ou ainda não publicados ficam fora. Eventos que começaram antes são identificados como em andamento. O filtro “Fim de semana” da busca principal também passou a incluir sexta-feira.

**Compartilhar resumo no WhatsApp** prepara o texto e o link para você escolher a conversa e confirmar o envio. **Copiar link deste fim de semana** mantém as datas no endereço (`inicio=AAAA-MM-DD`); o link não muda para a semana seguinte quando alguém o abre depois. Os dados de cada evento continuam podendo ser atualizados pela administração.

## Exportação administrativa

No administrador, abra **Exportar cadastros**:

- **JSON:** eventos, categorias e sugestões, com versão do formato, horário de preparação e última gravação confirmada no banco.
- **Eventos CSV / Sugestões CSV:** cópias para consulta em planilha, com separador `;`, UTF-8 e proteção contra interpretação de textos como fórmulas.

Cada clique consulta novamente os registros autorizados no Supabase, incluindo paginação completa, lixeira e todas as situações de sugestão. Se uma consulta falhar, o arquivo não é preparado parcialmente. O link **Baixar arquivo preparado** permite tentar o download novamente.

Fotos são referências por URL ou caminho; os arquivos binários não são copiados. A exportação não inclui senhas, sessões, hashes dos visitantes, URLs temporárias de fotos privadas, usuários, marcações individuais ou histórico de versões. É uma cópia dos cadastros para consulta e preservação, sem importação automática; mantenha também o backup do banco e do armazenamento no Supabase.

## Verificação

21 testes automatizados aprovados. Favorito conferido após recarregar, depois removido da prévia local. Datas fixas do resumo conferidas após recarregar. Exportação sem autenticação bloqueada com HTTP 401. Arquivos JSON e CSV efetivamente baixados em prévia com dados fictícios, depois lidos para conferir contagens, lixeira, caracteres, privacidade e fórmulas. Nenhum cadastro real foi alterado para os testes.

# WhatsApp no computador — Tá Rolando

Preparado no PC em 23/10/2026: Docker Desktop e WSL instalados; Evolution API v2.3.7 fixada por digest, PostgreSQL e Redis rodando em contêineres. API e painel acessíveis somente por loopback. O gerenciador oficial apresentou um erro de configuração no Nginx; por isso, foi substituído por um painel local próprio, sem serviço extra nem necessidade de copiar chave no navegador.

## Usar

1. Abra http://127.0.0.1:8190 no próprio PC. Clique em Mostrar / atualizar QR Code quando necessário.
2. No WhatsApp pessoal, abra Aparelhos conectados → Conectar um aparelho e leia o QR. Essa autorização é feita por você no celular.
3. Aguarde aparecer conectado. Clique em Enviar um teste para mim e confira a conversa Você no celular.
4. Se estiver tudo certo, clique em Ativar avisos para meu número.

O envio ao próprio número pode não produzir uma notificação sonora/push. O teste é indispensável antes de depender desse canal. Para receber mensagens vindas de outro contato, seria necessário outro número conectado como remetente.

## Abrir novamente ou parar

Na pasta do projeto, use INICIAR-WHATSAPP.cmd (Docker Desktop precisa estar aberto e pronto). A janela do conector deve ficar aberta; a aba do navegador pode ser fechada. PARAR-WHATSAPP.cmd encerra o conector e para os contêineres, preservando dados e sessão. Não foi criada uma tarefa de inicialização automática do Windows.

Credenciais e estado: %LOCALAPPDATA%\TaRolando\WhatsApp. As chaves aleatórias são geradas uma vez e preservadas. Não copie essa pasta para o GitHub. Não use comandos de remoção de volumes: eles apagam a sessão e o banco local da Evolution.

## Funcionamento e limites

O conector Node consulta a tabela privada publication_notifications com a chave de servidor já existente no .env.local, exclusivamente no processo local. Nada disso é servido ao navegador ou incluído na versão pública do site. Não há nova migração nem SQL pendente.

A cada minuto, confere a conexão, o número da própria conta e os avisos desde a primeira ativação. Eventos retirados ou cancelados antes do envio são ignorados. O retorno ao PC processa pendências posteriores à ativação. O registro local impede repetição de avisos já aceitos. Se o processo cair durante o envio, ou a resposta não confirmar o aceite, o resultado fica incerto e não é repetido automaticamente. Aceite da API não é confirmação de entrega no celular. O painel local mostra contagens e falhas; o sininho do administrador continua independente.

Sync de histórico e gravação de mensagens, contatos e conversas desativados. A sessão do WhatsApp fica na Evolution local. O usuário pode revogar a conexão pelo próprio WhatsApp, em Aparelhos conectados. A modalidade usa Baileys/WhatsApp Web e pode precisar de reconexão.

O computador tem 8 GB de RAM, no limite mínimo informado para Docker/WSL; os contêineres podem disputar memória com outros aplicativos. Pode parar o conjunto quando não estiver testando.

## Referências

- https://github.com/evolution-foundation/evolution-api
- https://docs.docker.com/desktop/setup/install/windows-install/

Conferidos: Compose válido, API autenticada respondendo, QR Code gerado, bloqueios de origem/host externos, testes de formatação, elegibilidade, persistência antes do envio e prevenção de duplicação. A conexão pelo celular e a entrega real dependem da leitura do QR pelo usuário.

export const metadata = { title: "Privacidade" };
export default function Page() {
  return (
    <article className="shell page prose">
      <h1>Sua agenda, sua privacidade.</h1>
      <p>
        Para marcar “Eu vou!”, usamos um identificador aleatório no armazenamento
        essencial do navegador, válido por até 180 dias. Dependendo da versão do site,
        ele fica em um cookie ou no armazenamento local. Não pedimos nome,
        telefone ou e-mail. O banco guarda somente uma versão criptograficamente
        derivada desse identificador, associada aos eventos escolhidos.
      </p>
      <h2>O que a contagem significa</h2>
      <p>
        São marcações de interesse, não presenças confirmadas nem ingressos.
        Navegadores e dispositivos diferentes podem gerar marcações diferentes.
      </p>
      <h2>Retenção e controle</h2>
      <p>
        Você pode retirar cada marcação na Minha Agenda. Marcações de eventos
        encerrados há mais de 180 dias são removidas pela rotina de manutenção.
        Estatísticas diárias agregadas são preservadas. Apagar os dados do site impede
        que este navegador recupere as marcações anteriores.
      </p>
      <h2>Serviços utilizados</h2>
      <p>Sugestões de eventos são recebidas em uma fila privada para análise administrativa. Se aceitas, as informações do evento são publicadas. Não inclua dados pessoais desnecessários. As sugestões são removidas pela rotina de manutenção após 180 dias.</p>
      <p>
        Supabase hospeda dados e autenticação administrativa. A hospedagem e a
        verificação antiautomação podem processar dados técnicos segundo suas
        próprias políticas. A aplicação não grava endereços IP nas tabelas.
        Links de mapas, ingressos e WhatsApp levam a serviços externos.
      </p>
      <h2>Responsável pelo site</h2>
      <p>
        Antes da abertura ao público, o responsável pelo Tá Rolando deve
        informar aqui sua identificação e canal de contato para solicitações de
        privacidade. Esta versão está em preparação para lançamento.
      </p>
    </article>
  );
}

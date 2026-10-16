import { publicData } from "@/lib/data";
import { Agenda } from "@/components/agenda";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Minha Agenda",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const { events } = await publicData();
  return (
    <div className="shell page">
      <span className="eyebrow">TEM COISA BOA TE ESPERANDO</span>
      <h1>
        Minha agenda<span className="lime">.</span>
      </h1>
      <p className="lead">Os rolês que você quer viver, todos aqui.</p>
      <p className="notice">
        Sua agenda fica associada a este navegador por até 180 dias. Limpar os
        dados ou trocar de dispositivo pode apagar o acesso às marcações.
        Eventos despublicados deixam de aparecer.
      </p>
      <Agenda events={events} />
    </div>
  );
}

import Link from "next/link";
export default function NotFound() {
  return (
    <div className="shell page">
      <h1>Esse rolê não está por aqui.</h1>
      <p>O evento pode ter sido removido ou ainda não estar publicado.</p>
      <Link href="/" className="button lime-button">
        Voltar para o início
      </Link>
    </div>
  );
}

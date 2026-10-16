"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="shell page">
      <h1>Vamos tentar de novo?</h1>
      <p>Não conseguimos carregar esta página agora.</p>
      <button className="button lime-button" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}

"use client";
import {request,navigate} from "@/lib/transport";
import { useState } from "react";
import { LockKeyhole, ArrowRight } from "lucide-react";
export function AdminLogin({ configured, configurationHint }: { configured: boolean; configurationHint?:string }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="login-card">
      <LockKeyhole className="purple" size={32} />
      <span className="eyebrow">BASTIDORES DO TÁ ROLANDO</span>
      <h1>Bom te ver por aqui.</h1>
      <p>Entre para dar vida aos próximos rolês da cidade.</p>
      {!configured && (
        <p className="notice">
          {configurationHint || 'Configure as variáveis do Supabase em .env.local e execute as migrations para habilitar o painel.'}
        </p>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const form = new FormData(e.currentTarget);
          try {
            const r = await request("/api/admin/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(Object.fromEntries(form)),
            });
            const d = await r.json();
            if (!r.ok) throw Error(d.error);
            navigate("/admin");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Falha ao entrar.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          E-mail
          <input type="email" name="email" required autoComplete="username" />
        </label>
        <label>
          Senha
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <button disabled={!configured || busy} className="button lime-button">
          {busy ? "Entrando…" : "Entrar no painel"}
          <ArrowRight size={18} />
        </button>
      </form>
      <small>Acesso exclusivo a administradores autorizados.</small>
    </div>
  );
}

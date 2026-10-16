"use client";
import { useEffect, useState } from "react";
import { Copy, MessageCircle, ExternalLink } from "lucide-react";
export function Share({
  title,
  id,
  ticket,
}: {
  title: string;
  id: string;
  ticket: string;
}) {
  const [copied, setCopied] = useState(false),
    [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(location.href);
    fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: id, kind: "view" }),
    }).catch(() => {});
  }, [id]);
  return (
    <div className="share-buttons">
      {ticket && (
        <a
          href={ticket}
          target="_blank"
          rel="noopener noreferrer"
          className="button primary"
          onClick={() => {
            fetch("/api/metrics", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ event_id: id, kind: "ticket" }),
              keepalive: true,
            }).catch(() => {});
          }}
        >
          Ingressos oficiais <ExternalLink size={16} />
        </a>
      )}
      <a
        className="button secondary"
        target="_blank"
        rel="noopener noreferrer"
        href={"https://wa.me/?text=" + encodeURIComponent(title + " — " + url)}
      >
        <MessageCircle size={16} /> WhatsApp
      </a>
      <button
        className="button secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            setCopied(false);
            window.prompt("Copie o link:", url);
          }
        }}
      >
        <Copy size={16} />
        {copied ? "Link copiado!" : "Copiar link"}
      </button>
    </div>
  );
}

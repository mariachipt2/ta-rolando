"use client";
import {request} from "@/lib/transport";
import { useEffect, useState } from "react";
import { Copy, Share2, ExternalLink } from "lucide-react";
export function Share({
  title,
  id,
  ticket,
}: {
  title: string;
  id: string;
  ticket: string;
}) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  useEffect(() => {
    setCopied(false);
    request("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: id, kind: "view" }),
    }).catch(() => {});
  }, [id]);
  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copie o link:", url);
    }
  }

  async function shareEvent() {
    const url = location.href;
    const data = { title, text: `Bora nesse rolê? ${title}`, url };
    if (!navigator.share || (navigator.canShare && !navigator.canShare(data))) {
      await copyLink(url);
      return;
    }
    setSharing(true);
    try {
      await navigator.share(data);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        await copyLink(url);
      }
    } finally {
      setSharing(false);
    }
  }
  return (
    <div className="share-buttons">
      {ticket && (
        <a
          href={ticket}
          target="_blank"
          rel="noopener noreferrer"
          className="button primary"
          onClick={() => {
            request("/api/metrics", {
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
      <button type="button" className="button secondary" disabled={sharing} onClick={shareEvent}>
        <Share2 size={16} aria-hidden="true" /> Compartilhar
      </button>
      <button
        className="button secondary"
        type="button"
        onClick={() => copyLink(location.href)}
      >
        <Copy size={16} />
        <span aria-live="polite">{copied ? "Link copiado!" : "Copiar link"}</span>
      </button>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ZoomIn } from "lucide-react";
import type PhotoSwipe from "photoswipe";
import "photoswipe/style.css";

export function PosterZoom({ src, title }: { src: string; title: string }) {
  const viewer = useRef<PhotoSwipe | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => () => viewer.current?.destroy(), []);

  async function open() {
    const button = trigger.current;
    if (!button || viewer.current) return;
    setLoading(true);
    setFailed(false);
    const poster = new Image();
    poster.src = src;
    try {
      const [{ default: Viewer }] = await Promise.all([import("photoswipe"), poster.decode()]);
      if (trigger.current !== button || !button.isConnected) return;
      const dialog = new Viewer({
        dataSource: [{ src, alt: title, width: poster.naturalWidth, height: poster.naturalHeight }],
        showHideAnimationType: matchMedia("(prefers-reduced-motion: reduce)").matches ? "none" : "fade",
        closeTitle: "Fechar cartaz",
        zoomTitle: "Ampliar ou reduzir",
        errorMsg: "Não foi possível carregar o cartaz.",
        returnFocus: false,
      });
      viewer.current = dialog;
      dialog.on("destroy", () => {
        viewer.current = null;
        if (button.isConnected) button.focus({ preventScroll: true });
      });
      dialog.init();
    } catch {
      if (button.isConnected) setFailed(true);
    } finally {
      if (button.isConnected) setLoading(false);
    }
  }

  return (
    <div className="poster-zoom">
      <button ref={trigger} type="button" className="button secondary" aria-label="Ampliar cartaz"
        aria-busy={loading} aria-disabled={loading} onClick={() => { if (!loading) void open(); }}>
        <ZoomIn size={17} aria-hidden="true" /> {loading ? "Abrindo…" : "Ampliar cartaz"}
      </button>
      {failed && <span role="status">Não foi possível abrir o cartaz. Tente novamente.</span>}
    </div>
  );
}

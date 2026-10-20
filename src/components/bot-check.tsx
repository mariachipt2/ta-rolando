"use client";
import { useEffect, useRef } from "react";
import Script from "next/script";
export function BotCheck({ onToken }: { onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null),
    widget = useRef<string | null>(null),
    callback = useRef(onToken);
  callback.current = onToken;
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const render = () => {
    if (key && box.current && window.turnstile && !widget.current)
      widget.current = window.turnstile.render(box.current, {
        sitekey: key,
        theme: "dark",
        size: "flexible",
        callback: (v: string) => callback.current(v),
        "expired-callback": () => callback.current(""),
        "error-callback": () => callback.current(""),
      });
  };
  useEffect(() => {
    render();
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);
  return key ? (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={render}
      />
      <div ref={box} />
    </>
  ) : (
    <p className="notice">
      O envio de sugestões está temporariamente indisponível.
    </p>
  );
}

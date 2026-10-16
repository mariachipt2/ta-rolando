"use client";
import { useEffect, useState } from "react";
type InstallEvent = Event & { prompt: () => Promise<void> };
export function Pwa() {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    const handler = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  return install ? (
    <button
      className="install"
      onClick={async () => {
        await install.prompt();
        setInstall(null);
      }}
    >
      ＋ Instalar Tá Rolando
    </button>
  ) : null;
}

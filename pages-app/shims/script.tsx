import { useEffect } from "react";
export default function Script({
  src,
  onReady,
}: {
  src: string;
  onReady?: () => void;
}) {
  useEffect(() => {
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (script?.dataset.loaded) {
      onReady?.();
      return;
    }
    if (!script) {
      script = document.createElement("script");
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    }
    const ready = () => {
      script!.dataset.loaded = "true";
      onReady?.();
    };
    script.addEventListener("load", ready);
    return () => script?.removeEventListener("load", ready);
  }, [src]);
  return null;
}

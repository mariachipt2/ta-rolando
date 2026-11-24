import { automatedTraffic } from "../../supabase/functions/_shared/traffic";
const preferenceKey = "tr_exclude_analytics";
export function excludeThisBrowser() {
  try {
    return localStorage.getItem(preferenceKey) === "1";
  } catch {
    return false;
  }
}
export function setExcludeThisBrowser(value: boolean) {
  try {
    if (value) localStorage.setItem(preferenceKey, "1");
    else localStorage.removeItem(preferenceKey);
    return true;
  } catch {
    return false;
  }
}
export function ignoreBrowserTraffic() {
  if (typeof window === "undefined") return true;
  // Parametro explicito para verificacoes; nao muda as paginas nem o cadastro.
  const urls = [
    location.search,
    location.hash.includes("?")
      ? location.hash.slice(location.hash.indexOf("?"))
      : "",
  ];
  return (
    navigator.webdriver === true ||
    automatedTraffic(navigator.userAgent) ||
    excludeThisBrowser() ||
    urls.some(
      (query) => new URLSearchParams(query).get("trafego") === "interno",
    )
  );
}

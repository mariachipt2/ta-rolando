/** Filtro conservador: nao identifica automacoes que ocultam a propria identidade. */
export function automatedTraffic(userAgent: string | null) {
  return (
    !userAgent?.trim() ||
    /bot\b|crawler|spider|headless|facebookexternalhit|facebot|whatsapp|telegram|slack|discord|bingpreview|chatgpt-user|claude-user|anthropic|openai|googleother|lighthouse|pagespeed|pingdom|uptimerobot|uptime-kuma|healthcheck|curl\/|wget\/|python-requests|python-httpx|aiohttp|go-http-client|node(?:\.js)?\b|undici|postmanruntime|playwright|puppeteer|selenium/i.test(
      userAgent,
    )
  );
}
export function internalTraffic(headers: Headers) {
  return (
    headers.get("x-ta-rolando-traffic") === "internal" ||
    automatedTraffic(headers.get("user-agent"))
  );
}

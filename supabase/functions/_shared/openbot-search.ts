import {
  DISCOVERY_SOURCES,
  discoverySource,
  https,
  isDiscoveryUrl,
  plain,
  type DiscoveredEvent,
  type DiscoveryResult,
} from "./discovery.ts";
export function searchResult(
  value: unknown,
  sourceValue: unknown,
  now = new Date(),
): DiscoveryResult {
  const source = discoverySource(sourceValue),
    v = value as { items?: unknown; warnings?: unknown };
  if (!v || !Array.isArray(v.items) || v.items.length > 100)
    throw Error("Envie ate 100 resultados da busca.");
  const items: DiscoveredEvent[] = [],
    seen = new Set<string>();
  for (const raw of v.items) {
    if (!raw || typeof raw !== "object") throw Error("Resultado invalido.");
    const r = raw as Record<string, unknown>,
      text = (key: string, max = 300) => plain(r[key]).slice(0, max);
    const starts = text("starts_at", 50),
      stamp = Date.parse(starts);
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/.test(starts) ||
      !Number.isFinite(stamp)
    )
      throw Error(
        "Data e horario precisam de confirmacao antes de entrar nos resultados.",
      );
    const source_url = https(r.source_url),
      title = text("title", 160),
      city = text("city", 120);
    if (
      !isDiscoveryUrl(source_url, source) ||
      !title ||
      city
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() !== "ipatinga"
    )
      throw Error("Evento fora da fonte ou cidade selecionada.");
    if (stamp < now.getTime()) continue;
    const key = source_url + "|" + new Date(stamp).toISOString();
    if (seen.has(key)) continue;
    seen.add(key);
    const end = text("ends_at", 50),
      is_free = typeof r.is_free === "boolean" ? r.is_free : null;
    const item: DiscoveredEvent = {
      source,
      source_url,
      title,
      starts_at: new Date(stamp).toISOString(),
      ends_at:
        end && Number.isFinite(Date.parse(end)) && Date.parse(end) > stamp
          ? new Date(end).toISOString()
          : null,
      venue_name: text("venue_name", 160),
      address: text("address"),
      neighborhood: text("neighborhood", 120),
      city: "Ipatinga",
      state: "MG",
      organizer: text("organizer", 160),
      ticket_url: https(r.ticket_url),
      is_free,
      price: text("price", 150),
      age_rating: text("age_rating", 40),
      image_url: https(r.image_url),
      missing: [],
    };
    item.missing = [
      ...(!item.venue_name ? ["Local"] : []),
      ...(!item.address ? ["Endereço"] : []),
      ...(!item.neighborhood ? ["Bairro"] : []),
      ...(!item.image_url ? ["Cartaz"] : []),
      ...(is_free === null ? ["Pago ou gratuito"] : []),
      "Categoria",
      "Conferir dados e cartaz antes de publicar",
    ];
    items.push(item);
  }
  return {
    items: items.sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    searched_at: now.toISOString(),
    source: DISCOVERY_SOURCES[source].url,
    source_id: source,
    source_label: DISCOVERY_SOURCES[source].label,
    coverage:
      "Coleta do OpenBot. Resultados para revisão; nenhum evento foi criado ou publicado.",
    warnings: Array.isArray(v.warnings)
      ? v.warnings.slice(0, 20).map((w) => plain(w).slice(0, 500))
      : [],
  };
}
export function publicSearchJob(job: Record<string, unknown> | null) {
  if (!job) return null;
  const {
    id,
    source,
    status,
    requested_at,
    started_at,
    finished_at,
    heartbeat_at,
    result,
    error,
  } = job;
  return {
    id,
    source,
    status,
    requested_at,
    started_at,
    finished_at,
    heartbeat_at,
    result,
    error,
  };
}

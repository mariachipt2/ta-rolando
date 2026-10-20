export type SubmissionData = {
  title: string;
  description: string;
  category_id: string;
  starts_at: string;
  ends_at: string | null;
  venue_name: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  organizer: string;
  instagram_url: string;
  is_free: boolean;
  price: string;
  ticket_url: string;
  age_rating: string;
  additional_info: string;
};
export function validateSubmission(
  input: unknown,
  now = Date.now(),
): SubmissionData {
  if (!input || typeof input !== "object")
    throw Error("Preencha os dados do evento.");
  const v = input as Record<string, unknown>;
  const labels:Record<string,string>={title:'nome do evento',description:'descrição',category_id:'categoria',starts_at:'início',ends_at:'encerramento',venue_name:'local',address:'endereço',neighborhood:'bairro',organizer:'organizador',price:'preço',ticket_url:'ingressos',instagram_url:'Instagram',age_rating:'classificação indicativa',additional_info:'informações adicionais'};
  const text = (key: string, min: number, max: number) => {
    const value = typeof v[key] === "string" ? (v[key] as string).trim() : "";
    if (value.length < min || value.length > max)
      throw Error(`Revise o campo ${labels[key]||key}.`);
    return value;
  };
  const title = text("title", 3, 160),
    description = text("description", 10, 10000),
    category_id = text("category_id", 36, 36);
  if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(category_id))
    throw Error("Escolha uma categoria.");
  const starts_at = text("starts_at", 10, 40);
  const start = Date.parse(starts_at);
  if (
    !Number.isFinite(start) ||
    start <= now ||
    !/(Z|[+-]\d\d:\d\d)$/.test(starts_at)
  )
    throw Error("Informe uma data futura válida.");
  const ends_at = v.ends_at ? text("ends_at", 10, 40) : null;
  if (
    ends_at &&
    (!Number.isFinite(Date.parse(ends_at)) ||
      Date.parse(ends_at) <= start ||
      !/(Z|[+-]\d\d:\d\d)$/.test(ends_at))
  )
    throw Error("O encerramento deve ser depois do início.");
  const ticket_url = text("ticket_url", 0, 2048),
    instagram = text("instagram_url", 0, 2048);
  if (ticket_url) {
    try {
      const u = new URL(ticket_url);
      if (u.protocol !== "https:" || u.username || u.password) throw Error();
    } catch {
      throw Error("Use um link HTTPS válido para os ingressos.");
    }
  }
  let instagram_url = "";
  if (instagram) {
    try {
      const u = new URL(instagram);
      const m = u.pathname.match(/^\/([A-Za-z0-9._]{1,30})\/?$/);
      if (
        u.protocol !== "https:" ||
        !["instagram.com", "www.instagram.com"].includes(u.hostname) ||
        u.port ||
        u.username ||
        u.password ||
        !m ||
        [
          "p",
          "reel",
          "reels",
          "stories",
          "explore",
          "accounts",
          "direct",
          "share",
        ].includes(m[1].toLowerCase())
      )
        throw Error();
      instagram_url = `https://www.instagram.com/${m[1]}/`;
    } catch {
      throw Error("Informe o link do perfil do Instagram.");
    }
  }
  if (typeof v.is_free !== "boolean")
    throw Error("Informe se o evento é gratuito.");
  return {
    title,
    description,
    category_id,
    starts_at: new Date(start).toISOString(),
    ends_at: ends_at ? new Date(ends_at).toISOString() : null,
    venue_name: text("venue_name", 2, 160),
    address: text("address", 3, 300),
    neighborhood: text("neighborhood", 0, 100),
    city: "Ipatinga",
    state: "MG",
    organizer: text("organizer", 0, 160),
    instagram_url,
    is_free: v.is_free,
    price: text("price", 0, 100),
    ticket_url,
    age_rating: text("age_rating", 0, 40) || "Livre",
    additional_info: text("additional_info", 0, 3000),
  };
}

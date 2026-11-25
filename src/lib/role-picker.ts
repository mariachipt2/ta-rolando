import type { Category, Event } from "./types";
import { agendaSelection } from "./daily-agenda";
import { inPeriod } from "./dates";
import { forChildren, isNightlifeCategory } from "./event-discovery";
export type PickerAnswers = {
  when: "today" | "tomorrow" | "weekend" | "week" | "all";
  budget: "free" | "30" | "60" | "any";
  vibe: "any" | "music" | "nightlife" | "culture" | "family" | "faith";
};
export const pickerDefaults: PickerAnswers = {
  when: "week",
  budget: "any",
  vibe: "any",
};
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
/** Only an unqualified entry price/range is usable as a spending ceiling. */
export function confirmedPriceCeiling(
  event: Pick<Event, "is_free" | "price">,
): number | null {
  if (event.is_free) return 0;
  const price = normalize(event.price || "")
    .trim()
    .replace(/[–—]/g, "-");
  const amount = "(?:\\d{1,3}(?:\\.\\d{3})+(?:,\\d{2})?|\\d+(?:[.,]\\d{2})?)";
  const match = price.match(
    new RegExp(
      "^(?:de\\s+)?(?:r\\$\\s*)?(" +
        amount +
        ")(?:\\s*(?:a|ate|-)\\s*(?:r\\$\\s*)?(" +
        amount +
        "))?(?:\\s*(?:por pessoa|/pessoa))?$",
    ),
  );
  if (!match) return null;
  const values = match
    .slice(1)
    .filter(Boolean)
    .map((value) =>
      Number(
        value.includes(",")
          ? value.replaceAll(".", "").replace(",", ".")
          : /\.\d{3}(?:\.|$)/.test(value)
            ? value.replaceAll(".", "")
            : value,
      ),
    );
  return values.every((n) => Number.isFinite(n) && n > 0)
    ? Math.max(...values)
    : null;
}
export function pickEvents(
  events: Event[],
  answers: PickerAnswers,
  now: Date,
  categories: Category[] = [],
) {
  const available = agendaSelection(
    events.map((e) => ({
      ...e,
      categories:
        e.categories || categories.find((c) => c.id === e.category_id),
    })),
    "",
    now,
    "all",
  ).events;
  return available
    .filter((e) => {
      if (
        answers.when !== "all" &&
        !inPeriod(e.starts_at, e.ends_at, answers.when, now)
      )
        return false;
      if (answers.budget === "free" && !e.is_free) return false;
      if (answers.budget === "30" || answers.budget === "60") {
        const ceiling = confirmedPriceCeiling(e);
        if (ceiling === null || ceiling > Number(answers.budget)) return false;
      }
      const name = normalize(e.categories?.name || ""),
        icon = e.categories?.icon;
      switch (answers.vibe) {
        case "family":
          return forChildren(e);
        case "nightlife":
          return !!e.nightlife_venue || isNightlifeCategory(e.categories);
        case "music":
          return icon === "Music" || /shows|musica/.test(name);
        case "culture":
          return (
            ["Theater", "Clapperboard", "Film"].includes(icon || "") ||
            /cultura|teatro|cinema/.test(name)
          );
        case "faith":
          return /religio/.test(name);
        default:
          return true;
      }
    })
    .slice(0, 3)
    .map((event) => ({
      event,
      reasons: [
        answers.when === "today"
          ? "Na agenda de hoje"
          : answers.when === "tomorrow"
            ? "Na agenda de amanhã"
            : answers.when === "weekend"
              ? "Neste fim de semana"
              : answers.when === "week"
                ? "Nos próximos 7 dias"
                : "Uma próxima data da agenda",
        event.is_free
          ? "Entrada gratuita"
          : answers.budget === "30" || answers.budget === "60"
            ? `Faixa de entrada divulgada até R$ ${answers.budget}`
            : "Confira a entrada nos detalhes",
        ...(answers.vibe === "family"
          ? ["Cadastrado como adequado para crianças"]
          : []),
      ],
    }));
}

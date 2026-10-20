import { formatInTimeZone } from "date-fns-tz";
export function savedTime(value: string) {
  return formatInTimeZone(
    value,
    "America/Sao_Paulo",
    "dd/MM/yyyy 'às' HH:mm:ss",
  );
}
export function SaveConfirmation({
  at,
  dirty = false,
  busy = false,
}: {
  at?: string | null;
  dirty?: boolean;
  busy?: boolean;
}) {
  return (
    <div
      className={"save-confirmation " + (dirty ? "unsaved" : "")}
      role="status"
    >
      <strong>
        {busy
          ? "Salvando no Supabase…"
          : dirty
            ? "Há alterações ainda não salvas."
            : at
              ? "Gravação confirmada no Supabase"
              : "Nenhuma gravação confirmada ainda."}
      </strong>
      {at && (
        <span>
          Último salvamento: <time dateTime={at}>{savedTime(at)}</time> ·
          horário de Brasília
        </span>
      )}
    </div>
  );
}

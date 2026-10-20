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
      title="Confirmação e horário retornados pelo Supabase após a gravação"
    >
      <strong>
        {busy
          ? "Salvando…"
          : dirty
            ? "Alterações não salvas"
            : at
              ? "Salvo"
              : "Aguardando primeira gravação"}
      </strong>
      {at && (
        <span>
          <time dateTime={at}>{savedTime(at)}</time> ·
          Brasília
        </span>
      )}
    </div>
  );
}

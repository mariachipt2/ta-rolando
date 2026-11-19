export function normalizeDraftStart(value:string,timeTbd:boolean){
  if(!timeTbd)return value;
  const date=value.includes('T')?new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value)):value;
  return date+'T00:00:00-03:00';
}

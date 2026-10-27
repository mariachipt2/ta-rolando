export function eventCountdown(startsAt:string,now:number){
  const target=Date.parse(startsAt);
  if(!Number.isFinite(target)||!Number.isFinite(now))return null;
  const total=Math.max(0,Math.ceil((target-now)/1000));
  return {days:Math.floor(total/86400),hours:Math.floor(total%86400/3600),minutes:Math.floor(total%3600/60),seconds:total%60,started:target<=now};
}

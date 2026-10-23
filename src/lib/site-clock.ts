// Anchor to the database clock and advance monotonically, independent of device date changes.
export function createSiteClock(wall=()=>Date.now(),elapsed=()=>performance.now()){
 let anchor:{server:number;tick:number}|null=null;
 const listeners=new Set<()=>void>();
 return {
  now:()=>anchor?anchor.server+Math.max(0,elapsed()-anchor.tick):wall(),
  sync:(iso:string)=>{const server=Date.parse(iso);if(!Number.isFinite(server))throw Error('Horário do servidor inválido.');anchor={server,tick:elapsed()};listeners.forEach(fn=>fn())},
  subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}},
 };
}
export const siteClock=createSiteClock();
export const clockNow=()=>siteClock.now();

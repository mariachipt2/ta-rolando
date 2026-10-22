export type DiscoveryStatus='pending'|'added'|'ignored';
export type DiscoveryMark={source_url:string;starts_at:string;status:DiscoveryStatus;updated_at:string};
export function discoveryKey(item:{source_url:string;starts_at:string}) {return item.source_url+'|'+new Date(item.starts_at).toISOString()}
export function discoveryState(item:{source_url:string;starts_at:string},marks:DiscoveryMark[],duplicate:boolean):DiscoveryStatus {
 const mark=marks.find(m=>discoveryKey(m)===discoveryKey(item));
 return mark&&mark.status!=='pending'?mark.status:duplicate?'added':'pending';
}

const reserved = new Set(['p','reel','reels','stories','explore','accounts','direct','about','legal','developer','developers','privacy','terms','share']);
export function instagramProfile(value:string):string|null {
 const text=value.trim();
 if(!text)return '';
 try {
  const url=new URL(text);
  const match=url.pathname.match(/^\/([a-zA-Z0-9._]{1,30})\/?$/);
  if(url.protocol!=='https:'||!['instagram.com','www.instagram.com'].includes(url.hostname)||url.port||url.username||url.password||!match||reserved.has(match[1].toLowerCase()))return null;
  return `https://www.instagram.com/${match[1]}/`;
 }catch{return null;}
}

import type {Event} from './types';
import {displayDate,upcoming} from './dates';
import {clockNow} from './site-clock';

export const STORY_WIDTH=1080,STORY_HEIGHT=1920;
export function storyPages(events:Event[]){
  const seen=new Set<string>();
  const sorted=events.filter(e=>{if(e.deleted_at||seen.has(e.id))return false;seen.add(e.id);return true}).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at));
  if(!sorted.length||sorted.length>20)throw Error('Escolha de 1 a 20 eventos para criar seus Stories.');
  return Array.from({length:Math.ceil(sorted.length/3)},(_,i)=>sorted.slice(i*3,i*3+3));
}
export function storyHome(link:string){const url=new URL(link);url.hash='';url.search='';url.pathname=url.pathname.replace(/\/programacao(?:-compartilhada)?\/?$/,'/');return url.host+url.pathname.replace(/\/$/,'')}
function write(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,width:number,size:number,maxLines:number,color='#f7f5ff',weight=600){
  ctx.font=`${weight} ${size}px Arial, sans-serif`;
  const rows:string[]=[];let line='';
  for(const word of value.replace(/\s+/g,' ').trim().split(' ')){
    if(line&&ctx.measureText(line+' '+word).width>width){rows.push(line);line=''}
    for(const char of (line?' ':'')+word){if(ctx.measureText(line+char).width>width&&line){rows.push(line);line=''}line+=char}
  }
  if(line)rows.push(line);
  if(rows.length>maxLines){let last=rows[maxLines-1];while(last&&ctx.measureText(last+'…').width>width)last=last.slice(0,-1);rows[maxLines-1]=last+'…'}
  ctx.fillStyle=color;rows.slice(0,maxLines).forEach((row,i)=>ctx.fillText(row,x,y+i*size*1.23));
}
function image(url:string):Promise<HTMLImageElement|null>{return new Promise(resolve=>{
  const img=new Image();let done=false;
  const finish=(value:HTMLImageElement|null)=>{if(done)return;done=true;clearTimeout(timer);resolve(value)};
  const timer=setTimeout(()=>{finish(null);img.src=''},8000);
  img.crossOrigin='anonymous';img.onload=()=>finish(img);img.onerror=()=>finish(null);img.src=url;
})}
function box(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill()}

export async function createProgramStory(events:Event[],title:string,link:string,page:number,total:number){
  if(!events.length||events.length>3)throw Error('Cada Story deve conter de 1 a 3 eventos.');
  const canvas=document.createElement('canvas');canvas.width=STORY_WIDTH;canvas.height=STORY_HEIGHT;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Seu navegador não conseguiu criar a imagem.');
  const gradient=ctx.createLinearGradient(0,0,1080,1920);gradient.addColorStop(0,'#25133b');gradient.addColorStop(.48,'#11101d');gradient.addColorStop(1,'#070e17');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1920);
  ctx.strokeStyle='#b3ff4a';ctx.lineWidth=5;
  for(const r of [14,27,40]){ctx.beginPath();ctx.arc(87,175,r,-.85,.85);ctx.stroke();ctx.beginPath();ctx.arc(87,175,r,Math.PI-.85,Math.PI+.85);ctx.stroke()}
  ctx.beginPath();ctx.arc(87,175,5,0,Math.PI*2);ctx.fillStyle='#b3ff4a';ctx.fill();
  write(ctx,'tá rolando',150,193,650,54,1,'#ffffff',800);
  write(ctx,`${page+1} / ${total}`,855,186,155,24,1,'#c8b6df');
  write(ctx,(title.trim()||'Meus rolês').slice(0,80),72,310,936,65,2,'#ffffff',800);
  write(ctx,'ME ENCONTRA NESSES ROLÊS',72,441,936,22,1,'#b3ff4a',700);
  const photos=await Promise.all(events.map(e=>{const url=e.cover_url||e.gallery?.[0];return url?image(url):Promise.resolve(null)}));
  let missingPhotos=0;const now=new Date(clockNow());
  events.forEach((e,i)=>{
    const solo=events.length===1,cardHeight=solo?936:events.length===2?464:308,y=486+i*(cardHeight+26);
    const photoX=solo?102:92,photoW=solo?876:events.length===2?280:222,photoH=solo?470:cardHeight-40;
    const textX=solo?102:events.length===2?400:340,textWidth=solo?876:events.length===2?578:638;
    box(ctx,72,y,936,cardHeight,24,'#211d30');
    box(ctx,photoX,y+20,photoW,photoH,15,'#34274c');
    const photo=photos[i];
    if(photo){const scale=Math.min(photoW/photo.naturalWidth,photoH/photo.naturalHeight),w=photo.naturalWidth*scale,h=photo.naturalHeight*scale;ctx.save();ctx.beginPath();ctx.roundRect(photoX,y+20,photoW,photoH,15);ctx.clip();ctx.drawImage(photo,photoX+(photoW-w)/2,y+20+(photoH-h)/2,w,h);ctx.restore()}
    else{missingPhotos++;write(ctx,'TÁ',photoX+23,y+photoH/2,photoW-45,54,1,'#b3ff4a',800);write(ctx,'ROLANDO',photoX+20,y+photoH/2+41,photoW-40,27,1,'#ffffff',800)}
    const badge=e.status==='cancelled'?'CANCELADO':!upcoming(e,now)?'ENCERRADO':e.change_notice?'EVENTO ALTERADO':e.categories?.name||'NA MINHA PROGRAMAÇÃO';
    write(ctx,badge.toLocaleUpperCase('pt-BR'),textX,y+(solo?530:42),textWidth,17,1,e.status==='cancelled'?'#ffa89f':'#b3ff4a',700);
    write(ctx,e.title,textX,y+(solo?580:88),textWidth,solo?42:32,3,'#ffffff',800);
    write(ctx,displayDate(e.starts_at),textX,y+(solo?800:cardHeight-87),textWidth,26,1,'#d6c6f5',700);
    write(ctx,[e.venue_name,e.neighborhood||e.city].filter(Boolean).join(' · '),textX,y+(solo?850:cardHeight-47),textWidth,23,2,'#c9c4d7',400);
  });
  const footerY=1510;
  ctx.fillStyle='#b3ff4a';ctx.fillRect(72,footerY,936,2);
  write(ctx,'BORA COMIGO?',72,footerY+66,530,35,1,'#b3ff4a',800);
  write(ctx,'Veja os rolês e monte a sua programação.',72,footerY+117,530,27,3,'#ffffff',600);
  write(ctx,storyHome(link),72,footerY+242,530,25,2,'#c9c4d7',600);
  write(ctx,'Horários de Brasília · Confira atualizações no site',72,1857,936,19,1,'#c9c4d7',400);
  const QRCode=await import('qrcode'),qr=document.createElement('canvas');
  await QRCode.toCanvas(qr,link,{width:330,margin:5,errorCorrectionLevel:'L',color:{dark:'#0b0b12',light:'#ffffff'}});
  ctx.drawImage(qr,678,footerY+24,330,330);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Não foi possível salvar a imagem.')),'image/png'));
  canvas.width=0;canvas.height=0;
  return {blob,missingPhotos};
}

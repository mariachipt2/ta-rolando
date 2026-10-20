import type {Event} from './types';
import {displayDate} from './dates';
import {slugify} from './validation';
export const posterFilename=(e:Event)=>'ta-rolando-'+(slugify(e.title).slice(0,70)||'evento')+'.png';
export function posterText(e:Event,url:string){return `${e.status==='cancelled'?'CANCELADO · ':''}${e.title}\n${displayDate(e.starts_at)} · Brasília\n${e.venue_name} — ${e.city}/${e.state}\n${url}`}
function lines(ctx:CanvasRenderingContext2D,text:string,width:number){const result:string[]=[];let line='';for(const word of text.replace(/\s+/g,' ').trim().split(' ')){if(ctx.measureText(line+(line?' ':'')+word).width>width&&line){result.push(line);line=''}if(ctx.measureText(word).width>width){for(const char of word){if(ctx.measureText(line+char).width>width){result.push(line);line=''}line+=char}}else line+=(line?' ':'')+word}if(line)result.push(line);return result}
function text(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,width:number,size:number,maxLines:number,color='#f8f7ff',weight=600){let rows:string[];do{ctx.font=`${weight} ${size}px Arial, sans-serif`;rows=lines(ctx,value,width);if(rows.length<=maxLines||size<=18)break;size-=2}while(size>16);ctx.fillStyle=color;rows.slice(0,maxLines).forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.2));}
function loadImage(url:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const image=new Image();const timer=setTimeout(()=>{image.src='';reject(Error('Foto indisponível'))},12000);image.crossOrigin='anonymous';image.onload=()=>{clearTimeout(timer);resolve(image)};image.onerror=()=>{clearTimeout(timer);reject(Error('Foto indisponível'))};image.src=url})}
export async function createEventPoster(e:Event,url:string){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1560;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Este navegador não conseguiu gerar o cartaz.');
 ctx.fillStyle='#0b0b12';ctx.fillRect(0,0,1080,1560);const gradient=ctx.createLinearGradient(0,0,1080,600);gradient.addColorStop(0,'#31204f');gradient.addColorStop(1,'#12101d');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1030);
 text(ctx,'tá rolando',72,92,650,46,1,'#b3ff4a',800);text(ctx,e.status==='cancelled'?'EVENTO CANCELADO':e.change_notice?'INFORMAÇÕES ATUALIZADAS':'VIVA IPATINGA',680,86,328,21,1,e.status==='cancelled'?'#ffaba3':'#d9caf7');
 text(ctx,e.title,72,175,936,58,4,'#ffffff',800);
 const cover=e.cover_url||e.gallery?.[0];let usedPhoto=false;
 if(cover){try{const image=await loadImage(cover);const scale=Math.min(936/image.naturalWidth,600/image.naturalHeight);const w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,72+(936-w)/2,408+(600-h)/2,w,h);usedPhoto=true}catch{/* The event information remains shareable without the original photo. */}}
 if(!usedPhoto){text(ctx,'Seu próximo rolê',110,660,860,72,1,'#b3ff4a',800);text(ctx,'começa aqui.',110,755,860,72,1,'#ffffff',800)}
 text(ctx,displayDate(e.starts_at)+' · Brasília',72,1086,936,36,1,'#b3ff4a',700);text(ctx,e.venue_name,72,1150,936,38,2);text(ctx,[e.address,e.neighborhood,`${e.city}/${e.state}`].filter(Boolean).join(' · '),72,1248,936,27,2,'#c7c3d8',400);
 const QRCode=await import('qrcode');const qr=document.createElement('canvas');await QRCode.toCanvas(qr,url,{width:200,margin:4,errorCorrectionLevel:'M',color:{dark:'#0b0b12',light:'#ffffff'}});ctx.drawImage(qr,808,1320,200,200);text(ctx,'Confira os detalhes e atualizações:',72,1355,690,26,1,'#b3ff4a');text(ctx,url,72,1401,690,23,4,'#ffffff',400);text(ctx,'Aponte a câmera para o QR Code',72,1520,690,21,1,'#a5a2b8',400);
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Não foi possível gerar a imagem.')),'image/png'));return {blob,usedPhoto};
}

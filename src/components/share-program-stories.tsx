"use client";
import {useEffect,useRef,useState} from 'react';
import {Download,Share2,Copy} from 'lucide-react';
import {InstagramIcon} from './instagram-icon';
import type {Event} from '@/lib/types';
import {programLink} from '@/lib/event-selection';
type Story={url:string;file:File;missingPhotos:number};
export function ShareProgramStories({events,title,disabled=false}:{events:Event[];title:string;disabled?:boolean}){
  const [stories,setStories]=useState<Story[]>([]),[busy,setBusy]=useState(false),[open,setOpen]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[link,setLink]=useState(''),[progress,setProgress]=useState(''),[sharing,setSharing]=useState(false);
  const mounted=useRef(true),urls=useRef<string[]>([]),finished=useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;urls.current.forEach(url=>URL.revokeObjectURL(url))}},[]);
  async function generate(){
    if(finished.current){setOpen(v=>!v);return}
    urls.current.forEach(url=>URL.revokeObjectURL(url));urls.current=[];setStories([]);
    setBusy(true);setOpen(true);setError('');setMessage('');
    try{
      const shared=programLink(location.href,events.map(e=>e.id),title);setLink(shared);
      const {storyPages,createProgramStory}=await import('@/lib/program-story');
      const pages=storyPages(events);
      for(let i=0;i<pages.length;i++){
        if(!mounted.current)return;
        setProgress(`Criando Story ${i+1} de ${pages.length}…`);
        const result=await createProgramStory(pages[i],title,shared,i,pages.length);
        if(!mounted.current)return;
        const url=URL.createObjectURL(result.blob);urls.current.push(url);
        const story={url,file:new File([result.blob],`ta-rolando-meus-roles-${i+1}.png`,{type:'image/png'}),missingPhotos:result.missingPhotos};
        setStories(old=>[...old,story]);
      }
      finished.current=true;
    }catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Não foi possível criar os Stories.')}
    finally{if(mounted.current){setBusy(false);setProgress('')}}
  }
  return <section className="program-stories"><button type="button" className="button secondary" disabled={disabled||!events.length||busy||sharing} aria-expanded={open} onClick={generate}><InstagramIcon/>{busy?'Criando seus Stories…':error&&!finished.current?'Tentar criar Stories novamente':open?'Fechar Stories':'Criar Stories para Instagram'}</button>
    {open&&<div className="program-stories-content"><h3>Seus rolês viraram Stories</h3><p>Até 3 eventos por imagem, no formato 1080 × 1920. Baixe e publique no Instagram; use a figurinha de link para levar as pessoas à sua programação completa.</p><p className="muted">O QR code aponta para a seleção completa. A imagem é uma cópia das informações de agora; o link mostra as atualizações dos eventos.</p>
      {busy&&<p role="status">{progress||'Preparando imagens…'}</p>}
      {error&&<p role="alert" className="error-text">{error}</p>}
      {stories.length>0&&<><label>Link para colar na figurinha do Instagram<input readOnly value={link} onFocus={e=>e.target.select()}/></label><button type="button" className="button secondary" onClick={async()=>{try{await navigator.clipboard.writeText(link);setMessage('Link copiado! Cole na figurinha de link do Story.')}catch{setMessage('Selecione e copie o link no campo acima.')}}}><Copy size={17}/>Copiar link da programação</button></>}
      <div className="program-story-grid">{stories.map((story,i)=><article className="program-story-item" key={story.url}><h4>Story {i+1}</h4><img src={story.url} alt={`Story ${i+1} de ${title.trim()||'Meus rolês'}, com eventos, datas, locais e QR code`}/>{story.missingPhotos>0&&<p className="muted">{story.missingPhotos===1?'Um cartaz não estava disponível.':'Alguns cartazes não estavam disponíveis.'} As informações dos eventos foram mantidas.</p>}<div className="share-buttons"><a className="button lime-button" href={story.url} download={story.file.name}><Download size={17}/>Baixar Story {i+1}</a><button type="button" className="button secondary" disabled={sharing||busy} onClick={async()=>{setMessage('');setError('');setSharing(true);try{if(!navigator.share||!navigator.canShare?.({files:[story.file]})){setMessage('Baixe a imagem e publique no Instagram. Este navegador não oferece compartilhamento de arquivos.');return}await navigator.share({files:[story.file],title:title.trim()||'Meus rolês'});setMessage('Menu de compartilhamento aberto. Escolha o aplicativo disponível para concluir.')}catch(e){if(!(e instanceof DOMException&&e.name==='AbortError'))setError('Não foi possível compartilhar. Você ainda pode baixar a imagem.')}finally{if(mounted.current)setSharing(false)}}}><Share2 size={17}/>Compartilhar imagem</button></div></article>)}</div>
      {message&&<p role="status">{message}</p>}
    </div>}
  </section>;
}

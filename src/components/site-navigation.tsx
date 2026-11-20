"use client";
import {useEffect,useId,useRef,useState} from 'react';
import Link from 'next/link';
import {Compass,ChevronDown,CalendarDays,CalendarRange,GitCompareArrows,Users,Menu,X,Sparkles} from 'lucide-react';
export function SiteNavigation({path='/' }:{path?:string}) {
 const [open,setOpen]=useState<'explore'|null>(null),[mobile,setMobile]=useState(false);
 const root=useRef<HTMLDivElement>(null),lastTrigger=useRef<HTMLButtonElement|null>(null),id=useId();
 useEffect(()=>{const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node)){setOpen(null);setMobile(false)}};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(null);setMobile(false);lastTrigger.current?.focus()}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)}},[]);
 const close=()=>{setOpen(null);setMobile(false)};
 const exploreActive=(['/linha-do-tempo','/organizadores','/artistas'].includes(path)||path.startsWith('/artista/'));
 return <div className="navigation-shell" ref={root} onBlur={e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget as Node))close()}}>
 <button className="mobile-nav-toggle" aria-label={mobile?'Fechar menu':'Abrir menu'} aria-expanded={mobile} aria-controls={id+'-nav'} onClick={e=>{lastTrigger.current=e.currentTarget;setMobile(!mobile);setOpen(null)}}>{mobile?<X size={20}/>:<Menu size={20}/>} Menu</button>
 <nav className={'main-menu '+(mobile?'mobile-open':'')} id={id+'-nav'} aria-label="Navegação principal" onClick={e=>{if((e.target as Element).closest('a'))close()}}>
 <div className="nav-group"><button className={'nav-trigger '+(exploreActive?'is-current':'')} aria-expanded={open==='explore'} aria-controls={id+'-explore'} onClick={e=>{lastTrigger.current=e.currentTarget;setOpen(open==='explore'?null:'explore')}}><Compass size={17}/> Explorar <ChevronDown size={14}/></button>
 {open==='explore'&&<div className="nav-dropdown" id={id+'-explore'}><span className="nav-dropdown-label">DESCUBRA IPATINGA</span><Link href="/#explorar"><Compass size={19}/><span>Todos os eventos<small>Encontre seu próximo rolê</small></span></Link><Link href="/linha-do-tempo" aria-current={path==='/linha-do-tempo'?'page':undefined}><CalendarRange size={19}/><span>Calendário de eventos<small>Veja a programação mês a mês</small></span></Link><Link href="/artistas" aria-current={path==='/artistas'?'page':undefined}><Users size={19}/><span>Artistas<small>Onde cantores, bandas e DJs vão tocar</small></span></Link><Link href="/organizadores" aria-current={path==='/organizadores'?'page':undefined}><Users size={19}/><span>Organizadores<small>Acompanhe seus favoritos</small></span></Link></div>}</div>
 <Link className={'nav-top-link '+(path==='/fim-de-semana'?'is-current':'')} href="/fim-de-semana" aria-current={path==='/fim-de-semana'?'page':undefined}><Sparkles size={17}/> Fim de semana</Link>
 <Link className={'nav-top-link '+(path==='/comparar'?'is-current':'')} href="/comparar" aria-current={path==='/comparar'?'page':undefined}><GitCompareArrows size={17}/> Comparar rolês</Link>
 <Link className={'nav-agenda '+(['/agenda','/programacao'].includes(path)?'is-current':'')} href="/agenda" aria-current={['/agenda','/programacao'].includes(path)?'page':undefined}><CalendarDays size={17}/> Minha agenda</Link>
 </nav></div>;
}

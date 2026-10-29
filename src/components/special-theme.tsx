"use client";
import {useEffect,useState,type CSSProperties} from 'react';
import Link from 'next/link';
import {Flower2,Snowflake,MoonStar,TreePine,PartyPopper,ArrowUpRight,CalendarDays,MapPin} from 'lucide-react';
import {request} from '@/lib/transport';
import {useNow} from '@/lib/use-now';
import {themeActive,type ThemeData} from '@/lib/special-theme';
import {ThemeCountdown} from './theme-countdown';
import {displayDate} from '@/lib/dates';

export function IceAtmosphere(){
  return <div className="ice-atmosphere" aria-hidden="true"><div className="ice-frost-frame"/><div className="ice-snowfall">{Array.from({length:24},(_,i)=><span key={i} style={{'--snow-x':`${(i*43+7)%100}%`,'--snow-size':`${2+i%4}px`,'--snow-duration':`${13+i%9}s`,'--snow-delay':`${-i*1.7}s`,'--snow-drift':`${i%2?50:-40}px`} as CSSProperties}/>)}</div></div>;
}

export function HalloweenAtmosphere(){
  return <div className="halloween-atmosphere" aria-hidden="true"><div className="halloween-fog fog-one"/><div className="halloween-fog fog-two"/><div className="halloween-bats">{Array.from({length:5},(_,i)=><span key={i} style={{'--bat-top':`${12+i*13}%`,'--bat-duration':`${23+i*5}s`,'--bat-delay':`${-i*7}s`} as CSSProperties}><svg viewBox="0 0 100 45"><path d="M50 21 42 9 38 17C25 8 13 5 1 2l12 20 10-4 10 11 9-2 8 13 8-13 9 2 10-11 10 4L99 2C87 5 75 8 62 17l-4-8Z"/></svg></span>)}</div></div>;
}

export function SeasonalAtmosphere({theme}:{theme:'christmas'|'newyear'|'muertos'}){
  return <div className={'seasonal-atmosphere '+theme+'-atmosphere'} aria-hidden="true"><div className="seasonal-sparkles">{Array.from({length:18},(_,i)=><span key={i} style={{'--spark-x':`${(i*37+9)%100}%`,'--spark-y':`${(i*19+11)%100}%`,'--spark-delay':`${-i*1.3}s`,'--spark-duration':`${9+i%7}s`} as CSSProperties}/>)}</div>{theme==='newyear'&&<div className="seasonal-fireworks"><i/><i/><i/></div>}</div>;
}

export function ThemeAtmosphere({theme}:{theme:ThemeData['settings']['theme']}){
  return theme==='ice'?<IceAtmosphere/>:theme==='halloween'?<HalloweenAtmosphere/>:<SeasonalAtmosphere theme={theme}/>;
}

export function ThemeBanner({data,now,preview=false}:{data:ThemeData;now:Date;preview?:boolean}){
  const {settings,event}=data;
  if(!event)return null;
  const ice=settings.theme==='ice';
  const halloween=settings.theme==='halloween',christmas=settings.theme==='christmas',muertos=settings.theme==='muertos';
  const seasonal=!ice&&!halloween;
  const Heading=preview?'h2':'h1';
  return <section className={'ice-palace-hero'+(halloween?' halloween-mansion-hero':seasonal?' seasonal-hero '+settings.theme+'-hero':'')} aria-label="Evento em destaque">
    <div className={ice?'ice-palace-glow':halloween?'halloween-lantern-glow':'seasonal-hero-glow'} aria-hidden="true"/>
    <div className="ice-hero-inner shell"><div className="ice-hero-copy">
      <span className="ice-special-label">{ice?<Snowflake size={23}/>:halloween?<MoonStar size={23}/>:christmas?<TreePine size={23}/>:muertos?<Flower2 size={23}/>:<PartyPopper size={23}/>} {ice?'ESPECIAL NO GELO':halloween?'ESPECIAL HALLOWEEN':christmas?'ESPECIAL DE NATAL':muertos?'DÍA DE LOS MUERTOS':'ESPECIAL DE ANO NOVO'}</span>
      <Heading>{ice?<>Um rolê de<br/><span>arrepiar.</span></>:halloween?<>Seu próximo rolê<br/>é de <span>outro mundo.</span></>:christmas?<>A magia está<br/><span>no encontro.</span></>:muertos?<>Uma noite para<br/><span>celebrar a vida.</span></>:<>Novas histórias.<br/><span>Uma nova virada.</span></>}</Heading>
      <p className="ice-hero-subtitle">{ice?`A magia do gelo está chegando a ${event.city||'Ipatinga'}.`:halloween?'A noite mais sombria do ano está chegando.':christmas?'Luzes, risadas e bons momentos para celebrar.':muertos?'Flores, cores e encontros que ficam na memória.':'Um novo ano começa com um encontro inesquecível.'}</p>
      <p className="ice-event-title">{event.title}</p>
      <div className="ice-event-details"><span><CalendarDays size={16}/>{displayDate(event.starts_at)}</span><span><MapPin size={16}/>{event.venue_name}</span></div>
      <div className="ice-hero-actions"><ThemeCountdown event={event}/>
      {preview?<span className="button ice-event-button">Ver evento <ArrowUpRight size={20}/></span>:<Link className="button ice-event-button" href={'/evento/'+event.slug}>Ver evento <ArrowUpRight size={20}/></Link>}
      </div>
    </div></div>
    {ice&&<div className="ice-hero-crystals" aria-hidden="true"><Snowflake/><Snowflake/><Snowflake/></div>}
  </section>;
}

export function SpecialTheme({path}:{path:string}){
  const [data,setData]=useState<ThemeData|null>(null);
  const now=new Date(useNow());
  const hidden=path.startsWith('/admin')||path==='/privacidade';
  useEffect(()=>{
    if(hidden)return;
    let active=true,pending=false;
    const refresh=async()=>{if(pending||document.hidden)return;pending=true;try{const r=await request('/api/special-theme');if(!r.ok)throw Error();const value=await r.json();if(active)setData(value)}catch{if(active)setData(null)}finally{pending=false}};
    const visible=()=>{if(!document.hidden)void refresh()};
    void refresh();const timer=setInterval(refresh,60000);
    window.addEventListener('focus',visible);window.addEventListener('tr:theme-refresh',visible);document.addEventListener('visibilitychange',visible);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',visible);window.removeEventListener('tr:theme-refresh',visible);document.removeEventListener('visibilitychange',visible)};
  },[hidden]);
  const active=!hidden&&!!data&&themeActive(data.settings,data.event,now);
  const theme=active?data!.settings.theme:'',motion=active?data!.settings.motion:'';
  useEffect(()=>{
    const root=document.documentElement;
    if(theme){root.dataset.specialTheme=theme;root.dataset.themeMotion=motion}
    else{delete root.dataset.specialTheme;delete root.dataset.themeMotion}
    return()=>{delete root.dataset.specialTheme;delete root.dataset.themeMotion};
  },[theme,motion]);
  return active&&data?<><ThemeAtmosphere theme={data.settings.theme}/>{path==='/'&&<ThemeBanner data={data} now={now}/>}</>:null;
}

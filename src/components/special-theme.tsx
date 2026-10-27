"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Snowflake,MoonStar,ArrowUpRight} from 'lucide-react';
import {request} from '@/lib/transport';
import {useNow} from '@/lib/use-now';
import {themeActive,themeCountdown,type ThemeData} from '@/lib/special-theme';
import {displayDate} from '@/lib/dates';

export function ThemeBanner({data,now,preview=false}:{data:ThemeData;now:Date;preview?:boolean}){
  const {settings,event}=data;
  if(!event)return null;
  const ice=settings.theme==='ice';
  return <section className="special-theme-banner shell" aria-label="Evento em destaque">
    <div className="special-theme-copy"><span className="eyebrow">{ice?<Snowflake size={17}/>:<MoonStar size={17}/>} {ice?'CLIMA DE GELO':'ESPECIAL HALLOWEEN'}</span>
      <h2>{ice?'Um rolê de arrepiar.':'Seu próximo rolê é de outro mundo.'}</h2>
      <p className="special-theme-title">{event.title}</p>
      <p>{displayDate(event.starts_at)} · {event.venue_name}</p>
      <span className="theme-countdown">{themeCountdown(event,now)}</span>
      {preview?<span className="button lime-button">Ver evento <ArrowUpRight size={17}/></span>:<Link className="button lime-button" href={'/evento/'+event.slug}>Ver evento <ArrowUpRight size={17}/></Link>}
    </div>
    <div className="special-theme-art" aria-hidden="true">
      {event.cover_url?<img src={event.cover_url} alt=""/>:ice?<Snowflake/>:<MoonStar/>}
      <span className="theme-spark spark-one">{ice?'❄':'✦'}</span><span className="theme-spark spark-two">{ice?'❄':'✦'}</span><span className="theme-spark spark-three">{ice?'✧':'☾'}</span>
    </div>
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
  return active&&data&&path==='/'?<ThemeBanner data={data} now={now}/>:null;
}

"use client";
import {useId,useState} from 'react';
import {CalendarDays,FilePenLine,Search,ClipboardCheck,Inbox,Flag,Tags,MapPin,Sparkles,ChartNoAxesCombined,Download,Trash2,ChevronDown,PanelLeft,type LucideIcon} from 'lucide-react';

const groups:{label:string;items:{key:string;label:string;icon:LucideIcon}[]}[]=[
  {label:'Agenda',items:[{key:'events',label:'Eventos',icon:CalendarDays},{key:'drafts',label:'Rascunhos',icon:FilePenLine},{key:'discovery',label:'Buscar eventos',icon:Search}]},
  {label:'Revisão',items:[{key:'pending',label:'Pendências',icon:ClipboardCheck},{key:'submissions',label:'Sugestões',icon:Inbox},{key:'reports',label:'Problemas',icon:Flag}]},
  {label:'Cadastros e aparência',items:[{key:'categories',label:'Categorias',icon:Tags},{key:'venues',label:'Bares e boates',icon:MapPin},{key:'theme',label:'Tema especial',icon:Sparkles}]},
  {label:'Gestão',items:[{key:'stats',label:'Estatísticas',icon:ChartNoAxesCombined},{key:'export',label:'Exportar cadastros',icon:Download},{key:'trash',label:'Lixeira',icon:Trash2}]},
];
export function AdminNavigation({selected,counts,onSelect}:{selected:string;counts:Record<string,number>;onSelect:(key:string)=>boolean}){
  const [open,setOpen]=useState(false),id=useId();
  const current=groups.flatMap(g=>g.items).find(item=>item.key===selected);
  return <aside className="admin-sidebar">
    <button className="admin-menu-toggle" type="button" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(v=>!v)}><PanelLeft size={19}/><span>Menu do administrador<strong>{current?.label||'Eventos'}</strong></span><ChevronDown size={18}/></button>
    <nav id={id} className={'admin-navigation'+(open?' is-open':'')} aria-label="Seções do administrador">
      <div className="admin-nav-title"><PanelLeft size={17}/> SEU PAINEL</div>
      {groups.map(group=><div className="admin-nav-group" key={group.label}><h2>{group.label}</h2><ul>{group.items.map(({key,label,icon:Icon})=><li key={key}><button type="button" aria-current={selected===key?'page':undefined} className={'admin-nav-item'+(selected===key?' is-active':'')} onClick={()=>{if(onSelect(key))setOpen(false)}}><Icon size={18}/><span>{label}</span>{counts[key]!==undefined&&<span className={'admin-nav-count'+(counts[key]>0&&['pending','submissions','reports'].includes(key)?' needs-review':'')}>{counts[key]}</span>}</button></li>)}</ul></div>)}
    </nav>
  </aside>;
}

"use client";
import {useEffect,useId,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {CalendarDays,FilePenLine,Search,ClipboardCheck,Inbox,Flag,Tags,MapPin,Users,Sparkles,ChartNoAxesCombined,Download,Trash2,ChevronDown,PanelLeft,SlidersHorizontal,X,ArrowUpRight,type LucideIcon} from 'lucide-react';

const groups:{label:string;icon:LucideIcon;items:{key:string;label:string;description:string;icon:LucideIcon}[]}[]=[
 {label:'Agenda',icon:CalendarDays,items:[{key:'events',label:'Eventos',description:'Organize os próximos rolês e acompanhe as publicações.',icon:CalendarDays},{key:'drafts',label:'Rascunhos',description:'Continue os cadastros que ainda não foram publicados.',icon:FilePenLine},{key:'discovery',label:'Buscar eventos',description:'Encontre novidades para completar a agenda da cidade.',icon:Search}]},
 {label:'Revisão',icon:ClipboardCheck,items:[{key:'pending',label:'Pendências',description:'Confira o que precisa de atenção antes de publicar.',icon:ClipboardCheck},{key:'submissions',label:'Sugestões',description:'Analise os eventos enviados pela comunidade.',icon:Inbox},{key:'reports',label:'Problemas',description:'Acompanhe os problemas informados pelos visitantes.',icon:Flag}]},
 {label:'Cadastros',icon:Users,items:[{key:'categories',label:'Categorias',description:'Organize os tipos de rolê disponíveis na agenda.',icon:Tags},{key:'artists',label:'Artistas',description:'Gerencie artistas e suas participações nos eventos.',icon:Users},{key:'organizers',label:'Organizadores',description:'Mantenha os contatos e dados dos organizadores em dia.',icon:Users},{key:'venues',label:'Locais',description:'Endereços, bairros e ambientes prontos para o cadastro.',icon:MapPin}]},
 {label:'Aparência',icon:Sparkles,items:[{key:'theme',label:'Tema especial',description:'Dê uma nova atmosfera ao site com os temas especiais.',icon:Sparkles},{key:'specials',label:'Especiais da agenda',description:'Destaque datas e programações especiais na página inicial.',icon:CalendarDays}]},
 {label:'Gestão',icon:SlidersHorizontal,items:[{key:'stats',label:'Estatísticas',description:'Entenda o interesse do público e o desempenho da agenda.',icon:ChartNoAxesCombined},{key:'export',label:'Exportar cadastros',description:'Baixe uma cópia dos eventos e sugestões.',icon:Download},{key:'trash',label:'Lixeira',description:'Confira e restaure os cadastros removidos.',icon:Trash2}]},
];
export function adminSection(key:string){return groups.flatMap(g=>g.items.map(item=>({...item,group:g.label}))).find(item=>item.key===key)!}
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function AdminNavigation({selected,counts,onSelect}:{selected:string;counts:Record<string,number>;onSelect:(key:string)=>boolean}){
 const [open,setOpen]=useState(false),[search,setSearch]=useState(''),[expanded,setExpanded]=useState<string[]>([adminSection(selected)?.group||'Agenda']),id=useId(),reduced=useReducedMotion();
 const current=adminSection(selected),attention=(counts.pending||0)+(counts.reports||0);
 useEffect(()=>{const group=adminSection(selected)?.group;if(group)setExpanded(value=>value.includes(group)?value:[...value,group])},[selected]);
 function select(key:string){if(onSelect(key)){setOpen(false);setSearch('')}}
 const badge=(key:string)=>counts[key]>0?<span className={'admin-nav-count'+(['pending','submissions','reports'].includes(key)?' needs-review':'')}>{counts[key]}</span>:null;
 return <aside className="admin-sidebar admin-sidebar-modern" onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);setSearch('')}}}>
  <div className="admin-mobile-shortcuts" aria-label="Acessos rápidos do administrador">
   {['events','drafts','pending'].map(key=>{const item=adminSection(key),Icon=item.icon;return <button type="button" key={key} className={selected===key?'is-active':''} aria-current={selected===key?'page':undefined} onClick={()=>select(key)}><Icon size={19}/><span>{item.label}</span>{badge(key)}</button>})}
   <button type="button" className={open||!['events','drafts','pending'].includes(selected)?'is-active':''} aria-label="Mais seções do administrador" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(v=>!v)}>{open?<X size={19}/>:<PanelLeft size={19}/>}<span>{open?'Fechar':'Mais'}</span></button>
  </div>
  <nav id={id} className={'admin-navigation'+(open?' is-open':'')} aria-label="Seções do administrador">
   <div className="admin-nav-brand"><span className="admin-nav-brand-icon"><SlidersHorizontal size={20}/></span><div><strong>Seu espaço</strong><span>Gestão do Tá Rolando</span></div></div>
   <label className="admin-nav-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar seção…" aria-label="Buscar seção do administrador"/>{search&&<button type="button" aria-label="Limpar busca de seção" onClick={()=>setSearch('')}><X size={15}/></button>}</label>
   <div className="admin-nav-groups">{groups.map(group=>{
    const items=group.items.filter(item=>normalize(item.label+' '+group.label).includes(normalize(search.trim())));if(!items.length)return null;
    const isOpen=!!search.trim()||expanded.includes(group.label),Icon=group.icon,active=group.items.some(item=>item.key===selected),groupId=id+'-'+group.label;
    const count=group.label==='Revisão'?attention:group.items.reduce((n,item)=>n+(counts[item.key]||0),0);
    return <div className="admin-nav-group" key={group.label}>
     <button type="button" className={'admin-nav-group-toggle'+(active?' has-selection':'')} aria-expanded={isOpen} aria-controls={groupId} onClick={()=>setExpanded(value=>value.includes(group.label)?value.filter(x=>x!==group.label):[...value,group.label])}><Icon size={17}/><span>{group.label}</span>{count>0&&!isOpen&&<span className="admin-nav-count">{count}</span>}<motion.span className="admin-group-chevron" animate={{rotate:isOpen?180:0}} transition={{duration:reduced?0:.18}}><ChevronDown size={15}/></motion.span></button>
     {isOpen&&<motion.ul id={groupId} initial={reduced?false:{opacity:0,y:-4}} animate={{opacity:1,y:0}} transition={{duration:.16}}>{items.map(({key,label,icon:ItemIcon})=><li key={key}><button type="button" aria-current={selected===key?'page':undefined} className={'admin-nav-item'+(selected===key?' is-active':'')} onClick={()=>select(key)}><ItemIcon size={17}/><span>{label}</span>{badge(key)}</button></li>)}</motion.ul>}
    </div>;
   })}{!groups.some(g=>g.items.some(item=>normalize(item.label+' '+g.label).includes(normalize(search.trim()))))&&<p className="admin-nav-empty">Nenhuma seção encontrada.</p>}</div>
   <button type="button" className="admin-nav-review" onClick={()=>select('pending')}><span className="admin-review-dot"/><span>{attention?`${attention} ${attention===1?'item para revisar':'itens para revisar'}`:'Tudo em dia na revisão'}</span><ArrowUpRight size={16}/></button>
   <div className="admin-mobile-current">Você está em <strong>{current?.label}</strong></div>
  </nav>
 </aside>;
}

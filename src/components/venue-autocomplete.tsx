"use client";
import {useId,useState} from 'react';
import {environmentLabels,venueKey,type Environment,type VenueOption} from '@/lib/venue-directory';
export function EnvironmentPicker({value,onChange,name}:{value:Environment|null;onChange:(v:Environment|null)=>void;name?:string}){
 return <fieldset className="environment-picker"><legend>Ambiente do evento</legend>{name&&<input type="hidden" name={name} value={value||''}/>}
  <div className="environment-options">{Object.entries(environmentLabels).map(([id,label])=><label key={id} className={value===id?'selected':''}><input type="radio" name={(name||'environment')+'-choice'} value={id} checked={value===id} onChange={()=>onChange(id as Environment)}/>{label}</label>)}</div>
  <small>{value?'Você pode ajustar se o evento usar outra área do local.':'A confirmar. Se souber, selecione uma opção.'}{value&&<> <button type="button" className="environment-reset" onClick={()=>onChange(null)}>Limpar</button></>}</small>
 </fieldset>;
}
export function VenueAutocomplete({value,onChange,onSelect,options,name='venue_name',error}:{value:string;onChange:(name:string)=>void;onSelect:(venue:VenueOption)=>void;options:VenueOption[];name?:string;error?:string}){
 const id=useId(),[open,setOpen]=useState(false),[index,setIndex]=useState(-1);
 const query=venueKey(value);
 const matches=options.filter(v=>[v.name,...v.aliases,v.neighborhood].some(s=>venueKey(s).includes(query))).slice(0,8);
 const choose=(v:VenueOption)=>{onSelect(v);setOpen(false);setIndex(-1)};
 return <div className="venue-autocomplete" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)}}>
  <label htmlFor={id}>Local *<input id={id} name={name} value={value} required minLength={2} maxLength={160} autoComplete="off" role="combobox" aria-invalid={!!error} aria-describedby={error?id+'-error':undefined} aria-autocomplete="list" aria-expanded={open} aria-controls={id+'-options'} aria-activedescendant={open&&index>=0?id+'-'+index:undefined}
   placeholder="Busque ou digite um novo local" onFocus={()=>setOpen(true)} onChange={e=>{onChange(e.target.value);setOpen(true);setIndex(-1)}} onKeyDown={e=>{
    if(e.key==='Escape'){e.preventDefault();setOpen(false);setIndex(-1)}
    if((e.key==='ArrowDown'||e.key==='ArrowUp')&&matches.length){e.preventDefault();setOpen(true);setIndex(i=>e.key==='ArrowDown'?(i+1)%matches.length:(i-1+matches.length)%matches.length)}
    if(e.key==='Enter'&&open&&index>=0&&matches[index]){e.preventDefault();choose(matches[index])}
   }}/></label>
  {error&&<small id={id+'-error'} className="error-text">{error}</small>}
  {open&&<div className="venue-options" id={id+'-options'} role="listbox" aria-label="Locais encontrados">{matches.map((v,i)=><button type="button" role="option" aria-selected={i===index} id={id+'-'+i} key={v.name+'|'+v.city} tabIndex={-1} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(v)}><strong>{v.name}</strong><small>{v.neighborhood||'Bairro a confirmar'} · {v.city} · {v.environment?environmentLabels[v.environment]:'Ambiente a confirmar'}</small></button>)}<p role="presentation">{matches.length?'Selecione um local ou continue digitando para cadastrar outro.':'Local novo: preencha o bairro e selecione o ambiente abaixo.'}</p></div>}
 </div>;
}

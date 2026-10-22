"use client";
import {useEffect,useState} from 'react';
import {request} from '@/lib/transport';
import {type Venue,venueKind} from '@/lib/venues';
export function VenuePicker({onSelect}:{onSelect:(v:Venue)=>void}){
 const [venues,setVenues]=useState<Venue[]>([]),[id,setId]=useState(''),[error,setError]=useState('');
 useEffect(()=>{let active=true;request('/api/admin/venues').then(async r=>{const d=await r.json();if(!r.ok)throw Error();if(active)setVenues(d.venues.filter((v:Venue)=>v.active))}).catch(()=>{if(active)setError('Não foi possível carregar os locais salvos. Você pode preencher os dados abaixo manualmente.')});return()=>{active=false}},[]);
 return <div className="venue-picker"><label>Reutilizar um local salvo<select value={id} onChange={e=>setId(e.target.value)}><option value="">Selecione um bar, boate ou outro local</option>{venues.map(v=><option key={v.id} value={v.id}>{v.name} · {venueKind[v.kind]}</option>)}</select></label><button type="button" className="button secondary" disabled={!id} onClick={()=>{const v=venues.find(v=>v.id===id);if(v)onSelect(v)}}>Preencher dados do local</button><small>Substitui local, endereço, bairro, cidade, organizador e Instagram deste formulário. Revise antes de salvar.</small>{error&&<small role="status">{error}</small>}</div>;
}

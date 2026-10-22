"use client";
import {useEffect,useState} from 'react';
import type {Category} from '@/lib/types';
import type {PublicVenue} from '@/lib/venues';
import {request} from '@/lib/transport';
import {SubmitEvent} from './submit-event';
export function VenueSubmission({id,categories}:{id:string;categories:Category[]}){
 const [venue,setVenue]=useState<PublicVenue|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;setLoading(true);setError('');request('/api/venues?local='+encodeURIComponent(id)).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Falha ao carregar o local.');if(!d.venue)throw Error('Este link de envio não está disponível. Consulte a administração do Tá Rolando.');if(active)setVenue(d.venue)}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Não foi possível carregar o local.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[id]);
 return <div className="venue-submission-page">{loading?<div className="shell page" role="status">Carregando o local…</div>:error?<div className="shell page"><h1>Enviar programação</h1><p className="notice" role="alert">{error}</p></div>:venue&&<><div className="shell page venue-submission-intro"><span className="eyebrow">PROGRAMAÇÃO DO ESTABELECIMENTO</span><h1>{venue.name}</h1><p>Os dados do local já estão preenchidos. Informe a atração, data, horário e entrada. A administração revisa tudo antes de publicar.</p></div><SubmitEvent key={venue.id} categories={categories} initialVenue={venue}/></>}</div>;
}

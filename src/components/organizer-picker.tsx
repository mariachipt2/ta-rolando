"use client";
import {useMemo,useState} from 'react';
import type {Event} from '@/lib/types';
import {organizerPresets,organizerEvent} from '@/lib/organizer-autofill';

export function OrganizerPicker({events,onSelect}:{events:Event[];onSelect:(values:ReturnType<typeof organizerEvent>)=>void}){
  const presets=useMemo(()=>organizerPresets(events),[events]);
  const [key,setKey]=useState(''),[locationId,setLocationId]=useState('');
  const preset=presets.find(item=>item.organizer.key===key);
  function selectLocation(id:string,selected=preset){
    setLocationId(id);
    const event=selected?.locations.find(event=>event.id===id);
    if(event&&selected)onSelect(organizerEvent(event,selected.organizer.instagram));
  }
  return <div className="venue-picker">
    <label>Preencher a partir de um organizador
      <select value={key} onChange={e=>{
        const selected=presets.find(item=>item.organizer.key===e.target.value);
        setKey(e.target.value);setLocationId('');
        if(selected)selectLocation(selected.locations[0].id,selected);
      }}>
        <option value="">Selecione um organizador já cadastrado</option>
        {presets.map(({organizer})=><option key={organizer.key} value={organizer.key}>{organizer.name}{organizer.instagram?' · @'+new URL(organizer.instagram).pathname.split('/')[1]:''}</option>)}
      </select>
    </label>
    {preset&&preset.locations.length>1&&<label>Local usado por esse organizador
      <select value={locationId} onChange={e=>selectLocation(e.target.value)}>
        {preset.locations.map(event=><option key={event.id} value={event.id}>{[event.venue_name,event.address,event.neighborhood,event.city,event.state].filter(Boolean).join(' · ')||'Endereço não informado'}</option>)}
      </select>
    </label>}
    <small>{presets.length?'Ao selecionar, substitui organizador, Instagram, local, endereço, bairro, cidade e UF pelos dados de um evento salvo. Usa primeiro o cadastro salvo mais recentemente. Você pode editar tudo abaixo; só será gravado ao salvar o evento.':'Os organizadores aparecem aqui depois que você salvar um evento com o nome do organizador. Preencha os campos abaixo para cadastrar o primeiro.'}</small>
  </div>;
}

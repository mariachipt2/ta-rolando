"use client";
import {useEffect,useMemo,useState} from 'react';
import type {Event} from '@/lib/types';
import type {OrganizerProfile} from '@/lib/organizer-profiles';
import {organizerPresets,organizerEvent} from '@/lib/organizer-autofill';
import {request} from '@/lib/transport';

export function OrganizerPicker({events,onSelect}:{events:Event[];onSelect:(values:ReturnType<typeof organizerEvent>)=>void}){
  const presets=useMemo(()=>organizerPresets(events),[events]);
  const [profiles,setProfiles]=useState<OrganizerProfile[]>([]);
  useEffect(()=>{
    let active=true;
    void request('/api/admin/organizers').then(async response=>{
      if(!response.ok)return;
      const body=await response.json();
      if(active&&Array.isArray(body.profiles))setProfiles(body.profiles);
    }).catch(()=>{});
    return ()=>{active=false};
  },[]);
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
        const value=e.target.value;
        const selected=presets.find(item=>item.organizer.key===value);
        setKey(value);setLocationId('');
        const profile=profiles.find(item=>'profile:'+item.id===value);
        if(profile)onSelect({environment:profile.environment??null,organizer:profile.name,instagram_url:profile.instagram_url,
          venue_name:profile.venue_name,address:profile.address,neighborhood:profile.neighborhood,city:profile.city,state:profile.state});
        if(selected)selectLocation(selected.locations[0].id,selected);
      }}>
        <option value="">Selecione um organizador já cadastrado</option>
        {profiles.length > 0 && <optgroup label="Cadastro de organizadores">
          {profiles.map(profile=><option key={profile.id} value={'profile:'+profile.id}>{profile.name}</option>)}
        </optgroup>}
        {presets.length > 0 && <optgroup label="Dados de eventos anteriores">
          {presets.map(({organizer})=><option key={organizer.key} value={organizer.key}>{organizer.name}{organizer.instagram?' · @'+new URL(organizer.instagram).pathname.split('/')[1]:''}</option>)}
        </optgroup>}
      </select>
    </label>
    {preset&&preset.locations.length>1&&<label>Local usado por esse organizador
      <select value={locationId} onChange={e=>selectLocation(e.target.value)}>
        {preset.locations.map(event=><option key={event.id} value={event.id}>{[event.venue_name,event.address,event.neighborhood,event.city,event.state].filter(Boolean).join(' · ')||'Endereço não informado'}</option>)}
      </select>
    </label>}
    <small>Você pode editar os dados sugeridos abaixo. As alterações são gravadas neste evento ao salvar.</small>
  </div>;
}

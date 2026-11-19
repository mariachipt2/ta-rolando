
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AdminStatistics} from '../src/components/admin-statistics';
import {configureTransport} from '../src/lib/transport';
import {day} from '../src/lib/dates';
import {shiftStatisticsDay} from '../src/lib/admin-statistics';
import type {Event} from '../src/lib/types';
import '../src/app/globals.css';
const today=day();
const events=[
{id:'a',title:'Rock de sexta no Garajão',venue_name:'Garajão',neighborhood:'Novo Centro',city:'Ipatinga',state:'MG',categories:{name:'Shows e música'}},
{id:'b',title:'Quartaneja da Estação',venue_name:'Estação do Chopp',neighborhood:'Caçula',city:'Ipatinga',state:'MG',categories:{name:'Bares e vida noturna'}},
{id:'c',title:'Espetáculo infantil no Centro Cultural Usiminas',venue_name:'Centro Cultural Usiminas',neighborhood:'Industrial',city:'Ipatinga',state:'MG',categories:{name:'Eventos infantis'},deleted_at:'2026-11-01'},
] as Event[];
const metrics=Array.from({length:90},(_,i)=>({event_id:events[i%3].id,day:shiftStatisticsDay(today,-i),views:i%5+1,ticket_clicks:i%3,interests_added:i%4,interests_removed:i%2}));
let calls=0;
configureTransport(async()=>{
calls++;
return calls===2?Response.json({error:'Falha simulada de conexão.'},{status:503}):Response.json({metrics,metricsRetrievedAt:new Date().toISOString()});
});
function Demo(){const [id,setId]=useState<string|null>(null);
return <main style={{padding:16}}><AdminStatistics events={events} metrics={metrics} retrievedAt={new Date().toISOString()} selectedEvent={id} onSelectEvent={setId}/></main>;
}
createRoot(document.getElementById('root')!).render(<Demo/>);

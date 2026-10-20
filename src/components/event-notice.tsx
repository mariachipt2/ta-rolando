import type {Event} from '@/lib/types';
import {savedTime} from './save-confirmation';
export function EventNotice({event:e,compact=false}:{event:Event;compact?:boolean}){if(e.status!=='cancelled'&&!e.change_notice)return null;return <div className={'event-notice '+(e.status==='cancelled'?'cancelled':'')+(compact?' compact':'')} role="status"><strong>{e.status==='cancelled'?'Evento cancelado':'Evento alterado'}</strong><span>{e.change_notice||'Este evento foi cancelado.'}</span>{e.change_at&&!compact&&<small>Atualização em {savedTime(e.change_at)} · Brasília</small>}</div>;}

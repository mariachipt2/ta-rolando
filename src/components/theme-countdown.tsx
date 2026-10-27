"use client";
import type {Event} from '@/lib/types';
import {useNow} from '@/lib/use-now';
import {eventCountdown} from '@/lib/event-countdown';

export function ThemeCountdown({event}:{event:Pick<Event,'starts_at'|'ends_at'>}){
  // Only this small display updates every second, not the event list or page.
  const now=useNow(1000),count=eventCountdown(event.starts_at,now);
  if(!count)return null;
  if(count.started){
    const ended=event.ends_at&&Date.parse(event.ends_at)<=now;
    return <p className="event-countdown-state" role="status">{ended?'Evento encerrado':event.ends_at?'Está rolando!':'É agora!'}</p>;
  }
  const units=[['dias',count.days],['horas',count.hours],['minutos',count.minutes],['segundos',count.seconds]] as const;
  return <div className="event-countdown" role="timer" aria-live="off" aria-label="Tempo restante para o início do evento"><span className="event-countdown-label">O evento começa em</span><div className="event-countdown-units">{units.map(([label,value])=><div className="event-countdown-unit" key={label}><strong>{String(value).padStart(2,'0')}</strong><span>{label}</span></div>)}</div></div>;
}

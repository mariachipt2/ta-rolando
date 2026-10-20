import type {Event} from '@/lib/types';
import {similarEvents} from '@/lib/event-discovery';
import {EventCard} from './event-card';
export function SimilarEvents({event,events}:{event:Event;events:Event[]}){const matches=similarEvents(event,events);if(!matches.length)return null;return <section className="event-section similar-events"><div className="section-heading"><div><span className="eyebrow">MAIS ROLÊS DO SEU JEITO</span><h2>Eventos semelhantes</h2><p className="muted">Outros eventos de {event.categories?.name||'esta categoria'}.</p></div></div><div className="event-grid">{matches.map(e=><EventCard key={e.id} event={e}/>)}</div></section>}

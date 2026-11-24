import {test} from 'node:test';import assert from 'node:assert/strict';
import {agendaSelection} from '../src/lib/daily-agenda';import {trendingEvents} from '../src/lib/trending';import {weekendEvents} from '../src/lib/weekend';import {similarEvents} from '../src/lib/event-discovery';import {eventSchema} from '../src/lib/validation';import type {Event} from '../src/lib/types';
const now=new Date('2030-11-20T12:00:00-03:00');const base={id:'available',category_id:'music',starts_at:'2030-11-22T20:00:00-03:00',ends_at:null,status:'published',recent_views:20} as Event;
test('Esgotados saem da agenda, fim de semana, ranking e semelhantes; reabrir restaura sem remover cadastro',()=>{
 const sold={...base,id:'sold',sold_out:true,featured:true,recent_views:999};const source={...base,id:'source'};const items=[sold,base];
 for(const list of [agendaSelection(items,'',now,'all').events,trendingEvents(items,now),weekendEvents(items,'2030-11-22',now),similarEvents(source,items,now)])assert.deepEqual(list.map(e=>e.id),['available']);
 assert.equal(items.length,2);sold.sold_out=false;assert.equal(agendaSelection(items,'',now,'all').events.length,2);
 assert.equal(eventSchema.safeParse({...sold,sold_out:'true'}).success,false);
});

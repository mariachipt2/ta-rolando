import {House,Sun,Layers} from 'lucide-react';
import {environmentLabels,type Environment} from '@/lib/venue-directory';

export function EnvironmentBadge({value,compact=false}:{value?:Environment|null;compact?:boolean}){
 if(!value||!Object.hasOwn(environmentLabels,value))return null;
 const Icon=value==='coberto'?House:value==='ao_ar_livre'?Sun:Layers;
 return <div className={'environment-badge environment-badge--'+value+(compact?' environment-badge--compact':'')} aria-label={'Ambiente: '+environmentLabels[value]}>
  <Icon size={compact?17:24} aria-hidden="true"/>
  <span>{!compact&&<small>Ambiente</small>}<strong>{environmentLabels[value]}</strong></span>
 </div>;
}

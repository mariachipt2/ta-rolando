import {Gamepad2,MapPin,Palmtree} from 'lucide-react';

export function GtaThemeRibbon(){
  return <div className="gta-theme-ribbon"><span><Gamepad2 size={16} aria-hidden="true"/> MODO VICE CITY</span><span><MapPin size={14} aria-hidden="true"/> Ipatinga no mapa</span></div>;
}

export function GtaThemeIdentity(){
  return <div className="gta-theme-identity">
    <span className="gta-edition-label"><Palmtree size={17} aria-hidden="true"/> ESPECIAL DE LANÇAMENTO · GTA VI</span>
    <h1 className="gta-theme-title" aria-label="Tá Rolando — Modo Vice City"><span className="gta-theme-wordmark" aria-hidden="true"><span>tá</span><span>rolando</span></span><span className="gta-theme-six" aria-hidden="true">VI<Palmtree/></span></h1>
    <p className="gta-theme-motto">Vice City no clima.<br/><strong>Ipatinga no mapa.</strong></p>
    <p className="gta-theme-caption">GTA VI chegou. Seu próximo rolê também tá no mapa.</p>
  </div>;
}

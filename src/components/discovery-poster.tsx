"use client";
import { useState } from 'react';
import { https } from '../../supabase/functions/_shared/discovery';

export function DiscoveryPoster({ url, title }: { url: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const src = https(url);
  if (!src) return null;
  return <div className="discovery-poster">
    {failed ? <p className="muted" role="status">Não foi possível carregar o cartaz desta fonte. Você pode abrir a imagem pelo link abaixo.</p> :
      <a href={src} target="_blank" rel="noopener noreferrer" aria-label={'Abrir cartaz de ' + title}>
        <img src={src} alt={'Cartaz de ' + title} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)}/>
      </a>}
  </div>;
}

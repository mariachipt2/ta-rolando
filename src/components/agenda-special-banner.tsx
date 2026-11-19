"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Flame } from 'lucide-react';
import { agendaSpecialSchema, specialDateLabel, specialPath, specialVisible, type AgendaSpecial } from '@/lib/agenda-special';
import { request } from '@/lib/transport';
import { useNow } from '@/lib/use-now';

export function AgendaSpecialBanner() {
  const [settings, setSettings] = useState<AgendaSpecial | null>(null);
  const now = new Date(useNow());
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await request('/api/agenda-special', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        const parsed = agendaSpecialSchema.safeParse(data.settings);
        if (active && parsed.success) setSettings(parsed.data);
      } catch {}
    }
    void refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('tr:campaign-refresh', refresh);
    const timer = setInterval(refresh, 60000);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('tr:campaign-refresh', refresh);
    };
  }, []);
  if (!settings || !specialVisible(settings, now)) return null;
  return <SpecialBannerPreview settings={settings}/>;
}

export function SpecialBannerPreview({ settings }: { settings: AgendaSpecial }) {
  return <Link href={specialPath(settings)} className="agenda-special-banner">
    <span className="agenda-special-icon" aria-hidden="true"><Flame size={26}/></span>
    <span className="agenda-special-copy"><strong>{settings.title}</strong><span>{specialDateLabel(settings)} <span aria-hidden="true">·</span> Confira os rolês</span></span>
    <ArrowUpRight className="agenda-special-arrow" size={23} aria-hidden="true"/>
  </Link>;
}

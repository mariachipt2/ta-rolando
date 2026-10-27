import {ServerClock} from '@/components/server-clock';
import {NativeSpecialTheme} from '@/components/special-theme-native';
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { MapPin, Radio } from "lucide-react";
import {NativeSiteNavigation} from '@/components/site-navigation-native';
import {NativeCompareTray} from '@/components/compare-tray-native';
import { Pwa } from "@/components/pwa";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Tá Rolando — Seu próximo rolê em Ipatinga",
    template: "%s | Tá Rolando",
  },
  description:
    "Não fique de fora. Saiba o que tá rolando! Shows, cultura, gastronomia e encontros em Ipatinga.",
  manifest: "/manifest.webmanifest",
  icons: {icon:'/icons/icon-192.png',apple:'/icons/icon-192.png'},
  openGraph: {title:'Tá Rolando — Ipatinga',description:'Não fique de fora. Saiba o que tá rolando!',images:['/icons/icon-512.png'],locale:'pt_BR',type:'website'},
  appleWebApp: {
    capable: true,
    title: "Tá Rolando",
    statusBarStyle: "black-translucent",
  },
};
export const viewport: Viewport = { themeColor: "#0B0B12" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#main" className="skip">
          Pular para o conteúdo
        </a>
        <header className="site-header">
          <div className="shell nav site-nav">
            <Link href="/" className="logo" aria-label="Tá Rolando, início">
              <Radio size={27} /> tá rolando
            </Link>
            <span className="location">
              <MapPin size={14} /> Ipatinga, MG
            </span>
            <NativeSiteNavigation/>
          </div>
        </header>
        <main id="main"><NativeSpecialTheme/>{children}</main>
        <footer className="shell">
          <Link className="logo" href="/">
            tá rolando
          </Link>
          <p>
            Feito para quem vive a cidade.
            <br />
            Ipatinga · Vale do Aço · MG
          </p>
          <Link href="/privacidade">Privacidade</Link>
          <span>Não fique de fora. ♡</span>
        </footer>
        <NativeCompareTray/>
        <Pwa /><ServerClock/>
      </body>
    </html>
  );
}


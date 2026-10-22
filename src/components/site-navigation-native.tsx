"use client";
import {usePathname} from 'next/navigation';
import {SiteNavigation} from './site-navigation';
export function NativeSiteNavigation(){return <SiteNavigation path={usePathname()}/>}

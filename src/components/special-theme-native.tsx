"use client";
import {usePathname} from 'next/navigation';
import {SpecialTheme} from './special-theme';
export function NativeSpecialTheme(){return <SpecialTheme path={usePathname()}/>}

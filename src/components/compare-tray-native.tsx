"use client";
import {usePathname} from 'next/navigation';
import {CompareTray} from './compare-selection';
export function NativeCompareTray(){return <CompareTray hidden={['/admin','/comparar'].includes(usePathname())}/>}

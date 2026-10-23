"use client";
import {clockNow,siteClock} from './site-clock';
import {useEffect,useState} from 'react';
// Recheck dates while the page stays open, including after sleep or background throttling.
export function useNow(){
 const [now,setNow]=useState(()=>clockNow());
 useEffect(()=>{const refresh=()=>setNow(clockNow());refresh();const unsubscribe=siteClock.subscribe(refresh);const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{unsubscribe();clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}},[]);
 return now;
}

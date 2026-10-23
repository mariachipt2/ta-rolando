"use client";
import {useEffect,useState} from 'react';
// Recheck dates while the page stays open, including after sleep or background throttling.
export function useNow(){
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const refresh=()=>setNow(Date.now());refresh();const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}},[]);
 return now;
}

"use client";
import {useEffect} from 'react';
import {siteClock} from '@/lib/site-clock';
export function ServerClock(){useEffect(()=>{let active=true,pending=false;const update=async()=>{if(pending||document.hidden)return;pending=true;try{const r=await fetch('/api/clock',{cache:'no-store'});const d=await r.json();if(active&&r.ok)siteClock.sync(d.now)}catch{}finally{pending=false}};void update();const timer=setInterval(()=>void update(),60000);const focus=()=>void update();window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus)}},[]);return null}

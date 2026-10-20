import {Camera,ArrowUpRight} from 'lucide-react';
import {instagramProfile} from '@/lib/instagram';
export function InstagramLink({url}:{url?:string}){const href=instagramProfile(url||'');return href?<div className="share-buttons"><a className="button secondary" href={href} target="_blank" rel="noopener noreferrer"><Camera size={18}/> Instagram do evento/organizador <ArrowUpRight size={16}/></a></div>:null;}

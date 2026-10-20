import {ArrowUpRight} from 'lucide-react';
import {InstagramIcon} from './instagram-icon';
import {instagramProfile} from '@/lib/instagram';
export function InstagramLink({url,compact=false}:{url?:string;compact?:boolean}){const href=instagramProfile(url||'');if(!href)return null;const link=<a className={compact?'instagram-card-link':'button secondary'} href={href} target="_blank" rel="noopener noreferrer" aria-label="Instagram do evento/organizador" title="Abrir Instagram do evento/organizador"><InstagramIcon/>{!compact&&<> Instagram do evento/organizador <ArrowUpRight size={16}/></>}</a>;return compact?link:<div className="share-buttons">{link}</div>;}

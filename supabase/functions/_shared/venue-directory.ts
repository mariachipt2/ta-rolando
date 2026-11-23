export const environmentLabels = { coberto: 'Coberto', ao_ar_livre: 'Ao ar livre', misto: 'Misto' } as const;
export type Environment = keyof typeof environmentLabels;
export type VenuePreset = { nome: string; bairro: string; ambiente: Environment | null; aliases: string[]; fonte?: string };
// Null means unconfirmed; it must never be interpreted as sheltered from rain.
export const baseVenues: VenuePreset[] = [
  { nome:'Garajão', bairro:'Novo Centro', ambiente:null, aliases:['Garajão - Ipatinga'] },
  { nome:'Estação do Chopp', bairro:'', ambiente:null, aliases:[] },
  { nome:'Mansão Music Hall', bairro:'Veneza', ambiente:null, aliases:['Mansão','Mansão Music Hall - Ipatinga'] },
  { nome:'Dedo de Prosa Casa Bistrô', bairro:'Iguaçu', ambiente:null, aliases:['Dedo de Prosa'] },
  { nome:'Mais Eventos', bairro:'Cidade Nobre', ambiente:null, aliases:['+Mais Eventos','Mais Eventos - Ipatinga'] },
  { nome:'Butiquim Carioca', bairro:'Veneza', ambiente:null, aliases:[] },
  { nome:'Bar da Santa', bairro:'Cariru', ambiente:null, aliases:['Bar da Santa - Ipatinga'] },
  { nome:'The House Pub', bairro:'Iguaçu', ambiente:null, aliases:[] },
  { nome:'Pizzaria do Jayme', bairro:'Iguaçu', ambiente:null, aliases:['Pizzaria do Jayme - Ipatinga'] },
  { nome:'Meat House 360°', bairro:'Cidade Nobre', ambiente:null, aliases:[] },
  { nome:'Centro Cultural Usiminas', bairro:'Industrial', ambiente:'misto', aliases:['Centro Cultural Usiminas - Ipatinga'], fonte:'https://www.institutousiminas.com/locacao/' },
  { nome:'Teatro do Centro Cultural Usiminas', bairro:'Industrial', ambiente:'coberto', aliases:['Teatro Usiminas'], fonte:'https://www.institutousiminas.com/locacao/' },
  { nome:'Parque Ipanema', bairro:'Veneza', ambiente:'ao_ar_livre', aliases:[], fonte:'https://www.ipatinga.mg.gov.br/detalhe-do-estabelecimento/estabelecimento/parque-ipanema/9' },
];
export function venueKey(value:string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
export function findBaseVenue(name:string) { const key=venueKey(name); return baseVenues.find(v=>[v.nome,...v.aliases].some(n=>venueKey(n)===key)); }

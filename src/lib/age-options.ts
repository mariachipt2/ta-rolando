export const AGE_OPTIONS=['Não informada','Livre','10 anos','12 anos','14 anos','16 anos','18 anos'];
export function childrenLabel(value?:boolean|null){return value===true?'Adequado para crianças':value===false?'Não recomendado para crianças':'Crianças: consulte o organizador';}

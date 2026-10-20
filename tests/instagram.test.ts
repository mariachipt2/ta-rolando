import {test} from 'node:test';
import assert from 'node:assert/strict';
import {instagramUrl} from '../src/lib/validation';
test('Instagram é opcional e remove parâmetros de compartilhamento',()=>{
 assert.equal(instagramUrl.parse(''),'');
 assert.equal(instagramUrl.parse(' https://instagram.com/meu.perfil_1/?igsh=abc#bio '),'https://www.instagram.com/meu.perfil_1/');
});
test('Instagram rejeita outros domínios, scripts e links de posts',()=>{
 for(const value of ['javascript:alert(1)','http://instagram.com/perfil/','https://instagram.com.evil.test/perfil/','https://instagram.com@evil.test/perfil/','https://evil@instagram.com/perfil/','https://www.instagram.com/p/abc/','https://instagram.com/reels/','https://instagram.com/conta/extra/','https://instagram.com:444/perfil/'])assert.equal(instagramUrl.safeParse(value).success,false,value);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readAll} from '../src/lib/pagination';
test('Consulta não perde registros após o limite padrão de 1000 linhas',async()=>{const source=Array.from({length:1201},(_,i)=>({id:i}));const result=await readAll(async(from,to)=>({data:source.slice(from,to+1),error:null}));assert.equal(result.length,1201);assert.equal(result.at(-1)?.id,1200)});

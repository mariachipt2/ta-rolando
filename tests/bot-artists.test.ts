import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDraftArtists } from '../supabase/functions/_shared/artist-matching';

test('Bot identifica nomes completos sem depender de acentos, caixa ou espaços e elimina repetições', () => {
  const resolved = resolveDraftArtists(['brenda  brandao', 'Brenda Brandão'], ['b'], [{ id: 'a', name: 'Brenda Brandão' }, { id: 'b', name: 'Banda de teste' }]);
  assert.deepEqual(resolved.ids, ['b', 'a']);
  assert.deepEqual(resolved.names, ['Banda de teste', 'Brenda Brandão']);
  assert.deepEqual(resolved.unknown, []);
  assert.deepEqual(resolved.ambiguous, []);
});

test('Bot pede revisão para nome incompleto, homônimo ou identificador ausente', () => {
  const profiles = [{ id: 'a', name: 'Brenda Brandão' }, { id: 'b', name: 'Brenda Brandao' }];
  const resolved = resolveDraftArtists(['Brenda', 'Brenda Brandão'], ['missing'], profiles);
  assert.deepEqual(resolved.unknown, ['Brenda']);
  assert.deepEqual(resolved.ambiguous, ['Brenda Brandão']);
  assert.deepEqual(resolved.invalidIds, ['missing']);
});

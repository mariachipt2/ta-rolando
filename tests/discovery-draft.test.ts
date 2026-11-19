import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discoveryDraft, discoverySourceCover } from '../src/lib/discovery-draft';
import type { DiscoveredEvent } from '../supabase/functions/_shared/discovery';

const item = {
  title: 'Show de teste', source: 'socialyte', source_url: 'https://socialyte.com.br/eventos/teste/',
  image_url: 'https://socialyte.com.br/wp-content/uploads/cartaz.jpg',
  starts_at: '2026-11-21T22:00:00-03:00', venue_name: 'Garajão', is_free: null, missing: ['Categoria'],
} as DiscoveredEvent;

test('Revisar um resultado mantém o cartaz na capa do rascunho e a referência da origem', () => {
  const draft = discoveryDraft(item, 'categoria', 'paid', '2026-11-19T12:00:00Z');
  assert.equal(draft.cover_url, item.image_url);
  assert.equal(draft.status, 'draft');
  assert.equal(draft.is_free, false);
  assert.equal(draft.category_id, 'categoria');
  assert.equal(draft.family_friendly, null);
  assert.deepEqual(draft.gallery, []);
  assert.equal(discoverySourceCover(draft), item.image_url);
  assert.equal('image_url' in draft, false);
  assert.equal('missing' in draft, false);
});

test('Sem cartaz válido, o cadastro continua editável e links inseguros são descartados', () => {
  for (const image_url of ['', 'http://example.com/image.jpg', 'javascript:alert(1)', 'https://user:pass@example.com/image.jpg']) {
    const draft = discoveryDraft({ ...item, image_url, is_free: true }, 'categoria', '', '2026-11-19T12:00:00Z');
    assert.equal(draft.cover_url, '');
    assert.equal(draft.is_free, true);
    assert.equal(discoverySourceCover(draft), '');
  }
});

test('Rascunhos antigos recuperam o cartaz pela referência salva na busca', () => {
  const old = { additional_info: `Fonte da busca: ${item.source_url}\r\nDados consultados.\r\nCartaz na fonte (verificar autorização de uso): ${item.image_url}`, cover_url: '' };
  assert.equal(discoverySourceCover(old), item.image_url);
  assert.equal(discoverySourceCover({ additional_info: 'Cartaz na fonte: ' + item.image_url }), '');
});

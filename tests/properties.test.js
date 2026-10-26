import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/properties.js';

test('public API omits hidden branches, their rooms, hidden rooms and unlisted fields', async t => {
  const env = { ...process.env };
  t.after(() => { process.env = env; });
  process.env.LARK_APP_ID = 'test';
  process.env.LARK_APP_SECRET = 'test';
  process.env.LARK_BASE_TOKEN = 'test';
  const rows = {
    tblhl3FKDAP8jaNr: [
      { record_id: 'visible', fields: { name: 'Lune', is_hidden: 'false', private_notes: 'secret' } },
      ...[true, 'true', 1, '1'].map((flag, i) => ({ record_id: `hidden${i}`, fields: { name: `Hidden${i}`, is_hidden: flag } })),
      { record_id: 'blank', fields: {} },
    ],
    tblJefcV2kiRLRtH: [
      { record_id: 'public-name', fields: { branches: 'Lune', is_hidden: 'false' } },
      { record_id: 'public-link', fields: { branches: [{ record_id: 'visible' }] } },
      { record_id: 'hidden-parent', fields: { branches: 'hidden0' } },
      { record_id: 'hidden-room', fields: { branches: 'Lune', is_hidden: 'true' } },
      { record_id: 'orphan', fields: { branches: 'missing' } },
    ],
    tbllkMCqH3GvrncZ: [
      { record_id: 'policy', fields: { key: 'general_policies', value: '[]' } },
      { record_id: 'private-setting', fields: { key: 'private', value: 'secret' } },
    ],
  };
  t.mock.method(globalThis, 'fetch', async url => {
    if (String(url).includes('/auth/')) return Response.json({ code: 0, tenant_access_token: 'test' });
    const tableId = new URL(url).pathname.split('/').at(-2);
    return Response.json({ code: 0, data: { items: rows[tableId], has_more: false } });
  });
  const headers = {};
  let body;
  const res = {
    status(code) { assert.equal(code, 200); return this; },
    setHeader(key, value) { headers[key] = value; },
    json(value) { body = value; },
  };
  await handler({ method: 'GET' }, res);
  assert.deepEqual(body.branches.map(b => b.id), ['visible']);
  assert.deepEqual(body.rooms.map(r => r.id), ['public-name', 'public-link']);
  assert.deepEqual(body.settings.map(s => s.key), ['general_policies']);
  assert.equal(body.branches[0].private_notes, undefined);
  assert.equal(headers['Cache-Control'], 'no-store');
});

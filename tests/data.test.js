import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

process.env.VITE_SUPABASE_URL = '';
process.env.VITE_SUPABASE_ANON_KEY = '';
const unconfiguredServer = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
const { getSupabase: unconfiguredClient } = await unconfiguredServer.ssrLoadModule('/src/lib/supabase.ts');
test('reports missing Supabase configuration', () => {
  assert.throws(unconfiguredClient, /Missing Supabase/);
});
await unconfiguredServer.close();

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
const originalFetch = globalThis.fetch;
const { fetchProperties } = await server.ssrLoadModule('/src/services/dataService.ts');

const rows = {
  longterm_branches: [{ id: 1, name: 'Visible' }, { id: 2, name: 'Hidden', is_hidden: true }],
  longterm_room_types: [{ id: 10, branch_id: 1, name: 'Room', monthly_over: 100, is_hidden: true }],
  longterm_settings: [{ key: 'general_policies', value: '[{"title":"Policy","content":"Details"}]' }],
};
function mockFetch(failTable) {
  return async (url) => {
    const table = new URL(String(url)).pathname.split('/').pop();
    if (table === failTable) return new Response(JSON.stringify({ code: '42501', message: 'Permission denied' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    if (!(table in rows)) return new Response(JSON.stringify({ code: 'PGRST205', message: 'Table not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify(rows[table]), { headers: { 'Content-Type': 'application/json' } });
  };
}

test('maps Supabase data and tolerates missing optional tables', async () => {
  globalThis.fetch = mockFetch();
  const data = await fetchProperties();
  assert.equal(data.properties[0].rooms[0].name, 'Room');
  assert.equal(data.properties[0].rooms[0].isHidden, true);
  assert.equal(data.properties[1].isHidden, true);
  assert.equal(data.generalPolicies[0].title, 'Policy');
  assert.deepEqual(data.dateAdjustments, []);
});

test('propagates failures instead of showing an empty list', async () => {
  globalThis.fetch = mockFetch('longterm_branches');
  await assert.rejects(fetchProperties(), /Cannot load longterm_branches/);
});

test.after(async () => { globalThis.fetch = originalFetch; await server.close(); });

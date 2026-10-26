const BASE = 'https://open.larksuite.com/open-apis';
const TABLES = {
  branches: process.env.LARK_BRANCHES_TABLE_ID || 'tblhl3FKDAP8jaNr',
  rooms: process.env.LARK_ROOMS_TABLE_ID || 'tblJefcV2kiRLRtH',
  settings: process.env.LARK_SETTINGS_TABLE_ID || 'tbllkMCqH3GvrncZ',
};
const WIKI_NODE_TOKEN = 'F8RAwt5OViGWYukD5Qalm7pVgQd';

const PUBLIC_FIELDS = {
  branches: ['id', 'name', 'address', 'description', 'storage_folder', 'images', 'amenities', 'excluded_amenities', 'policies', 'promotion', 'tag', 'is_hidden'],
  rooms: ['id', 'branches', 'branch_id', 'name', 'sqm', 'area', 'storage_folder', 'images', 'amenities', 'excluded_amenities', 'monthly_over', 'monthly_under', 'min_contract_months', 'fees', 'tag', 'is_hidden'],
  settings: ['key', 'name', 'value'],
};

function plain(value) {
  if (Array.isArray(value) && value.every(item => item && typeof item === 'object' && 'text' in item)) {
    return value.map(item => item.text).join('');
  }
  return value;
}

function isHidden(value) {
  return value === true || value === 1 ||
    (typeof value === 'string' && ['true', '1'].includes(value.trim().toLowerCase()));
}

function references(value) {
  return (Array.isArray(value) ? value : [value])
    .map(item => typeof item === 'object' && item !== null ? item.record_id ?? item.recordId : item)
    .filter(value => value != null && String(value).trim())
    .map(value => String(value).trim().toLowerCase());
}

let authCache;
let authPending;
let wikiCache;

async function tenantToken() {
  const key = JSON.stringify([process.env.LARK_APP_ID, process.env.LARK_APP_SECRET]);
  if (authCache?.key === key && authCache.expiresAt > Date.now()) return authCache.token;
  if (authPending?.key === key) return authPending.promise;
  const promise = (async () => {
    const response = await fetch(`${BASE}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ app_id: process.env.LARK_APP_ID, app_secret: process.env.LARK_APP_SECRET }),
    });
    const auth = await response.json();
    if (!response.ok || auth.code !== 0 || !auth.tenant_access_token) {
      const error = new Error(auth.msg || 'Lark authentication failed');
      error.code = auth.code;
      error.stage = 'authentication';
      throw error;
    }
    authCache = { key, token: auth.tenant_access_token, expiresAt: Date.now() + Math.max(0, (Number(auth.expire) || 7200) - 60) * 1000 };
    return authCache.token;
  })();
  authPending = { key, promise };
  try { return await promise; }
  finally { if (authPending?.promise === promise) authPending = undefined; }
}

async function lark(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  const body = await response.json();
  if (!response.ok || body.code !== 0) {
    const error = new Error(body.msg || 'Lark request failed');
    error.code = body.code;
    error.stage = new URL(url).pathname;
    throw error;
  }
  return body.data;
}

async function baseToken(token) {
  if (process.env.LARK_BASE_TOKEN) return process.env.LARK_BASE_TOKEN;
  const cacheKey = JSON.stringify([process.env.LARK_APP_ID, process.env.LARK_APP_SECRET, process.env.LARK_WIKI_NODE_TOKEN || WIKI_NODE_TOKEN]);
  if (wikiCache?.key === cacheKey && wikiCache.expiresAt > Date.now()) return wikiCache.token;
  const url = new URL(`${BASE}/wiki/v2/spaces/get_node`);
  url.searchParams.set('token', process.env.LARK_WIKI_NODE_TOKEN || WIKI_NODE_TOKEN);
  const data = await lark(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (data.node?.obj_type !== 'bitable' || !data.node?.obj_token) throw new Error('Siris Web Wiki node is not a Base');
  wikiCache = { key: cacheKey, token: data.node.obj_token, expiresAt: Date.now() + 300000 };
  return data.node.obj_token;
}

async function records(token, appToken, tableId, allowed) {
  const result = [];
  let pageToken;
  do {
    const url = new URL(`${BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
    url.searchParams.set('page_size', '500');
    if (pageToken) url.searchParams.set('page_token', pageToken);
    const data = await lark(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    for (const item of data.items || []) {
      const row = { id: item.record_id, record_id: item.record_id };
      for (const field of allowed) {
        if (Object.hasOwn(item.fields, field)) row[field] = plain(item.fields[field]);
      }
      result.push(row);
    }
    pageToken = data.has_more ? data.page_token : undefined;
  } while (pageToken);
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!process.env.LARK_APP_ID || !process.env.LARK_APP_SECRET) {
    return res.status(503).json({ error: 'Lark integration is not configured' });
  }
  try {
    const token = await tenantToken();
    const appToken = await baseToken(token);
    const [branches, rooms, settings] = await Promise.all(
      Object.entries(TABLES).map(([name, id]) => records(token, appToken, id, PUBLIC_FIELDS[name]))
    );
    const publicBranches = branches.filter(branch => !isHidden(branch.is_hidden) && typeof branch.name === 'string' && branch.name.trim());
    const publicBranchRefs = new Set(publicBranches.flatMap(branch => references([branch.id, branch.record_id, branch.name])));
    const publicRooms = rooms.filter(room => !isHidden(room.is_hidden) &&
      references(room.branches ?? room.branch_id).some(ref => publicBranchRefs.has(ref)));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ branches: publicBranches, rooms: publicRooms, settings: settings.filter(s => ['general_policies', 'general_policy'].includes(s.key || s.name)) });
  } catch (error) {
    if ([99991663, 99991664, 99991668].includes(error.code)) authCache = undefined;
    console.error('Lark data request failed:', error);
    return res.status(502).json({
      error: 'Unable to load property data',
      code: error.code || error.cause?.code || 'LARK_REQUEST_FAILED',
      stage: error.stage || 'connection',
      message: error.stage ? error.message : 'Cannot connect to Lark',
    });
  }
}

/**
 * Aigameria v1.02 — full auth standards E2E test (phase 1: email/password).
 * Covers: register → activation → login → me → device registry (FCM/location/
 * permissions) → change-password → refresh → logout. Run: node scripts/auth-flow-test.mjs [base]
 */
const BASE = process.argv[2] ?? 'http://localhost:3000';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
};
const email = `qa_${Date.now()}@aigameria-test.local`;
const password = 'QaPassword!123';

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* redirect pages */ }
  return { status: res.status, json, setCookie: res.headers.get('set-cookie'), text: json ? undefined : await res.text() };
}

console.log('== 1. register ==');
let r = await api('POST', '/api/v1/auth/register', { body: { email, password, displayName: 'QA Runner' } });
ok('register 201', r.status === 201, JSON.stringify(r.json)?.slice(0, 200));
const devUrl = r.json?.data?.devActivationUrl ?? '';
const uid = r.json?.data?.user?.id;
ok('returns user id', Boolean(uid));
ok('dev activation url present (no mail provider)', devUrl.includes('/auth/activate?token='));

console.log('== 2. activation ==');
const token = devUrl.split('token=')[1]?.split('&')[0] ?? '';let r2 = await api('GET', `/api/v1/auth/activate?token=${token}`);
ok('activate ok', r2.status === 200 && r2.json?.data?.ok !== false, JSON.stringify(r2.json)?.slice(0, 160));
let r3 = await api('GET', `/api/v1/auth/activate?token=${token}`);
ok('re-use rejected', r3.json?.data?.ok === false || r3.json?.error?.code, 'second use should fail');
let r4 = await api('POST', '/api/v1/auth/register', { body: { email, password: 'Other!1234567', displayName: 'Dup' } });
ok('duplicate email 409', r4.status === 409);

console.log('== 3. login ==');
r = await api('POST', '/api/v1/auth/login', { body: { email, password } });
ok('login 200', r.status === 200, JSON.stringify(r.json)?.slice(0, 160));
ok('session token issued', typeof r.json?.data?.token === 'string' && r.json.data.token.length >= 32);
ok('emailVerified true after activation', r.json?.data?.emailVerified === true, JSON.stringify(r.json?.data).slice(0,160));
const t = r.json.data.token;
r = await api('POST', '/api/v1/auth/login', { body: { email, password: 'wrong-pass' } });
ok('wrong password 401', r.status === 401);

console.log('== 4. me / session ==');
r = await api('GET', '/api/v1/auth/me', { token: t });
ok('me 200', r.status === 200 && r.json?.data?.user?.email === email, JSON.stringify(r.json)?.slice(0, 160));
r = await api('GET', '/api/v1/auth/me');
ok('me without token 401', r.status === 401);

console.log('== 5. device registry (FCM + location + permissions) ==');
r = await api('POST', '/api/v1/auth/device', { token: t, body: {
  fcmToken: `fcmQA_${Date.now()}`, platform: 'web', location: 'Tehran, IR', permissions: 'notifications,location',
} });
ok('device registered', r.status === 200 || r.status === 201, JSON.stringify(r.json)?.slice(0, 200));
r = await api('GET', '/api/v1/auth/devices', { token: t });
ok('devices listed with saved fields', r.status === 200 && JSON.stringify(r.json?.data ?? r.json).includes('Tehran'), JSON.stringify(r.json)?.slice(0, 200));

console.log('== 6. change password ==');
r = await api('POST', '/api/v1/auth/change-password', { token: t, body: { currentPassword: password, newPassword: 'NewPass!98765' } });
ok('change-password ok', r.status === 200, JSON.stringify(r.json)?.slice(0, 160));
r = await api('POST', '/api/v1/auth/login', { body: { email, password: 'NewPass!98765' } });
ok('login with new password', r.status === 200);

console.log('== 7. refresh / logout ==');
r = await api('POST', '/api/v1/auth/refresh', { token: t });
ok('refresh 200', r.status === 200, JSON.stringify(r.json)?.slice(0, 160));
const t2 = r.json?.data?.token ?? t;
r = await api('POST', '/api/v1/auth/logout', { token: t2 });
ok('logout 200', r.status === 200, JSON.stringify(r.json)?.slice(0, 120));
r = await api('GET', '/api/v1/auth/me', { token: t2 });
ok('token dead after logout', r.status === 401);

console.log('== 8. oauth providers listing ==');
r = await api('GET', '/api/v1/auth/oauth/providers');
ok('providers endpoint', r.status === 200 && Array.isArray(r.json?.data?.providers));
ok('5 providers listed', r.json?.data?.providers?.length === 5);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

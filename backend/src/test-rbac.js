const supabase = require('./config/supabaseClient');
const app = require('./app');

const PORT = 5050;
const API = `http://localhost:${PORT}/api`;

async function req(method, path, body, token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers: h };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${API}${path}`, opts);
  return { status: r.status, data: await r.json() };
}

async function main() {
  const server = app.listen(PORT);
  await new Promise(r => setTimeout(r, 500));
  console.log('Server on', PORT);

  const tokens = {};

  const { data: listData } = await supabase.auth.admin.listUsers();
  const allUsers = listData?.users || [];

  // Create 3 test users
  for (const [email, name, role] of [
    ['s1@test.com', 'Student1', 'student'],
    ['t1@test.com', 'Teacher1', 'teacher'],
    ['a1@test.com', 'Admin1', 'admin']
  ]) {
    // 1. Clean up existing test user
    const existing = allUsers.find(u => u.email === email);
    if (existing) {
      await supabase.auth.admin.deleteUser(existing.id);
      await supabase.from('profiles').delete().eq('id', existing.id);
      console.log(role, 'cleaned up old records');
    }

    // 2. Create the user fresh
    let authUserId = null;
    const createRes = await supabase.auth.admin.createUser({
      email, password: 'Pass123!', email_confirm: true, user_metadata: { name }
    });
    if (createRes.data && createRes.data.user) {
      authUserId = createRes.data.user.id;
      console.log(role, 'created fresh:', authUserId);
    } else {
      console.log(role, 'create failed:', createRes.error);
    }

    // 3. Upsert the profile to ensure they have the correct role and exist
    if (authUserId) {
      const resp = await supabase.from('profiles').upsert({ id: authUserId, name, email, role }).eq('id', authUserId);
      if (resp.error) {
          console.log(role, 'PROFILE UPSERT ERROR:', resp.error);
      } else {
          console.log(role, 'profile initialized/updated:', role);
      }
    }

    // 4. Login via API
    const login = await req('POST', '/auth/login', { email, password: 'Pass123!' });
    console.log(role, 'login status:', login.status);

    if (login.data.success && login.data.data && login.data.data.session) {
      tokens[role] = login.data.data.session.access_token;
      const user = login.data.data.user;
      console.log(role, 'logged in, role:', user ? user.role : 'NO PROFILE');
    } else {
      console.log(role, 'login FAIL:', login.data.error || 'unknown');
    }
  }

  if (!tokens.student || !tokens.teacher || !tokens.admin) {
    console.log('\nMissing tokens:', Object.keys(tokens));
    server.close(); process.exit(1);
  }

  // RBAC tests
  console.log('\n--- RBAC Tests ---');
  let pass = 0, fail = 0;
  const tests = [
    ['student /auth/me', 'GET', '/auth/me', tokens.student, 200],
    ['admin /auth/me', 'GET', '/auth/me', tokens.admin, 200],
    ['student BLOCKED /admin/students', 'GET', '/admin/students', tokens.student, 403],
    ['teacher BLOCKED /admin/students', 'GET', '/admin/students', tokens.teacher, 403],
    ['admin OK /admin/students', 'GET', '/admin/students', tokens.admin, 200],
    ['student OK /doubts/me', 'GET', '/doubts/me', tokens.student, 200],
    ['teacher BLOCKED /doubts/me', 'GET', '/doubts/me', tokens.teacher, 403],
    ['no-token /auth/me', 'GET', '/auth/me', null, 401],
  ];

  for (const [label, method, path, token, expected] of tests) {
    const r = await req(method, path, null, token);
    const ok = r.status === expected;
    console.log(ok ? 'PASS' : 'FAIL', label, r.status, 'want', expected);
    ok ? pass++ : fail++;
  }

  console.log('\nResult:', pass + '/' + (pass+fail), 'passed');
  server.close();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

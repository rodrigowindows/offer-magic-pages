/**
 * Test Supabase Authentication
 * This script tests signup and login functionality
 */

const SUPABASE_URL = 'https://atwdkhlyrffbaugkaker.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs';

async function testSignup() {
  console.log('🧪 Testing Signup...\n');

  const testEmail = `test-${Date.now()}@mylocalinvest.com`;
  const testPassword = 'Test123456!';

  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'https://offer.mylocalinvest.com/admin'
      }
    })
  });

  console.log('Status:', response.status, response.statusText);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.status === 401) {
    console.log('\n❌ SIGNUP ESTÁ BLOQUEADO!');
    console.log('Possíveis causas:');
    console.log('1. Email confirmations estão habilitadas mas não há SMTP configurado');
    console.log('2. Signup está desabilitado no Supabase Dashboard');
    console.log('3. Há alguma política de segurança bloqueando');
    return false;
  } else if (response.status === 200 || response.status === 201) {
    console.log('\n✅ Signup funcionou!');
    console.log('Email de teste:', testEmail);
    console.log('Password:', testPassword);
    return true;
  }

  return false;
}

async function testLogin() {
  console.log('\n🧪 Testing Login...\n');

  const testEmail = 'admin@mylocalinvest.com';
  const testPassword = 'admin123';

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    })
  });

  console.log('Status:', response.status, response.statusText);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.status === 200) {
    console.log('\n✅ Login funcionou! Credenciais:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    return true;
  } else {
    console.log('\n⚠️ Login falhou com essas credenciais');
    return false;
  }
}

async function checkAuthSettings() {
  console.log('🧪 Checking Auth Settings...\n');

  const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  console.log('Status:', response.status, response.statusText);
  const data = await response.json();
  console.log('Settings:', JSON.stringify(data, null, 2));
}

// Run tests
(async () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('     SUPABASE AUTHENTICATION TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  await checkAuthSettings();
  console.log('\n───────────────────────────────────────────────────────\n');

  const signupWorked = await testSignup();
  console.log('\n───────────────────────────────────────────────────────\n');

  const loginWorked = await testLogin();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('SUMMARY:');
  console.log('Signup:', signupWorked ? '✅ Working' : '❌ Not Working');
  console.log('Login:', loginWorked ? '✅ Working' : '⚠️ Failed (try other credentials)');
  console.log('═══════════════════════════════════════════════════════');
})();

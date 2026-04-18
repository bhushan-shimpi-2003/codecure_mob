/**
 * Fix the trigger function to handle role safely, then create test users
 * Run: node src/fix-trigger.js
 */
const supabase = require('./config/supabaseClient');

async function main() {
  console.log('🔧 Fixing trigger via direct SQL...\n');

  // Drop and recreate the trigger function with safe role handling
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, name, email, role)
        VALUES (
          new.id,
          COALESCE(new.raw_user_meta_data->>'name', 'New User'),
          new.email,
          'student'::user_role
        );
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  });

  if (error) {
    console.log('⚠️  RPC not available, trying alternative fix...');
    console.log('Error:', error.message);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:\n');
    console.log(`
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    new.email,
    'student'::user_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('\n⬆️  After running the SQL above, re-run: node src/test-rbac.js\n');
  } else {
    console.log('✅ Trigger function updated!');
  }

  // Try creating a test user to verify
  console.log('\n🧪 Testing user creation...');
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: 'quicktest@test.com',
    password: 'Test@12345',
    email_confirm: true,
    user_metadata: { name: 'Quick Test' },
  });

  if (userError) {
    console.log('❌ Still failing:', userError.message);
    console.log('\n👉 The trigger function needs to be fixed. Run this SQL in Supabase Dashboard → SQL Editor:');
    console.log(`
-- FIX: Replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    new.email,
    'student'::user_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
  } else {
    console.log('✅ User created successfully! ID:', userData.user.id);
    // Cleanup
    await supabase.auth.admin.deleteUser(userData.user.id);
    console.log('🧹 Test user cleaned up');
  }
}

main().catch(console.error);

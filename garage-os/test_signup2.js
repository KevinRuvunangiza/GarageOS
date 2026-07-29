import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bdqgyrgqkppuhlakqbgp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcWd5cmdxa3BwdWhsYWtxYmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNDUxOTIsImV4cCI6MjEwMDcyMTE5Mn0.9z_I16fyBBjn_x8w0qqc6w_B-icQq6fLFXz5CFLxobM'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignup() {
  console.log('Attempting signup without metadata...');
  const { data, error } = await supabase.auth.signUp({
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
    // NO metadata
  });

  if (error) {
    console.error('Signup Error:', error);
  } else {
    console.log('Signup Success:', data);
  }
}

testSignup();

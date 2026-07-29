const url = 'https://bdqgyrgqkppuhlakqbgp.supabase.co/auth/v1/signup';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcWd5cmdxa3BwdWhsYWtxYmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNDUxOTIsImV4cCI6MjEwMDcyMTE5Mn0.9z_I16fyBBjn_x8w0qqc6w_B-icQq6fLFXz5CFLxobM';

async function test() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'test' + Date.now() + '@example.com',
      password: 'password123'
    })
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
}
test();

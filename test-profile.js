async function test() {
  try {
    console.log('Registering user...');
    const registerRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${Date.now()}@test.com`,
        password: 'password123',
        fullName: 'Test User',
        role: 'patient',
        hospitalId: 1,
        phone: '1234567890',
        dob: '1995-01-01',
        abhaId: 'ABHA123'
      })
    });
    
    console.log('Register Response:', registerRes.status);
    const regData = await registerRes.json();
    const token = regData.data?.token;
    console.log('Got token:', token ? 'yes' : 'no');
    
    console.log('Fetching profile...');
    const profileRes = await fetch('http://localhost:5000/api/patients/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Profile Response:', profileRes.status);
    const profData = await profileRes.json();
    console.log('Profile Data:', profData);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

test();

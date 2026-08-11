async function test() {
  try {
    console.log('Registering user...');
    const registerRes = await fetch('http://127.0.0.1:5001/api/auth/register', {
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
    if (!token) throw new Error('No token');
    
    console.log('Booking appointment...');
    const bookRes = await fetch('http://127.0.0.1:5001/api/patients/appointments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        doctorId: "4",
        bookingType: "self",
        patientName: "Test User"
      })
    });
    
    console.log('Book Response:', bookRes.status);
    const bookData = await bookRes.json();
    console.log('Book Data:', bookData);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

test();

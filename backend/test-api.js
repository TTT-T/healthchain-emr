// Test script for API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing EMR API Endpoints...\n');

  try {
    // 1. Test Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // 2. Test Authentication - Login
    console.log('2. Testing Authentication - Login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'testuser',
      password: 'testpassword'
    });
    console.log('✅ Login successful:', {
      status: loginResponse.status,
      user: loginResponse.data.data?.user?.username,
      token: loginResponse.data.data?.token ? 'Present' : 'Missing'
    });
    const token = loginResponse.data.data?.token;
    console.log('');

    if (token) {
      // 3. Test Patient List
      console.log('3. Testing Patient List...');
      const patientsResponse = await axios.get(`${BASE_URL}/api/medical/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Patients List:', {
        status: patientsResponse.status,
        count: patientsResponse.data.data?.length || 0,
        patients: patientsResponse.data.data?.map(p => ({
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          hospitalNumber: p.hospitalNumber
        }))
      });
      console.log('');

      // 4. Test Create Patient
      console.log('4. Testing Create Patient...');
      const newPatient = {
        hospitalNumber: `HN${Date.now()}`,
        firstName: 'Test',
        lastName: 'Patient',
        gender: 'male',
        dateOfBirth: '1990-01-01',
        phone: '0812345678',
        email: `test${Date.now()}@example.com`
      };
      
      const createResponse = await axios.post(`${BASE_URL}/api/medical/patients`, newPatient, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Patient Created:', {
        status: createResponse.status,
        patient: {
          id: createResponse.data.data?.id,
          name: `${createResponse.data.data?.firstName} ${createResponse.data.data?.lastName}`,
          hospitalNumber: createResponse.data.data?.hospitalNumber
        }
      });
      console.log('');

      // 5. Test Get Patient
      if (createResponse.data.data?.id) {
        console.log('5. Testing Get Patient...');
        const getPatientResponse = await axios.get(`${BASE_URL}/api/medical/patients/${createResponse.data.data.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Get Patient:', {
          status: getPatientResponse.status,
          patient: {
            id: getPatientResponse.data.data?.id,
            name: `${getPatientResponse.data.data?.firstName} ${getPatientResponse.data.data?.lastName}`,
            hospitalNumber: getPatientResponse.data.data?.hospitalNumber
          }
        });
        console.log('');
      }
    }

    console.log('🎉 All API tests completed successfully!');

  } catch (error) {
    console.error('❌ API Test Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run the test
testAPI();

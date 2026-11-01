// Simple test script to verify API endpoints
// Run with: node test-api.js

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing Portfolio API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check:', health.data);
    console.log('');

    // Test 2: Login
    console.log('2. Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'sanketbhujbal205@gmail.com',
      password: 'Sanket@123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    console.log('');

    // Test 3: Get projects (public)
    console.log('3. Testing GET /api/projects (public)...');
    const projects = await axios.get(`${API_URL}/projects`);
    console.log(`✅ Found ${projects.data.length} projects`);
    console.log('');

    // Test 4: Create project (protected)
    console.log('4. Testing POST /api/projects (protected)...');
    const newProject = {
      title: 'Test Project',
      description: 'This is a test project created by the test script',
      techStack: ['Node.js', 'Express', 'MongoDB'],
      githubLink: 'https://github.com/test/repo',
      liveDemoLink: 'https://test-demo.com',
      year: 2024,
      featured: false
    };

    const createResponse = await axios.post(
      `${API_URL}/projects`,
      newProject,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Project created:', createResponse.data.title);
    const createdProjectId = createResponse.data._id;
    console.log('   Project ID:', createdProjectId);
    console.log('');

    // Test 5: Update project (protected)
    console.log('5. Testing PUT /api/projects/:id (protected)...');
    const updateResponse = await axios.put(
      `${API_URL}/projects/${createdProjectId}`,
      { title: 'Test Project (Updated)' },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    console.log('✅ Project updated:', updateResponse.data.title);
    console.log('');

    // Test 6: Delete project (protected)
    console.log('6. Testing DELETE /api/projects/:id (protected)...');
    await axios.delete(
      `${API_URL}/projects/${createdProjectId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    console.log('✅ Project deleted successfully');
    console.log('');

    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Make sure the backend server is running on port 5000');
      console.error('   Run: cd backend && npm run dev');
    }
  }
}

testAPI();

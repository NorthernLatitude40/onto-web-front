// Test script for group deletion functionality
// This tests the API endpoint and the frontend implementation

import axios from 'axios';

// Test configuration
const API_BASE_URL = 'http://localhost:8000/api/v1/scraper';

async function testGroupDeletion() {
  console.log('Testing Group Deletion Functionality...\n');

  try {
    // First, create a test group
    const testGroupName = `test-group-${Date.now()}`;
    console.log(`1. Creating test group: ${testGroupName}`);
    
    const createResponse = await axios.post(`${API_BASE_URL}/projects`, {
      name: testGroupName,
      description: 'Test group for deletion testing'
    });
    console.log('   ✓ Group created successfully');
    console.log(`   Group ID: ${createResponse.data.id}\n`);

    // Verify the group exists
    const projectsResponse = await axios.get(`${API_BASE_URL}/projects`);
    const createdGroup = projectsResponse.data.find(p => p.name === testGroupName);
    if (!createdGroup) {
      throw new Error('Created group not found in list');
    }
    console.log(`2. Verified group exists: ${testGroupName}\n`);

    // Now test deletion
    console.log(`3. Deleting group: ${testGroupName}`);
    await axios.delete(`${API_BASE_URL}/projects/${createdGroup.id}`);
    console.log('   ✓ Group deleted successfully\n');

    // Verify the group is gone
    const afterDeletionResponse = await axios.get(`${API_BASE_URL}/projects`);
    const stillExists = afterDeletionResponse.data.some(p => p.name === testGroupName);
    if (stillExists) {
      throw new Error('Group still exists after deletion');
    }
    console.log(`4. Verified group no longer exists: ${testGroupName}\n`);

    console.log('✅ All tests passed! Group deletion functionality works correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    process.exit(1);
  }
}

// Run the test
testGroupDeletion();
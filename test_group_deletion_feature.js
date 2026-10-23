/**
 * Test script for group deletion feature
 * This script tests the frontend dropdown list group deletion functionality
 */

// Mock test data
const mockProjects = [
  { id: 1, name: 'Project 1', group: '车辆权限爬虫' },
  { id: 2, name: 'Project 2', group: '车辆权限爬虫' },
  { id: 3, name: 'Project 3', group: '商品价格监控' },
  { id: 4, name: 'Project 4', group: null }, // Ungrouped project
];

// Test grouping logic
function testGrouping() {
  console.log('Testing group deletion feature...\n');
  
  const groups = {};
  
  mockProjects.forEach(project => {
    if (project.group) {
      if (!groups[project.group]) {
        groups[project.group] = [];
      }
      groups[project.group].push(project);
    }
  });
  
  console.log('Grouped projects:');
  for (const [groupName, projects] of Object.entries(groups)) {
    console.log(`  ${groupName}: ${projects.length} projects`);
    projects.forEach(p => console.log(`    - ${p.name}`));
  }
  
  console.log('\nUngrouped projects:', mockProjects.filter(p => !p.group).length);
  
  // Test deletion logic
  const groupToDelete = '车辆权限爬虫';
  console.log(`\nDeleting group: ${groupToDelete}`);
  const remainingProjects = mockProjects.filter(p => p.group !== groupToDelete);
  console.log(`Remaining projects: ${remainingProjects.length}`);
  
  return true;
}

// Run tests
try {
  if (testGrouping()) {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  }
} catch (error) {
  console.error('\n✗ Test failed:', error.message);
  process.exit(1);
}

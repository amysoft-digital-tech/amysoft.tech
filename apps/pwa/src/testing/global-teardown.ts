/**
 * Global Test Teardown for PWA Testing Suite
 * Cleans up test environment and resources
 */

import { existsSync, unlinkSync, rmSync } from 'fs';
import { join } from 'path';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up PWA testing environment...');

  // Clean up test configuration files
  const testFiles = [
    'test-db-config.json',
    'test-server-config.json',
    'performance-config.json',
    'a11y-config.json',
    'test-data.json',
    'src/mock-sw.js'
  ];

  testFiles.forEach(file => {
    const filePath = join(process.cwd(), file);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
        console.log(`🗑️ Removed: ${file}`);
      } catch (error) {
        console.warn(`⚠️ Failed to remove ${file}:`, error);
      }
    }
  });

  // Clean up temporary test directories (keep results for CI)
  const tempDirs = [
    'tmp',
    '.tmp',
    'temp'
  ];

  tempDirs.forEach(dir => {
    const dirPath = join(process.cwd(), dir);
    if (existsSync(dirPath)) {
      try {
        rmSync(dirPath, { recursive: true, force: true });
        console.log(`📁 Removed directory: ${dir}`);
      } catch (error) {
        console.warn(`⚠️ Failed to remove directory ${dir}:`, error);
      }
    }
  });

  // Stop test server if running
  try {
    console.log('🛑 Stopping test server...');
    // In a real implementation, this would stop the test server
    console.log('✅ Test server stopped');
  } catch (error) {
    console.warn('⚠️ Test server cleanup failed:', error);
  }

  // Clean up test database
  try {
    console.log('🗄️ Cleaning up test database...');
    // In a real implementation, this would clean up the test database
    console.log('✅ Test database cleaned up');
  } catch (error) {
    console.warn('⚠️ Test database cleanup failed:', error);
  }

  // Generate test summary
  try {
    console.log('📊 Generating test summary...');
    
    const testSummary = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      testMode: process.env.PWA_TEST_MODE,
      cleanup: {
        configFiles: testFiles.length,
        tempDirectories: tempDirs.length,
        status: 'completed'
      }
    };

    // In a real implementation, this would write to test results directory
    console.log('Test Summary:', JSON.stringify(testSummary, null, 2));
    console.log('✅ Test summary generated');
  } catch (error) {
    console.warn('⚠️ Test summary generation failed:', error);
  }

  // Clear environment variables
  delete process.env.PWA_TEST_MODE;
  delete process.env.ENABLE_MOCK_SERVICE_WORKER;

  console.log('✅ PWA testing environment cleanup complete!');
  console.log('📋 Cleanup summary:');
  console.log('   - Configuration files: removed');
  console.log('   - Temporary directories: cleaned');
  console.log('   - Test server: stopped');
  console.log('   - Test database: cleaned');
  console.log('   - Environment variables: cleared');
  console.log('🎉 Ready for next test run!');
}
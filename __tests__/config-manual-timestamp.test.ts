// Test the manual timestamp entry configuration option
import * as dotenv from 'dotenv';

// Store original env
const originalEnv = { ...process.env };

describe('Manual Timestamp Entry Configuration', () => {
  beforeEach(() => {
    // Reset env for each test
    process.env = { ...originalEnv };
    
    // Clear module cache to ensure config is reloaded
    jest.resetModules();
  });
  
  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });
  
  test('should set manualTimestampEntry based on environment variable', () => {
    // Set environment variable explicitly for this test
    process.env.MANUAL_TIMESTAMP_ENTRY = 'true';
    
    // Import the config
    const { config } = require('../src/config');
    
    // Check value
    expect(config.manualTimestampEntry).toBe(true);
    
    // Now change it to false
    process.env.MANUAL_TIMESTAMP_ENTRY = 'false';
    jest.resetModules();
    const { config: updatedConfig } = require('../src/config');
    expect(updatedConfig.manualTimestampEntry).toBe(false);
  });
});

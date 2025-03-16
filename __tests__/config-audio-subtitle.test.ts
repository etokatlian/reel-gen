import * as dotenv from 'dotenv';

// Store original env
const originalEnv = { ...process.env };

describe('Audio and Subtitle Removal Configuration', () => {
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
  
  test('should set removeAudio based on REMOVE_AUDIO env var', () => {
    // Set environment variable explicitly for this test
    process.env.REMOVE_AUDIO = 'true';
    
    // Import the config
    const { config } = require('../src/config');
    
    // Check value
    expect(config.removeAudio).toBe(true);
    
    // Now change it to false
    process.env.REMOVE_AUDIO = 'false';
    jest.resetModules();
    const { config: updatedConfig } = require('../src/config');
    expect(updatedConfig.removeAudio).toBe(false);
  });
  
  test('should set removeSubtitles based on REMOVE_SUBTITLES env var', () => {
    // Set environment variable explicitly
    process.env.REMOVE_SUBTITLES = 'true';
    
    // Import the config
    const { config } = require('../src/config');
    
    // Check value
    expect(config.removeSubtitles).toBe(true);
    
    // Now change it to false
    process.env.REMOVE_SUBTITLES = 'false';
    jest.resetModules();
    const { config: updatedConfig } = require('../src/config');
    expect(updatedConfig.removeSubtitles).toBe(false);
  });
  
  test('should set both options when both env vars are true', () => {
    // Set environment variables
    process.env.REMOVE_AUDIO = 'true';
    process.env.REMOVE_SUBTITLES = 'true';
    
    // Import the config
    const { config } = require('../src/config');
    
    // Check values
    expect(config.removeAudio).toBe(true);
    expect(config.removeSubtitles).toBe(true);
  });
  
  test('should handle non-boolean string values', () => {
    // Set environment variables with invalid values
    process.env.REMOVE_AUDIO = 'yes';  // Not 'true'
    process.env.REMOVE_SUBTITLES = '1'; // Not 'true'
    
    // Import the config
    const { config } = require('../src/config');
    
    // Check values - should be false for non-'true' string values
    expect(config.removeAudio).toBe(false);
    expect(config.removeSubtitles).toBe(false);
  });
});

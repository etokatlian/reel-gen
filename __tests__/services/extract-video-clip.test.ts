import { extractVideoClips } from '../../src/services/youtube-extraction-service';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { config } from '../../src/config';
import { ProcessedVideo } from '../../src/types/youtube-transcript';

// Mock modules and config
jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    on: jest.fn(),
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    kill: jest.fn()
  }),
  exec: jest.fn((command, callback) => {
    if (callback) {
      callback(null, 'https://example.com/video.mp4', '');
    }
    return {} as any;
  })
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// Mock config
jest.mock('../../src/config', () => ({
  config: {
    removeAudio: false,
    removeSubtitles: false,
    // Adding other required config properties
    clipDuration: 5,
    extractionQuality: 'medium',
  }
}));

interface MockProcess {
  on: jest.Mock;
  stdout: { on: jest.Mock };
  stderr: { on: jest.Mock };
  kill: jest.Mock;
}

describe('Extract Video Clips with Audio/Subtitle Options', () => {
  // Sample video data
  const sampleVideo: ProcessedVideo = {
    videoId: 'sample123',
    url: 'https://www.youtube.com/watch?v=sample123',
    transcript: 'Sample transcript text',
    outputDirectory: '/path/to/output'
  };
  
  // Sample clip ranges
  const sampleClipRanges = [
    { start: 10, end: 15 },
    { start: 30, end: 35 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the spawn mock with proper typing
    const mockProcess: MockProcess = {
      on: jest.fn().mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockProcess;
      }),
      stdout: { on: jest.fn() },
      stderr: { 
        on: jest.fn().mockImplementation(() => {
          return mockProcess.stderr;
        }) 
      },
      kill: jest.fn()
    };
    
    (childProcess.spawn as jest.Mock).mockReturnValue(mockProcess);
    
    // Reset config for each test
    config.removeAudio = false;
    config.removeSubtitles = false;
  });
  
  test('should pass correct FFmpeg flags when removeAudio is true', async () => {
    // Set config for this test
    config.removeAudio = true;
    
    // Call the function
    await extractVideoClips(sampleVideo, sampleClipRanges);
    
    // There should be multiple spawn calls (one for each clip)
    expect(childProcess.spawn).toHaveBeenCalledTimes(sampleClipRanges.length);
    
    // Check args for each call
    for (let i = 0; i < sampleClipRanges.length; i++) {
      const ffmpegArgs = (childProcess.spawn as jest.Mock).mock.calls[i][1];
      
      // Should include -an flag for audio removal
      expect(ffmpegArgs).toContain('-an');
      
      // Should not include -c:a parameter when audio is removed
      const audioCodecIndex = ffmpegArgs.indexOf('-c:a');
      expect(audioCodecIndex).toBe(-1);
    }
  });
  
  test('should pass correct FFmpeg flags when removeSubtitles is true', async () => {
    // Set config for this test
    config.removeSubtitles = true;
    
    // Call the function
    await extractVideoClips(sampleVideo, sampleClipRanges);
    
    // Check args for each call
    for (let i = 0; i < sampleClipRanges.length; i++) {
      const ffmpegArgs = (childProcess.spawn as jest.Mock).mock.calls[i][1];
      
      // Should include -sn flag for subtitle removal
      expect(ffmpegArgs).toContain('-sn');
    }
  });
  
  test('should pass both flags when both options are true', async () => {
    // Set config for this test
    config.removeAudio = true;
    config.removeSubtitles = true;
    
    // Call the function
    await extractVideoClips(sampleVideo, sampleClipRanges);
    
    // Check args for each call
    for (let i = 0; i < sampleClipRanges.length; i++) {
      const ffmpegArgs = (childProcess.spawn as jest.Mock).mock.calls[i][1];
      
      // Should include both flags
      expect(ffmpegArgs).toContain('-an');
      expect(ffmpegArgs).toContain('-sn');
    }
  });
  
  test('should not include either flag when both options are false', async () => {
    // Call the function with default config (both false)
    await extractVideoClips(sampleVideo, sampleClipRanges);
    
    // Check args for each call
    for (let i = 0; i < sampleClipRanges.length; i++) {
      const ffmpegArgs = (childProcess.spawn as jest.Mock).mock.calls[i][1];
      
      // Should not include either flag
      expect(ffmpegArgs).not.toContain('-an');
      expect(ffmpegArgs).not.toContain('-sn');
      
      // Should include audio codec configuration
      const audioCodecIndex = ffmpegArgs.indexOf('-c:a');
      expect(audioCodecIndex).not.toBe(-1);
      expect(ffmpegArgs[audioCodecIndex + 1]).toBe('aac');
    }
  });
});

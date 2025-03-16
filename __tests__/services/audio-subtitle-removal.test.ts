import { processVideoClip } from '../../src/services/youtube-extraction-service';
import * as childProcess from 'child_process';
import * as path from 'path';

// Mock modules
jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    on: jest.fn(),
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    kill: jest.fn()
  })
}));

interface MockProcess {
  on: jest.Mock;
  stdout: { on: jest.Mock };
  stderr: { on: jest.Mock };
  kill: jest.Mock;
}

describe('Audio and Subtitle Removal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mock implementation for spawn and event handlers
    const mockProcess: MockProcess = {
      on: jest.fn().mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          // Successfully complete the process
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
  });

  describe('processVideoClip', () => {
    const inputPath = '/path/to/input.mp4';
    const outputPath = '/path/to/output.mp4';
    
    test('should include -an flag when removeAudio is true', async () => {
      await processVideoClip(inputPath, outputPath, true, false);
      
      expect(childProcess.spawn).toHaveBeenCalled();
      const ffmpegArgs = (childProcess.spawn as jest.Mock).mock.calls[0][1];
      
      // Check for the -an flag
      expect(ffmpegArgs).toContain('-an');
      // Should not have -sn flag
      expect(ffmpegArgs).not.toContain('-sn');
    });
    
    test('should include -sn flag when removeSubtitles is true', async () => {
      await processVideoClip(inputPath, outputPath, false, true);
      
      expect(childProcess.spawn).toHaveBeenCalled();
      const ffmpegArgs = (childProcess.spawn as jest.Mock).mock.calls[0][1];
      
      // Check for the -sn flag
      expect(ffmpegArgs).toContain('-sn');
      // Should not have -an flag
      expect(ffmpegArgs).not.toContain('-an');
    });
    
    test('should include both -an and -sn flags when both options are true', async () => {
      await processVideoClip(inputPath, outputPath, true, true);
      
      expect(childProcess.spawn).toHaveBeenCalled();
      const ffmpegArgs = (childProcess.spawn as jest.Mock).mock.calls[0][1];
      
      // Check for both flags
      expect(ffmpegArgs).toContain('-an');
      expect(ffmpegArgs).toContain('-sn');
    });
    
    test('should include neither -an nor -sn flags when both options are false', async () => {
      await processVideoClip(inputPath, outputPath, false, false);
      
      expect(childProcess.spawn).toHaveBeenCalled();
      const ffmpegArgs = (childProcess.spawn as jest.Mock).mock.calls[0][1];
      
      // Check that neither flag is present
      expect(ffmpegArgs).not.toContain('-an');
      expect(ffmpegArgs).not.toContain('-sn');
    });
    
    test('should handle process completion successfully', async () => {
      const promise = processVideoClip(inputPath, outputPath, true, true);
      
      // The promise should resolve without throwing
      await expect(promise).resolves.not.toThrow();
    });
  });
});

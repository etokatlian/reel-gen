import { checkFFmpegAvailability } from '../../src/services/video-service';
import * as childProcess from 'child_process';

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn()
}));

describe('Video Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkFFmpegAvailability', () => {
    test('should return true when FFmpeg is available', async () => {
      // Mock successful execution
      jest.spyOn(childProcess, 'exec').mockImplementation((command, callback: any) => {
        callback(null, 'ffmpeg version 4.3.1', '');
        return {} as any;
      });
      
      const result = await checkFFmpegAvailability();
      
      expect(childProcess.exec).toHaveBeenCalledWith('ffmpeg -version', expect.any(Function));
      expect(result).toBe(true);
    });

    test('should return false when FFmpeg is not available', async () => {
      // Mock failed execution
      jest.spyOn(childProcess, 'exec').mockImplementation((command, callback: any) => {
        callback(new Error('Command not found'), '', 'ffmpeg: command not found');
        return {} as any;
      });
      
      const result = await checkFFmpegAvailability();
      
      expect(childProcess.exec).toHaveBeenCalledWith('ffmpeg -version', expect.any(Function));
      expect(result).toBe(false);
    });
  });
});
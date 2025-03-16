import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('child_process', () => ({
  exec: jest.fn(),
  spawn: jest.fn()
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((...paths) => paths.join('/')),
  dirname: jest.fn(path => path.split('/').slice(0, -1).join('/') || '/')
}));

// Mock config module
jest.mock('../../src/config', () => ({
  config: {
    videoDuration: 15,
    outputDirectory: 'output'
  }
}));

// Import after mocks are set up
import { createShortVideo, checkFFmpegAvailability } from '../../src/services/video-service';
import { ProcessedVideo } from '../../src/types/youtube-transcript';

describe('Video Service', () => {
  // Mock ProcessedVideo for tests - with non-optional imagePaths
  const mockVideoData: ProcessedVideo & { imagePaths: string[] } = {
    videoId: 'test123',
    url: 'https://youtube.com/watch?v=test123',
    transcript: 'Test transcript',
    imagePaths: [
      '/path/to/image1.png',
      '/path/to/image2.png',
      '/path/to/image3.png'
    ],
    outputDirectory: '/output/dir'
  };

  // Expected output path
  const expectedOutputPath = '/output/dir/video/test123_short.mp4';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks for filesystem operations
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    
    // Mock successful process execution
    const mockProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      kill: jest.fn()
    };
    
    // Setup on method to call the 'close' handler with success code 0
    mockProcess.on.mockImplementation((event, handler) => {
      if (event === 'close') {
        setTimeout(() => handler(0), 10); // Call with success code after short delay
      }
      return mockProcess;
    });
    
    jest.spyOn(childProcess, 'spawn').mockReturnValue(mockProcess as any);
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

  describe('createShortVideo', () => {
    test('should throw error if no images are available', async () => {
      // Create data with empty images array
      const videoDataNoImages: ProcessedVideo = { 
        ...mockVideoData, 
        imagePaths: [] 
      };
      
      await expect(createShortVideo(videoDataNoImages))
        .rejects
        .toThrow('No images available for video creation');
    });

    test('should create the output directory if it does not exist', async () => {
      // Mock directory does not exist
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      
      await createShortVideo(mockVideoData);
      
      // Should create video directory
      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    test('should call FFmpeg with correct arguments for video creation', async () => {
      // Call the function
      await createShortVideo(mockVideoData);
      
      // Check that spawn was called with ffmpeg and arguments
      expect(childProcess.spawn).toHaveBeenCalledWith(
        'ffmpeg',
        expect.arrayContaining([
          '-y',
          // Should contain input args for each image
          '-loop', '1', '-t', expect.any(String), '-i', mockVideoData.imagePaths[0],
          '-loop', '1', '-t', expect.any(String), '-i', mockVideoData.imagePaths[1],
          '-loop', '1', '-t', expect.any(String), '-i', mockVideoData.imagePaths[2],
          // Should have concat filter
          '-filter_complex', expect.stringContaining('concat=n=3'),
          // Should include output args
          '-c:v', 'libx264',
          expectedOutputPath
        ])
      );
    });

    test('should save command for debugging', async () => {
      await createShortVideo(mockVideoData);
      
      // Check that command was saved to file
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test123_ffmpeg_command.txt'),
        expect.any(String)
      );
    });

    test('should return path to created video on success', async () => {
      const result = await createShortVideo(mockVideoData);
      
      expect(result).toBe(expectedOutputPath);
    });

    test('should throw error if FFmpeg process fails', async () => {
      // Mock process that fails
      const mockFailProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn()
      };
      
      // Setup on method to call the 'close' handler with error code 1
      mockFailProcess.on.mockImplementation((event, handler) => {
        if (event === 'close') {
          setTimeout(() => handler(1), 10); // Call with error code after short delay
        }
        return mockFailProcess;
      });
      
      jest.spyOn(childProcess, 'spawn').mockReturnValue(mockFailProcess as any);
      
      await expect(createShortVideo(mockVideoData))
        .rejects
        .toThrow('Failed to create video');
    });
  });
});
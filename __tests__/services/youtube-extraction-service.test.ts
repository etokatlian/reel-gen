import { 
  extractKeyTimestamps,
  extractKeyClipRanges,
  checkYtDlpAvailability,
  checkFFmpegAvailability
} from '../../src/services/youtube-extraction-service';
import * as childProcess from 'child_process';

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
  spawn: jest.fn()
}));

describe('YouTube Extraction Service', () => {
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

  describe('checkYtDlpAvailability', () => {
    test('should return true when yt-dlp is available', async () => {
      // Mock successful execution
      jest.spyOn(childProcess, 'exec').mockImplementation((command, callback: any) => {
        callback(null, 'yt-dlp 2023.03.04', '');
        return {} as any;
      });
      
      const result = await checkYtDlpAvailability();
      
      expect(childProcess.exec).toHaveBeenCalledWith('yt-dlp --version', expect.any(Function));
      expect(result).toBe(true);
    });

    test('should return false when yt-dlp is not available', async () => {
      // Mock failed execution
      jest.spyOn(childProcess, 'exec').mockImplementation((command, callback: any) => {
        callback(new Error('Command not found'), '', 'yt-dlp: command not found');
        return {} as any;
      });
      
      const result = await checkYtDlpAvailability();
      
      expect(childProcess.exec).toHaveBeenCalledWith('yt-dlp --version', expect.any(Function));
      expect(result).toBe(false);
    });
  });

  describe('extractKeyTimestamps', () => {
    test('should extract timestamps from transcript segments', () => {
      // Mock transcript segments
      const segments = [
        { text: 'Segment 1', offset: 10, duration: 5 },
        { text: 'Segment 2', offset: 20, duration: 5 },
        { text: 'Segment 3', offset: 30, duration: 5 },
        { text: 'Segment 4', offset: 40, duration: 5 },
        { text: 'Segment 5', offset: 50, duration: 5 },
        { text: 'Segment 6', offset: 60, duration: 5 }
      ];
      
      const result = extractKeyTimestamps(segments, 3);
      
      // Should get 3 timestamps
      expect(result.length).toBe(3);
      // Values may vary based on algorithm implementation, but should be timestamps from segments
      expect(segments.some(s => s.offset === result[0])).toBeTruthy();
      expect(segments.some(s => s.offset === result[1])).toBeTruthy();
      expect(segments.some(s => s.offset === result[2])).toBeTruthy();
    });
    
    test('should handle fewer segments than requested timestamps', () => {
      // Mock transcript segments (only 2 segments)
      const segments = [
        { text: 'Segment 1', offset: 10, duration: 5 },
        { text: 'Segment 2', offset: 20, duration: 5 }
      ];
      
      // It might duplicate timestamps to reach the desired count
      const result = extractKeyTimestamps(segments, 3);
      
      // The number of unique timestamps should match the segments length
      const uniqueTimestamps = new Set(result);
      // Should only have as many unique timestamps as there are segments
      expect(uniqueTimestamps.size).toBeLessThanOrEqual(segments.length);
      
      // All timestamps should be valid offsets from the segments
      result.forEach(timestamp => {
        expect(segments.some(s => s.offset === timestamp)).toBeTruthy();
      });
    });

    test('should throw error if no segments provided', () => {
      expect(() => extractKeyTimestamps([], 3)).toThrow('No transcript segments provided');
    });
  });

  describe('extractKeyClipRanges', () => {
    test('should extract clip ranges from transcript segments', () => {
      // Mock transcript segments
      const segments = [
        { text: 'Segment 1', offset: 10, duration: 5 },
        { text: 'Segment 2', offset: 20, duration: 5 },
        { text: 'Segment 3', offset: 30, duration: 5 },
        { text: 'Segment 4', offset: 40, duration: 5 },
        { text: 'Segment 5', offset: 50, duration: 5 },
        { text: 'Segment 6', offset: 60, duration: 5 }
      ];
      
      const result = extractKeyClipRanges(segments, 3, 5);
      
      // Should get 3 clips
      expect(result.length).toBe(3);
      
      // Each clip should have start and end values
      result.forEach(clip => {
        expect(clip).toHaveProperty('start');
        expect(clip).toHaveProperty('end');
        expect(clip.end).toBeGreaterThan(clip.start);
        
        // Start should match one of the segment offsets
        expect(segments.some(s => s.offset === clip.start)).toBeTruthy();
      });
    });

    test('should handle clip durations that exceed segment duration', () => {
      // Mock transcript segments with short durations
      const segments = [
        { text: 'Segment 1', offset: 10, duration: 2 },
        { text: 'Segment 2', offset: 20, duration: 2 },
        { text: 'Segment 3', offset: 30, duration: 2 }
      ];
      
      const result = extractKeyClipRanges(segments, 2, 5);
      
      // Should get 2 clips
      expect(result.length).toBe(2);
      
      // Each clip's duration should be limited by the segment duration
      result.forEach(clip => {
        const duration = clip.end - clip.start;
        expect(duration).toBeLessThanOrEqual(5); // Requested duration
        
        // Find the matching segment
        const segment = segments.find(s => s.offset === clip.start);
        expect(segment).toBeDefined();
        
        if (segment) {
          // Clip duration should not exceed segment duration
          expect(duration).toBeLessThanOrEqual(segment.duration);
        }
      });
    });

    test('should throw error if no segments provided', () => {
      expect(() => extractKeyClipRanges([], 3, 5)).toThrow('No transcript segments provided');
    });
  });
});
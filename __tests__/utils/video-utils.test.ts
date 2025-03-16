import { extractVideoId, formatYouTubeUrl } from '../../src/utils/video-utils';

describe('Video Utilities', () => {
  describe('extractVideoId', () => {
    test('should extract video ID from standard YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from shortened YouTube URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from embed YouTube URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    test('should return null for invalid YouTube URL', () => {
      const url = 'https://www.example.com/video';
      expect(extractVideoId(url)).toBeNull();
    });

    test('should return null for malformed YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?id=dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBeNull();
    });
  });

  describe('formatYouTubeUrl', () => {
    test('should format a valid YouTube URL from a video ID', () => {
      const videoId = 'dQw4w9WgXcQ';
      expect(formatYouTubeUrl(videoId)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });
  });
});

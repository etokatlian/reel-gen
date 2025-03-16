import { fetchTranscript } from '../../src/services/transcript-service';
import { YoutubeTranscript } from 'youtube-transcript';

// Mock the youtube-transcript module
jest.mock('youtube-transcript', () => ({
  YoutubeTranscript: {
    fetchTranscript: jest.fn()
  }
}));

describe('Transcript Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchTranscript', () => {
    test('should fetch and join transcript segments', async () => {
      // Mock transcript response
      const mockTranscriptResponse = [
        { text: 'This is the first segment', duration: 5, offset: 0 },
        { text: 'This is the second segment', duration: 5, offset: 5 },
        { text: 'This is the third segment', duration: 5, offset: 10 }
      ];
      
      // Setup the mock to return our test data
      jest.spyOn(YoutubeTranscript, 'fetchTranscript').mockResolvedValue(mockTranscriptResponse);
      
      const videoId = 'test-video-id';
      const result = await fetchTranscript(videoId);
      
      // Verify the YouTube API was called correctly
      expect(YoutubeTranscript.fetchTranscript).toHaveBeenCalledWith(videoId);
      
      // Verify the transcript segments were joined correctly
      const expectedText = 'This is the first segment This is the second segment This is the third segment';
      expect(result).toBe(expectedText);
    });

    test('should handle errors when fetching transcript', async () => {
      // Setup the mock to throw an error
      const errorMessage = 'Failed to fetch transcript';
      jest.spyOn(YoutubeTranscript, 'fetchTranscript').mockRejectedValue(new Error(errorMessage));
      
      const videoId = 'invalid-video-id';
      
      // Verify the error is properly propagated
      await expect(fetchTranscript(videoId)).rejects.toThrow(
        `Failed to fetch transcript for video ${videoId}`
      );
      
      expect(YoutubeTranscript.fetchTranscript).toHaveBeenCalledWith(videoId);
    });
  });
});

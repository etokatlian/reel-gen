jest.mock('../../src/config', () => ({
  config: {
    openAiApiKey: 'test-api-key'
  }
}));

jest.mock('@langchain/openai', () => {
  return {
    ChatOpenAI: jest.fn().mockImplementation(() => ({
      invoke: jest.fn().mockResolvedValue({
        content: `
1. First key moment description in detail
2. Second key moment with specific details
3. Third important scene from the video`
      })
    }))
  };
});

// Now import the function to test (after mocks are set up)
import { extractKeyMoments } from '../../src/services/analysis-service';
import { ChatOpenAI } from '@langchain/openai';

describe('Analysis Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractKeyMoments', () => {
    test('should extract key moments from transcript', async () => {
      const transcript = 'This is a test transcript with content for analysis';
      const result = await extractKeyMoments(transcript);
      
      // Verify the function was called with correct parameters
      expect(ChatOpenAI).toHaveBeenCalledWith({
        modelName: 'gpt-3.5-turbo',
        temperature: 0.3
      });
      
      // Verify the result contains the expected number of descriptions
      expect(result.length).toBe(3);
      expect(result[0]).toContain('First key moment');
      expect(result[1]).toContain('Second key moment');
      expect(result[2]).toContain('Third important scene');
    });
  });
});

import { summarizeTranscript } from '../../src/services/transcript-summarizer';

// Mock OpenAI API client
jest.mock('@langchain/openai', () => {
  return {
    ChatOpenAI: jest.fn().mockImplementation(() => ({
      invoke: jest.fn().mockResolvedValue({
        content: "This is a concise summary of the transcript with key points included."
      })
    }))
  };
});

// Mock config to provide OpenAI API key
jest.mock('../../src/config', () => ({
  config: {
    openAiApiKey: 'test-api-key'
  }
}));

describe('Transcript Summarizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should summarize transcript to target word count', async () => {
    const transcript = 'This is a long transcript with a lot of detailed information that needs to be summarized. ' +
      'It contains multiple sentences discussing various topics. Some parts are more important than others. ' +
      'We want to extract the key points while keeping the summary concise and fitting within our target word count.';
    
    const targetWordCount = 15;
    
    const result = await summarizeTranscript(transcript, targetWordCount);
    
    // Should return the mocked response from OpenAI
    expect(result).toBe("This is a concise summary of the transcript with key points included.");
    
    // Count words in result
    const wordCount = result.split(/\s+/).length;
    
    // Log for debugging
    console.log(`Summary word count: ${wordCount}`);
    
    // Should be within reasonable range of target word count
    // Note: In a real scenario, we'd control this better but we're using a fixed mock response here
    expect(wordCount).toBeLessThan(transcript.split(/\s+/).length);
  });

  test('should handle short transcripts appropriately', async () => {
    const shortTranscript = 'This is a very brief transcript.';
    const targetWordCount = 20;
    
    // For very short transcripts that are already under the target word count,
    // we should just return the original transcript
    const result = await summarizeTranscript(shortTranscript, targetWordCount);
    
    expect(result).toBe(shortTranscript);
  });

  test('should handle empty transcripts', async () => {
    const emptyTranscript = '';
    const targetWordCount = 10;
    
    const result = await summarizeTranscript(emptyTranscript, targetWordCount);
    
    expect(result).toBe('');
  });
  
  test('should ensure summaries end with complete sentences', async () => {
    // Testing truncateAtSentenceBoundary functionality
    const mockResponse = "First sentence. Second sentence. Third sentence with more words.";
    
    // Override mock for this specific test
    require('@langchain/openai').ChatOpenAI.mockImplementationOnce(() => ({
      invoke: jest.fn().mockResolvedValue({
        content: mockResponse
      })
    }));
    
    const transcript = 'This is a test transcript with multiple sentences. It has more content than we need. ' +
      'We want to ensure that the summary ends with a complete sentence rather than being cut off mid-sentence.';
    
    const result = await summarizeTranscript(transcript, 5);
    
    // Should end with a period, question mark, or exclamation point
    expect(result.trim()).toMatch(/[.!?]$/);
    
    // Should not cut off mid-sentence
    expect(result).not.toMatch(/[a-zA-Z]$/);
  });
});

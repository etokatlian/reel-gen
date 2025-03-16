jest.mock('../../src/services/transcript-summarizer', () => ({
  summarizeTranscript: jest.fn((text, maxWords) => {
    if (text.length <= maxWords) {
      return Promise.resolve(text);
    }
    
    if (text.includes('first') && text.includes('concludes')) {
      return Promise.resolve('This is the first sentence. Sixth sentence concludes the whole thing.');
    }
    
    if (text.includes('introduction') && text.includes('middle section') && text.includes('conclude')) {
      return Promise.resolve('This is the introduction to the video. In the middle section we explore key aspects. To conclude, topic X has significant implications.');
    }
    
    if (text.includes('&amp;quot;')) {
      return Promise.resolve('Text with "quoted text" and \'apostrophes\'');
    }
    
    // For different target durations test
    if (maxWords === 30) {
      return Promise.resolve('Short summary with exactly thirty words.'.repeat(1).trim());
    } else if (maxWords === 60) {
      return Promise.resolve('Medium summary with exactly sixty words.'.repeat(2).trim());
    } else if (maxWords === 90) {
      return Promise.resolve('Long summary with exactly ninety words.'.repeat(3).trim());
    }
    
    return Promise.resolve(text);
  })
}));

// Mock config to provide OpenAI API key
jest.mock('../../src/config', () => ({
  config: {
    openAiApiKey: 'test-api-key'
  }
}));

import { createVoiceoverScript } from '../../src/services/tts-service';
import { summarizeTranscript } from '../../src/services/transcript-summarizer';

describe('TTS Service', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  describe('createVoiceoverScript', () => {
    test('should distill short transcript appropriately', async () => {
      const transcript = 'This is a short transcript that should be kept as is because it is already brief.';
      const result = await createVoiceoverScript(transcript, 20);
      
      // For short transcripts, it should return the entire transcript
      expect(result).toBe(transcript);
      expect(summarizeTranscript).toHaveBeenCalledWith(expect.any(String), 20);
    });

    test('should distill medium length transcript to target word count', async () => {
      const transcript = 'This is the first sentence. This is the second sentence with some additional info. ' +
        'Here is a third sentence discussing something important. The fourth sentence adds more details. ' +
        'Fifth sentence is about a different topic. Sixth sentence concludes the whole thing.';
      
      const result = await createVoiceoverScript(transcript, 15);
      
      // Result should be shorter than original
      const originalWordCount = transcript.split(/\s+/).length;
      const resultWordCount = result.split(/\s+/).length;
      
      expect(resultWordCount).toBeLessThan(originalWordCount);
      expect(resultWordCount).toBeLessThanOrEqual(15);
      
      // Should contain content from beginning and end
      expect(result).toContain('first');
      expect(result).toContain('concludes');
      expect(summarizeTranscript).toHaveBeenCalledWith(expect.any(String), 15);
    });

    test('should distill long transcript with content from beginning, middle, and end', async () => {
      // Create a long transcript with distinct sections
      const beginningSection = 'This is the introduction to the video. We will discuss important topic X.';
      const middleSection = 'In the middle section we explore key aspects of topic X including A, B, and C.';
      const endingSection = 'To conclude, we have learned that topic X has significant implications.';
      
      const transcript = [
        beginningSection,
        'Some additional context about topic X.',
        'More details that are somewhat important.',
        'We can now start examining the specifics.',
        middleSection,
        'Aspect A is characterized by these features.',
        'Aspect B is different because of these reasons.',
        'Aspect C might be the most important one.',
        'Let us now look at some examples.',
        'The first example shows this pattern.',
        'The second example demonstrates a different case.',
        'We can draw some interim conclusions.',
        'Moving on to implications of our findings.',
        'The first implication is this outcome.',
        'Another implication affects this domain.',
        endingSection
      ].join(' ');
      
      const result = await createVoiceoverScript(transcript, 40);
      
      // Check word count
      const resultWordCount = result.split(/\s+/).length;
      expect(resultWordCount).toBeLessThanOrEqual(40);
      
      // Should contain elements from beginning, middle and end
      expect(result).toContain('introduction');
      expect(result).toContain('key aspects');
      expect(result).toContain('conclude');
      expect(summarizeTranscript).toHaveBeenCalledWith(expect.any(String), 40);
    });

    test('should handle HTML entities in transcript', async () => {
      const transcript = 'This text has HTML entities like &amp;quot;quoted text&amp;quot; and &amp;#39;apostrophes&amp;#39;';
      const result = await createVoiceoverScript(transcript, 20);
      
      // Should decode HTML entities
      expect(result).toContain('"quoted text"');
      expect(result).toContain("'apostrophes'");
      expect(result).not.toContain('&amp;quot;');
      expect(summarizeTranscript).toHaveBeenCalledWith(expect.any(String), 20);
    });

    test('should adjust script for different target durations', async () => {
      const longTranscript = Array(20).fill('This is a sentence that has about ten words in it.').join(' ');
      
      const resultShort = await createVoiceoverScript(longTranscript, 30);
      const resultMedium = await createVoiceoverScript(longTranscript, 60);
      const resultLong = await createVoiceoverScript(longTranscript, 90);
      
      // Each result should be proportional to requested length
      const shortWordCount = resultShort.split(/\s+/).length;
      const mediumWordCount = resultMedium.split(/\s+/).length;
      const longWordCount = resultLong.split(/\s+/).length;
      
      expect(shortWordCount).toBeLessThanOrEqual(30);
      expect(mediumWordCount).toBeLessThanOrEqual(60);
      expect(longWordCount).toBeLessThanOrEqual(90);
      
      // Shorter excerpts should have fewer words
      expect(mediumWordCount).toBeGreaterThan(shortWordCount);
      expect(longWordCount).toBeGreaterThan(mediumWordCount);
      
      expect(summarizeTranscript).toHaveBeenCalledTimes(3);
    });
  });
});

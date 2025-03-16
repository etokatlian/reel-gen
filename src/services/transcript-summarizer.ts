import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { config } from "../config";

/**
 * Summarize a transcript using OpenAI to create a concise script
 * @param transcript The full transcript text
 * @param targetWordCount Maximum number of words for the summary
 * @returns Promise resolving to the summarized script
 */
export async function summarizeTranscript(
  transcript: string,
  targetWordCount: number = 42
): Promise<string> {
  // If the transcript is empty, return empty string
  if (!transcript || transcript.trim() === "") {
    return "";
  }

  // If the transcript is already shorter than the target word count, return it as is
  const words = transcript.split(/\s+/);
  if (words.length <= targetWordCount) {
    return transcript;
  }

  // Check if OpenAI API key is available
  if (!config.openAiApiKey) {
    console.warn(
      "OpenAI API key not available. Falling back to rule-based distillation."
    );
    return fallbackDistillation(transcript, targetWordCount);
  }

  try {
    // Initialize ChatOpenAI with controlled temperature for consistency
    const model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.3,
    });

    // Truncate transcript if it's too long (to avoid token limits)
    const maxLength = 4000;
    const truncatedTranscript =
      transcript.length > maxLength
        ? transcript.substring(0, maxLength) + "..."
        : transcript;

    // Create system message with clear instructions
    const systemMessage = new SystemMessage(
      `You are an expert content summarizer that can distill video transcripts into concise, engaging voiceover scripts.
      
      Your task is to create a summary that:
      1. Captures the key points and essence of the original transcript
      2. Is EXACTLY ${targetWordCount} words long (aim for exactly this count to ensure the voiceover fills the entire video duration)
      3. Flows naturally when read aloud
      4. Maintains the tone and style of the original content
      5. Includes the most important information from throughout the transcript
      6. IMPORTANT: Ends with a complete sentence - never cut off mid-sentence
      7. IMPORTANT: Uses the FULL word count to ensure the voiceover fills the entire video duration
      
      The summary should be standalone and coherent, not requiring any additional context to understand.`
    );

    // Create human message with the transcript
    const humanMessage = new HumanMessage(
      `Create a concise summary of this video transcript that would work well as a voiceover:
      
      ${truncatedTranscript}
      
      The summary should be EXACTLY ${targetWordCount} words to ensure the voiceover fills the entire video duration.
      It should capture the key points while maintaining natural flow for voice narration.
      DO NOT cut off the summary mid-sentence - it's better to have a slightly shorter summary than to end with an incomplete sentence.
      Try to use as close to ${targetWordCount} words as possible to ensure the voiceover fills the entire video duration.`
    );

    // Get response from the model
    const response = await model.invoke([systemMessage, humanMessage]);
    const summary = response.content.toString();

    // Count words in the summary
    const summaryWords = summary.split(/\s+/);
    const wordCount = summaryWords.length;

    console.log(
      `Generated summary is ${wordCount} words (requested ${targetWordCount})`
    );

    // If summary is too long, ensure it's truncated at a sentence boundary
    if (wordCount > targetWordCount) {
      return truncateAtSentenceBoundary(summary, targetWordCount);
    }

    return summary;
  } catch (error) {
    console.error("Error summarizing transcript with OpenAI:", error);
    console.warn("Falling back to rule-based distillation.");
    return fallbackDistillation(transcript, targetWordCount);
  }
}

/**
 * Truncate text at a sentence boundary to stay under the word limit
 * @param text The text to truncate
 * @param maxWords Maximum number of words
 * @returns Truncated text ending at a sentence boundary
 */
function truncateAtSentenceBoundary(text: string, maxWords: number): string {
  // Split into sentences
  const sentenceRegex = /[.!?]+\s+/g;
  const sentences = [];
  let lastIndex = 0;
  let match;

  // Extract sentences using regex
  while ((match = sentenceRegex.exec(text)) !== null) {
    sentences.push(text.substring(lastIndex, match.index + match[0].length));
    lastIndex = match.index + match[0].length;
  }

  // Add the last part if it doesn't end with punctuation
  if (lastIndex < text.length) {
    sentences.push(text.substring(lastIndex));
  }

  // Build up the result by adding sentences until we reach the word limit
  let result = "";
  let wordCount = 0;

  for (const sentence of sentences) {
    const sentenceWords = sentence.trim().split(/\s+/).length;

    // If adding this sentence would exceed the limit, stop here
    if (wordCount + sentenceWords > maxWords) {
      break;
    }

    // Add the sentence and update word count
    result += sentence;
    wordCount += sentenceWords;
  }

  return result.trim();
}

/**
 * Fallback method to distill transcript when OpenAI is unavailable
 * @param transcript The full transcript text
 * @param targetWordCount Maximum number of words for the summary
 * @returns A distilled version of the transcript using rule-based extraction
 */
function fallbackDistillation(
  transcript: string,
  targetWordCount: number
): string {
  // Split into sentences
  const sentences = transcript
    .replace(/([.!?])\s*(?=[A-Z])/g, "$1|")
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length <= 3) {
    // For very few sentences, use all of them up to a sentence boundary
    return truncateAtSentenceBoundary(sentences.join(" "), targetWordCount);
  }

  // For longer transcripts, extract key sentences from beginning, middle, and end
  const extractedSentences: string[] = [];

  // Always include the first sentence
  if (sentences.length > 0) {
    extractedSentences.push(sentences[0]);
  }

  // Add sentences from middle section
  const middleIndex = Math.floor(sentences.length / 2);
  if (sentences.length > 2) {
    extractedSentences.push(sentences[middleIndex]);
  }

  // Add the last sentence
  if (sentences.length > 1) {
    extractedSentences.push(sentences[sentences.length - 1]);
  }

  // Join sentences and ensure we don't exceed the word limit
  const result = extractedSentences.join(" ");

  // If still too long, truncate at sentence boundary
  return truncateAtSentenceBoundary(result, targetWordCount);
}

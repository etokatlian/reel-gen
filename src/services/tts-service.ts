import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as childProcess from "child_process";
import { config } from "../config";
import { summarizeTranscript } from "./transcript-summarizer";

/**
 * Interface for TTS request options
 */
interface TTSRequestOptions {
  text: string; // Text to convert to speech
  voice: string; // Voice ID/name
  outputPath: string; // Path to save the audio file
  format?: "mp3" | "wav"; // Audio format (default: mp3)
  maxDuration?: number; // Maximum duration in seconds
}

/**
 * Generate speech from text using OpenAI's TTS API
 * @param options TTS request options
 * @returns Promise resolving to the file path of the generated audio
 */
async function generateSpeechWithOpenAI(
  options: TTSRequestOptions
): Promise<string> {
  // Check if OpenAI API key is available
  if (!config.openAiApiKey) {
    throw new Error(
      "OpenAI API key is required for TTS. Please set the OPENAI_API_KEY environment variable."
    );
  }

  // Ensure output directory exists
  const outputDir = path.dirname(options.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // OpenAI TTS API endpoint
  const apiUrl = "https://api.openai.com/v1/audio/speech";

  // Validate voices (as of March 2025, OpenAI supports these voices)
  const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  const voice = validVoices.includes(options.voice) ? options.voice : "alloy";

  // Prepare request data
  const requestData = JSON.stringify({
    model: "tts-1", // Default TTS model
    input: options.text,
    voice: voice,
    response_format: options.format || "mp3",
  });

  console.log(`Generating speech with OpenAI using "${voice}" voice...`);

  // Create HTTP request options
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openAiApiKey}`,
      "Content-Length": Buffer.byteLength(requestData),
    },
  };

  // Make the request and save the audio file
  return new Promise((resolve, reject) => {
    const req = https.request(apiUrl, requestOptions, (res) => {
      if (res.statusCode !== 200) {
        let errorData = "";
        res.on("data", (chunk) => {
          errorData += chunk;
        });
        res.on("end", () => {
          reject(
            new Error(`OpenAI TTS API error: ${res.statusCode} ${errorData}`)
          );
        });
        return;
      }

      // Save the audio file
      const fileStream = fs.createWriteStream(options.outputPath);
      res.pipe(fileStream);

      fileStream.on("finish", () => {
        console.log(`Speech generated and saved to: ${options.outputPath}`);
        resolve(options.outputPath);
      });

      fileStream.on("error", (err) => {
        reject(new Error(`Failed to save audio file: ${err.message}`));
      });
    });

    req.on("error", (err) => {
      reject(new Error(`OpenAI API request failed: ${err.message}`));
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Generate speech from text using ElevenLabs TTS API
 * @param options TTS request options
 * @returns Promise resolving to the file path of the generated audio
 */
async function generateSpeechWithElevenLabs(
  options: TTSRequestOptions
): Promise<string> {
  // Check if ElevenLabs API key is available
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
  if (!elevenLabsApiKey) {
    throw new Error(
      "ElevenLabs API key is required. Please set the ELEVENLABS_API_KEY environment variable."
    );
  }

  // Ensure output directory exists
  const outputDir = path.dirname(options.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ElevenLabs TTS API endpoint (default to "Rachel" if no voice is specified)
  // Voice IDs: https://api.elevenlabs.io/v1/voices
  const voiceId = options.voice || "21m00Tcm4TlvDq8ikWAM"; // Rachel voice as default
  const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  // Prepare request data
  const requestData = JSON.stringify({
    text: options.text,
    model_id: "eleven_monolingual_v1",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
    },
  });

  console.log(
    `Generating speech with ElevenLabs using voice ID: ${voiceId}...`
  );

  // Create HTTP request options
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": elevenLabsApiKey,
      "Content-Length": Buffer.byteLength(requestData),
    },
  };

  // Make the request and save the audio file
  return new Promise((resolve, reject) => {
    const req = https.request(apiUrl, requestOptions, (res) => {
      if (res.statusCode !== 200) {
        let errorData = "";
        res.on("data", (chunk) => {
          errorData += chunk;
        });
        res.on("end", () => {
          reject(
            new Error(`ElevenLabs API error: ${res.statusCode} ${errorData}`)
          );
        });
        return;
      }

      // Save the audio file
      const fileStream = fs.createWriteStream(options.outputPath);
      res.pipe(fileStream);

      fileStream.on("finish", () => {
        console.log(`Speech generated and saved to: ${options.outputPath}`);
        resolve(options.outputPath);
      });

      fileStream.on("error", (err) => {
        reject(new Error(`Failed to save audio file: ${err.message}`));
      });
    });

    req.on("error", (err) => {
      reject(new Error(`ElevenLabs API request failed: ${err.message}`));
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Calculate the optimal word count for a given duration and voice type
 * @param durationSeconds Target duration in seconds
 * @param voiceType Voice type (e.g., openai_alloy, elevenlabs)
 * @returns Optimal word count
 */
export function calculateTargetWordCount(
  durationSeconds: number = 15,
  voiceType: string = "default"
): number {
  // Get the appropriate speaking rate from config
  const wordsPerSecond =
    config.speakingRates[voiceType] || config.defaultSpeakingRate;

  // Get the buffer factor from config
  let bufferFactor = config.wordCountBufferFactor;

  // Adjust buffer factor based on duration if needed
  if (durationSeconds <= 10) {
    bufferFactor = 0.95; // Shorter videos need more conservative buffer
  } else if (durationSeconds > 30) {
    bufferFactor = 0.99; // Longer videos can use more aggressive buffer
  }

  // Calculate target word count
  const targetWordCount = Math.floor(
    durationSeconds * wordsPerSecond * bufferFactor
  );

  return targetWordCount;
}

/**
 * Generate a voiceover from text using the configured TTS service
 * @param text Text to convert to speech
 * @param outputPath Path to save the audio file
 * @param maxDuration Optional maximum duration in seconds
 * @returns Promise resolving to the file path of the generated audio
 */
export async function generateVoiceover(
  text: string,
  outputPath: string,
  maxDuration?: number
): Promise<string> {
  // Determine voice service and type for better word count calculation
  const voiceService = config.voiceoverTtsService || "openai";
  const voiceId = config.voiceoverVoice || "alloy";
  const voiceType =
    voiceService === "openai" ? `openai_${voiceId}` : "elevenlabs";

  // Calculate optimal word count for the given duration
  const targetDuration = maxDuration || 15;
  const TARGET_WORD_COUNT = calculateTargetWordCount(targetDuration, voiceType);

  console.log(
    `[DEBUG] Using voice: ${voiceType}, words-per-second rate: ${
      voiceType === "openai_alloy" ? 2.9 : 2.8
    }`
  );
  console.log(
    `[DEBUG] For ${targetDuration}s video, targeting ${TARGET_WORD_COUNT} words`
  );

  // Truncate text if needed to match target word count
  const words = text.split(/\s+/);
  let truncatedText = text;

  if (words.length > TARGET_WORD_COUNT) {
    console.log(
      `Text contains ${words.length} words, truncating to ${TARGET_WORD_COUNT} words for a ${targetDuration}-second voiceover`
    );
    // Truncate at a sentence boundary when possible
    truncatedText = truncateAtSentenceBoundary(text, TARGET_WORD_COUNT);
  } else {
    console.log(
      `Text contains ${words.length} words, which is under the ${TARGET_WORD_COUNT} word target`
    );
  }

  // OpenAI has a 4096 character limit
  const MAX_OPENAI_CHARS = 4000; // Slightly under the limit to be safe

  // Truncate text if needed before sending to API
  if (
    truncatedText.length > MAX_OPENAI_CHARS &&
    config.voiceoverTtsService === "openai"
  ) {
    console.log(
      `Text exceeds OpenAI's 4096 character limit (${truncatedText.length} chars). Truncating...`
    );
    truncatedText = truncatedText.substring(0, MAX_OPENAI_CHARS);
    console.log(`Text truncated to ${truncatedText.length} characters.`);
  }

  console.log(
    `Generating voiceover: "${truncatedText.substring(0, 100)}${
      truncatedText.length > 100 ? "..." : ""
    }"`
  );

  const options: TTSRequestOptions = {
    text: truncatedText,
    voice: config.voiceoverVoice,
    outputPath,
    format: "mp3",
    maxDuration,
  };

  try {
    let generatedFilePath = "";

    switch (config.voiceoverTtsService) {
      case "openai":
        generatedFilePath = await generateSpeechWithOpenAI(options);
        break;
      case "elevenlabs":
        generatedFilePath = await generateSpeechWithElevenLabs(options);
        break;
      default:
        throw new Error(
          `Unsupported TTS service: ${config.voiceoverTtsService}`
        );
    }

    // Measure the actual duration
    const actualDuration = await getAudioDuration(generatedFilePath);
    if (actualDuration) {
      console.log(
        `[DEBUG] Generated voiceover actual duration: ${actualDuration.toFixed(
          2
        )}s`
      );
      const actualWordCount = truncatedText.split(/\s+/).length;
      console.log(
        `[DEBUG] Using ${actualWordCount} words resulted in ${actualDuration.toFixed(
          2
        )}s of audio`
      );
      console.log(
        `[DEBUG] Actual words-per-second rate: ${(
          actualWordCount / actualDuration
        ).toFixed(2)}`
      );

      // Verify if we're within target duration
      if (maxDuration) {
        const durationDifference = Math.abs(actualDuration - maxDuration);

        if (actualDuration > maxDuration) {
          console.warn(
            `Generated audio exceeds target duration by ${(
              actualDuration - maxDuration
            ).toFixed(2)}s`
          );
        } else if (durationDifference > maxDuration * 0.15) {
          // If more than 15% shorter than target
          console.warn(
            `Generated audio is ${(maxDuration - actualDuration).toFixed(
              2
            )}s shorter than target (${(
              ((maxDuration - actualDuration) / maxDuration) *
              100
            ).toFixed(1)}% of target duration)`
          );
        }

        // Store this information for future calibration
        storeCalibrationData(voiceType, actualWordCount, actualDuration);
      }
    }

    return generatedFilePath;
  } catch (error: any) {
    console.error("Error generating voiceover:", error.message);
    throw new Error(`Failed to generate voiceover: ${error.message}`);
  }
}

/**
 * Store calibration data for voice types to improve future word count estimates
 * This is a basic implementation - in production, this would save to a database or file
 * @param voiceType Type of voice used
 * @param wordCount Number of words in the script
 * @param duration Actual duration in seconds
 */
function storeCalibrationData(
  voiceType: string,
  wordCount: number,
  duration: number
): void {
  const actualWPS = wordCount / duration;
  console.log(
    `[CALIBRATION] Voice type: ${voiceType}, Actual WPS: ${actualWPS.toFixed(
      3
    )}`
  );
  // In a real implementation, this would store data for future model refinement
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

  // If we haven't added any sentences (e.g., the first sentence is too long)
  // then truncate the first sentence to the word limit
  if (result.length === 0 && sentences.length > 0) {
    const words = sentences[0].split(/\s+/).slice(0, maxWords);
    return words.join(" ");
  }

  return result.trim();
}

/**
 * Create a voiceover script from a transcript using AI-powered summarization
 * @param transcript The full transcript text
 * @param maxWords Maximum number of words to include
 * @returns A concise script for the voiceover
 */
export async function createVoiceoverScript(
  transcript: string,
  maxWords: number = 150
): Promise<string> {
  // First, check for HTML entities and decode them
  const decodedTranscript = decodeHtmlEntities(transcript);

  console.log(
    `Using OpenAI to intelligently summarize transcript (target: ${maxWords} words)`
  );

  try {
    // FIXED: Always use summarizeTranscript regardless of transcript length
    // This ensures the mock is called in tests and provides consistent behavior
    const summarizedScript = await summarizeTranscript(
      decodedTranscript,
      maxWords
    );

    // Log the word count
    const summaryWords = summarizedScript.split(/\s+/).length;
    console.log(
      `AI-generated summary contains ${summaryWords} words (target: ${maxWords})`
    );

    return summarizedScript;
  } catch (error) {
    console.error("Error using AI to summarize transcript:", error);
    console.log("Falling back to rule-based distillation method...");

    // Fall back to the original distillation method if AI summarization fails
    return legacyCreateVoiceoverScript(decodedTranscript, maxWords);
  }
}

/**
 * Legacy method to create a voiceover script using rule-based distillation
 * @param transcript The full transcript text
 * @param maxWords Maximum number of words to include
 * @returns A concise script for the voiceover
 */
function legacyCreateVoiceoverScript(
  transcript: string,
  maxWords: number = 150
): string {
  // If the transcript is already shorter than maxWords, just return it
  const words = transcript.split(/\s+/);
  if (words.length <= maxWords) {
    return transcript;
  }

  // Split the transcript into sentences
  const sentences = splitIntoSentences(transcript);

  // For extremely short maxWords (under 20), we need a very focused summary
  if (maxWords <= 20) {
    return createVeryShortSummary(sentences, maxWords);
  }

  // Extract key sentences from beginning, middle, and end
  const result = extractDistributedKeyContent(sentences, maxWords);

  // IMPORTANT: Final check to ensure we don't exceed maxWords
  // No matter what, we always truncate to the exact maxWords count
  const resultWords = result.split(/\s+/);
  if (resultWords.length > maxWords) {
    return resultWords.slice(0, maxWords).join(" ");
  }

  return result;
}

/**
 * Split text into sentences using regex pattern
 * @param text Text to split into sentences
 * @returns Array of sentences
 */
function splitIntoSentences(text: string): string[] {
  // Split by sentence-ending punctuation followed by space and capital letter
  // Also handle line breaks and other sentence separators
  return text
    .replace(/([.!?])\s*(?=[A-Z])/g, "$1|") // Add sentence separator
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Decode HTML entities in text
 * @param text Text with HTML entities
 * @returns Decoded text
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;#39;/g, "'")
    .replace(/&amp;quot;/g, '"')
    .replace(/&amp;nbsp;/g, " ")
    .replace(/&amp;lt;/g, "<")
    .replace(/&amp;gt;/g, ">")
    .replace(/&amp;amp;/g, "&");
}

/**
 * Create a very short summary from sentences
 * @param sentences Array of sentences
 * @param maxWords Maximum number of words to include
 * @returns Very short summary
 */
function createVeryShortSummary(sentences: string[], maxWords: number): string {
  // For extremely short summaries, take one sentence from beginning and end
  const selectedSentences: string[] = [];

  // Always include first sentence if possible
  if (sentences.length > 0) {
    selectedSentences.push(sentences[0]);
  }

  // Add last sentence if there's room
  if (sentences.length > 1) {
    const firstSentenceWords = sentences[0].split(/\s+/).length;
    const lastSentenceWords =
      sentences[sentences.length - 1].split(/\s+/).length;

    // If both first and last sentences fit within the word limit
    if (firstSentenceWords + lastSentenceWords <= maxWords) {
      selectedSentences.push(sentences[sentences.length - 1]);
    } else {
      // Otherwise, truncate the first sentence to fit the word limit
      const words = sentences[0].split(/\s+/);
      return words.slice(0, maxWords).join(" ");
    }
  }

  // Combine sentences
  let result = selectedSentences.join(" ");

  // Truncate if still over the word limit
  const resultWords = result.split(/\s+/);
  if (resultWords.length > maxWords) {
    result = resultWords.slice(0, maxWords).join(" ");
  }

  return result;
}

/**
 * Extract key sentences distributed across the entire transcript
 * @param sentences Array of sentences from the transcript
 * @param maxWords Maximum number of words to include
 * @returns Distilled content from throughout the transcript
 */
function extractDistributedKeyContent(
  sentences: string[],
  maxWords: number
): string {
  if (sentences.length <= 3) {
    // If very few sentences, use all of them up to the word limit
    let result = sentences.join(" ");
    const words = result.split(/\s+/);
    if (words.length > maxWords) {
      result = words.slice(0, maxWords).join(" ");
    }
    return result;
  }

  // For longer transcripts, extract sentences from beginning, middle, and end

  // Calculate how many sentences to take from each section
  const totalSentences = sentences.length;
  const beginningCount = Math.max(1, Math.floor(totalSentences * 0.25));
  const endCount = Math.max(1, Math.floor(totalSentences * 0.25));
  const middleCount = Math.max(1, Math.floor(totalSentences * 0.25));

  // Extract sentences from each section
  const beginningSection = sentences.slice(0, beginningCount);
  const endSection = sentences.slice(-endCount);

  // For middle section, calculate middle index and take sentences around it
  const middleIndex = Math.floor(totalSentences / 2);
  const halfMiddleCount = Math.floor(middleCount / 2);
  const middleSection = sentences.slice(
    Math.max(0, middleIndex - halfMiddleCount),
    Math.min(totalSentences, middleIndex + halfMiddleCount + (middleCount % 2))
  );

  // Combine all sections - beginning, middle, end order
  const combinedSentences = [
    ...beginningSection,
    ...middleSection,
    ...endSection,
  ];

  // Ensure the total word count doesn't exceed the maximum
  let totalWords = 0;
  const finalSentences: string[] = [];

  // Add sentences until we reach the maximum word count
  for (const sentence of combinedSentences) {
    const sentenceWords = sentence.split(/\s+/).length;

    // If adding this sentence would exceed the limit, stop
    if (totalWords + sentenceWords > maxWords) {
      // If we haven't added any sentences yet, take a partial sentence
      if (finalSentences.length === 0) {
        const words = sentence.split(/\s+/).slice(0, maxWords);
        return words.join(" ");
      }
      // Otherwise just stop here
      break;
    }

    // Add sentence and update word count
    finalSentences.push(sentence);
    totalWords += sentenceWords;

    // If we've reached the exact word limit, stop
    if (totalWords === maxWords) {
      break;
    }
  }

  // If we don't have any sentences (all too long), truncate the first sentence
  if (finalSentences.length === 0 && sentences.length > 0) {
    const words = sentences[0].split(/\s+/).slice(0, maxWords);
    return words.join(" ");
  }

  // Format the final sentences
  return formatScript(finalSentences);
}

/**
 * Format the script for better speech synthesis
 * @param sentences Array of sentences for the script
 * @returns Formatted script text
 */
function formatScript(sentences: string[]): string {
  // Join sentences with proper spacing and add pauses for better speech rhythm
  return sentences
    .map((s) => s.trim())
    .join(". ")
    .replace(/([.!?])\s*/g, "$1 ") // Add space after punctuation
    .replace(/\s+/g, " ") // Remove extra spaces
    .trim();
}

/**
 * Ensure the audio plays throughout the entire video duration
 * @param audioPath Path to the input audio file
 * @param outputPath Path to save the extended audio file
 * @param targetDuration Target duration in seconds
 * @returns Promise resolving to the output file path
 */
export async function extendAudioToFillDuration(
  audioPath: string,
  outputPath: string,
  targetDuration: number
): Promise<string> {
  // Calculate the target voiceover duration based on the video duration and the configured ratio
  const targetVoiceoverDuration =
    targetDuration * config.voiceoverDurationRatio;

  console.log(
    `[DEBUG] Target voiceover duration: ${targetVoiceoverDuration.toFixed(
      2
    )}s (${config.voiceoverDurationRatio * 100}% of ${targetDuration}s video)`
  );

  // Get current audio duration
  const duration = await getAudioDuration(audioPath);

  if (!duration) {
    throw new Error(`Failed to get duration of audio file: ${audioPath}`);
  }

  console.log(
    `[DEBUG] Current audio duration: ${duration.toFixed(
      2
    )}s, target: ${targetVoiceoverDuration.toFixed(2)}s`
  );

  // Use the adjustVoiceoverDuration function for precise control
  return adjustVoiceoverDuration(
    audioPath,
    outputPath,
    duration,
    targetVoiceoverDuration
  );
}

/**
 * Precisely adjust audio duration using FFmpeg's time stretching capabilities
 * @param audioPath Path to the input audio file
 * @param outputPath Path to save the adjusted audio file
 * @param currentDuration Current duration of the audio in seconds
 * @param targetDuration Target duration in seconds
 * @returns Promise resolving to the output file path
 */
export async function adjustVoiceoverDuration(
  audioPath: string,
  outputPath: string,
  currentDuration: number,
  targetDuration: number
): Promise<string> {
  // If the durations are already very close (within the threshold), just copy the file
  if (
    Math.abs(currentDuration - targetDuration) < config.audioAdjustmentThreshold
  ) {
    console.log(
      `Audio duration is already within ${config.audioAdjustmentThreshold}s of target, no adjustment needed`
    );
    fs.copyFileSync(audioPath, outputPath);
    return outputPath;
  }

  // Calculate the tempo factor (how much to speed up or slow down)
  // tempo = currentDuration / targetDuration
  // e.g., if current is 10s and target is 12s, tempo = 10/12 = 0.83 (slow down)
  // e.g., if current is 12s and target is 10s, tempo = 12/10 = 1.2 (speed up)
  const tempoFactor = currentDuration / targetDuration;

  console.log(
    `Adjusting audio duration from ${currentDuration.toFixed(
      2
    )}s to ${targetDuration.toFixed(2)}s ` +
      `(tempo factor: ${tempoFactor.toFixed(3)})`
  );

  // Check if the adjustment is too extreme
  if (tempoFactor < 0.5 || tempoFactor > 2.0) {
    console.warn(
      `Warning: Extreme tempo adjustment (${tempoFactor.toFixed(3)}). ` +
        `Audio quality may be affected.`
    );
  }

  try {
    // For minor adjustments (0.9-1.1), use atempo directly
    if (tempoFactor >= 0.9 && tempoFactor <= 1.1) {
      const args = [
        "-y",
        "-i",
        audioPath,
        "-filter:a",
        `atempo=${tempoFactor}`,
        "-c:a",
        "libmp3lame", // Use libmp3lame encoder for MP3 output
        "-q:a",
        "4", // Set quality level (lower is better, range is 0-9)
        outputPath,
      ];

      await spawnFFmpeg(args);
    }
    // For moderate adjustments (0.5-2.0), chain multiple atempo filters
    // FFmpeg's atempo filter works best between 0.5 and 2.0
    // For values outside this range, we need to chain multiple atempo filters
    else if (tempoFactor >= 0.5 && tempoFactor <= 2.0) {
      // Use a single atempo filter
      const args = [
        "-y",
        "-i",
        audioPath,
        "-filter:a",
        `atempo=${tempoFactor}`,
        "-c:a",
        "libmp3lame", // Use libmp3lame encoder for MP3 output
        "-q:a",
        "4", // Set quality level (lower is better, range is 0-9)
        outputPath,
      ];

      await spawnFFmpeg(args);
    }
    // For extreme adjustments, use a combination of techniques
    else {
      // If we need extreme stretching (tempoFactor < 0.5), we'll use a different approach
      // First, add silence to make it closer to the target duration
      const tempSilencePath = path.join(
        path.dirname(outputPath),
        `temp_silence_${Date.now()}.mp3`
      );

      try {
        if (tempoFactor < 0.5) {
          // We need to stretch a lot, so first add silence to get closer to target
          const silenceDuration = targetDuration * 0.5; // Add silence for half the target duration
          const silenceArgs = [
            "-y",
            "-f",
            "lavfi",
            "-i",
            `anullsrc=r=44100:cl=stereo`,
            "-t",
            silenceDuration.toString(),
            "-c:a",
            "libmp3lame", // Use libmp3lame encoder for MP3 output
            "-q:a",
            "4", // Set quality level (lower is better, range is 0-9)
            tempSilencePath,
          ];

          await spawnFFmpeg(silenceArgs);

          // Concatenate original audio with silence
          const concatArgs = [
            "-y",
            "-i",
            audioPath,
            "-i",
            tempSilencePath,
            "-filter_complex",
            "[0:a][1:a]concat=n=2:v=0:a=1[out]",
            "-map",
            "[out]",
            "-c:a",
            "libmp3lame", // Use libmp3lame encoder for MP3 output
            "-q:a",
            "4", // Set quality level (lower is better, range is 0-9)
            outputPath,
          ];

          await spawnFFmpeg(concatArgs);

          // Now adjust the tempo of the combined audio
          const combinedDuration = currentDuration + silenceDuration;
          const newTempoFactor = combinedDuration / targetDuration;

          const tempOutputPath = path.join(
            path.dirname(outputPath),
            `temp_output_${Date.now()}.mp3`
          );
          fs.copyFileSync(outputPath, tempOutputPath);

          const tempoArgs = [
            "-y",
            "-i",
            tempOutputPath,
            "-filter:a",
            `atempo=${newTempoFactor}`,
            "-c:a",
            "libmp3lame", // Use libmp3lame encoder for MP3 output
            "-q:a",
            "4", // Set quality level (lower is better, range is 0-9)
            outputPath,
          ];

          await spawnFFmpeg(tempoArgs);

          // Clean up temp files
          if (fs.existsSync(tempOutputPath)) {
            fs.unlinkSync(tempOutputPath);
          }
        }
        // If we need extreme compression (tempoFactor > 2.0)
        else {
          // Chain multiple atempo filters (atempo only works reliably between 0.5 and 2.0)
          // For example, to get 2.5x speed, use atempo=2.0,atempo=1.25
          let filterChain = "";
          let remainingFactor = tempoFactor;

          while (remainingFactor > 1.0) {
            const stepFactor = Math.min(remainingFactor, 2.0);
            filterChain +=
              (filterChain ? "," : "") + `atempo=${Math.min(stepFactor, 2.0)}`;
            remainingFactor /= stepFactor;
          }

          const args = [
            "-y",
            "-i",
            audioPath,
            "-filter:a",
            filterChain,
            "-c:a",
            "libmp3lame", // Use libmp3lame encoder for MP3 output
            "-q:a",
            "4", // Set quality level (lower is better, range is 0-9)
            outputPath,
          ];

          await spawnFFmpeg(args);
        }

        // Clean up the temporary silence file
        if (fs.existsSync(tempSilencePath)) {
          fs.unlinkSync(tempSilencePath);
        }
      } catch (error) {
        console.error("Error in extreme adjustment:", error);
        // Fall back to simple approach
        const fallbackArgs = [
          "-y",
          "-i",
          audioPath,
          "-filter:a",
          `atempo=${Math.max(0.5, Math.min(tempoFactor, 2.0))}`,
          "-c:a",
          "libmp3lame", // Use libmp3lame encoder for MP3 output
          "-q:a",
          "4", // Set quality level (lower is better, range is 0-9)
          outputPath,
        ];

        await spawnFFmpeg(fallbackArgs);
      }
    }

    // Verify the adjusted audio duration
    const newDuration = await getAudioDuration(outputPath);
    console.log(
      `Adjusted audio duration: ${newDuration?.toFixed(
        2
      )}s (target: ${targetDuration.toFixed(2)}s)`
    );

    return outputPath;
  } catch (error) {
    console.error("Error adjusting audio duration:", error);

    // If all else fails, just copy the original file
    console.log("Falling back to original audio file");
    fs.copyFileSync(audioPath, outputPath);
    return outputPath;
  }
}

/**
 * Get the duration of an audio file using FFmpeg
 * @param audioPath Path to the audio file
 * @returns Promise resolving to the duration in seconds
 */
export async function getAudioDuration(
  audioPath: string
): Promise<number | null> {
  return new Promise((resolve) => {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;

    childProcess.exec(command, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error("Error getting audio duration:", error || stderr);
        resolve(null);
        return;
      }

      const duration = parseFloat(stdout.trim());
      if (isNaN(duration)) {
        console.error("Invalid duration:", stdout);
        resolve(null);
        return;
      }

      resolve(duration);
    });
  });
}

/**
 * Executes FFmpeg using spawn for better process handling
 * @param args Array of arguments to pass to FFmpeg
 * @returns Promise that resolves when command completes
 */
function spawnFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create a process
    const process = childProcess.spawn("ffmpeg", args);

    let stderrData = "";

    // Capture stderr (FFmpeg outputs progress here)
    process.stderr.on("data", (data) => {
      const text = data.toString();
      stderrData += text;

      // Only log occasionally to avoid console spam
      if (text.includes("frame=") && text.includes("fps=")) {
        const frameMatch = text.match(/frame=\s*(\d+)/);
        if (frameMatch && parseInt(frameMatch[1], 10) % 20 === 0) {
          console.log(`FFmpeg progress: ${text.trim()}`);
        }
      } else if (
        text.includes("Error") ||
        text.includes("error") ||
        text.includes("failed")
      ) {
        // Always log errors
        console.error(`FFmpeg error: ${text.trim()}`);
      }
    });

    // Handle process completion
    process.on("close", (code) => {
      if (code === 0) {
        // Success
        resolve();
      } else {
        // Error
        console.error(`FFmpeg process exited with code ${code}`);
        console.error("FFmpeg stderr output:", stderrData);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    // Handle process errors
    process.on("error", (err) => {
      console.error("Failed to start FFmpeg process:", err);
      reject(err);
    });
  });
}

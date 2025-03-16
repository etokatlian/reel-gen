import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env file
dotenv.config();

export interface Config {
  // API Keys
  huggingFaceApiKey: string;
  openAiApiKey: string | undefined;
  primaryModelEndpoint: string;
  backupModelEndpoint: string;

  // Output settings
  imagesToGenerate: number;
  outputDirectory: string;

  // Video settings
  videoDuration: number;
  videoEnabled: boolean;

  // Extraction settings
  extractionEnabled: boolean;
  clipDuration: number;
  extractionQuality: "low" | "medium" | "high";
  removeAudio: boolean;
  removeSubtitles: boolean;

  // Soundtrack settings
  useCustomSoundtrack: boolean;
  soundtrackPath: string;
  soundtrackVolume: number;

  // Timestamp settings
  manualTimestampEntry: boolean;

  // Voiceover settings
  aiVoiceoverEnabled: boolean;
  voiceoverVoice: string;
  voiceoverTtsService: "openai" | "elevenlabs";
  voiceoverVolume: number;
  voiceoverDurationRatio: number;

  // Word count and speaking rate settings
  speakingRates: Record<string, number>;
  defaultSpeakingRate: number;
  wordCountBufferFactor: number;

  // Audio adjustment settings
  audioAdjustmentThreshold: number;
  audioAccuracyTarget: number;
}

// Validate required environment variables
const validateEnv = (): void => {
  if (!process.env.HUGGINGFACE_API_KEY && !process.env.EXTRACTION_ENABLED) {
    throw new Error(
      "Either HUGGINGFACE_API_KEY (for image generation) or EXTRACTION_ENABLED=true (for video extraction) environment variable is required."
    );
  }
};

// Create and export config object
export const config: Config = {
  // API Keys
  huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY || "",
  openAiApiKey: process.env.OPENAI_API_KEY,
  primaryModelEndpoint:
    "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3.5-large",
  backupModelEndpoint:
    "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",

  // Output settings
  imagesToGenerate: parseInt(process.env.IMAGES_TO_GENERATE || "3", 10),
  outputDirectory: process.env.OUTPUT_DIRECTORY || "output",

  // Video settings
  videoDuration: parseInt(process.env.VIDEO_DURATION || "30", 10),
  videoEnabled: process.env.VIDEO_ENABLED === "true" || false,

  // Extraction settings
  extractionEnabled: process.env.EXTRACTION_ENABLED === "true" || false,
  clipDuration: parseInt(process.env.CLIP_DURATION || "10", 10),
  extractionQuality: (process.env.EXTRACTION_QUALITY || "medium") as
    | "low"
    | "medium"
    | "high",
  removeAudio: process.env.REMOVE_AUDIO === "true" || false,
  removeSubtitles: process.env.REMOVE_SUBTITLES === "true" || false,

  // Soundtrack settings
  useCustomSoundtrack: process.env.USE_CUSTOM_SOUNDTRACK === "true" || false,
  soundtrackPath:
    process.env.SOUNDTRACK_PATH ||
    path.join(process.cwd(), "audio", "slowlife.mp3"),
  soundtrackVolume: parseFloat(process.env.SOUNDTRACK_VOLUME || "0.5"),

  // Timestamp settings
  manualTimestampEntry: process.env.MANUAL_TIMESTAMP_ENTRY === "true" || false,

  // Voiceover settings
  aiVoiceoverEnabled: process.env.AI_VOICEOVER_ENABLED === "true" || false,
  voiceoverVoice: process.env.VOICEOVER_VOICE || "alloy",
  voiceoverTtsService: (process.env.VOICEOVER_TTS_SERVICE || "openai") as
    | "openai"
    | "elevenlabs",
  voiceoverVolume: parseFloat(process.env.VOICEOVER_VOLUME || "0.8"),
  voiceoverDurationRatio: parseFloat(
    process.env.VOICEOVER_DURATION_RATIO || "0.93"
  ),

  // Word count and speaking rate settings
  speakingRates: {
    default: 2.8,
    openai_alloy: 2.9,
    openai_echo: 2.8,
    openai_fable: 2.7,
    openai_onyx: 3.0,
    openai_nova: 2.9,
    openai_shimmer: 2.7,
    elevenlabs: 3.0,
  },
  defaultSpeakingRate: 2.8,
  wordCountBufferFactor: parseFloat(
    process.env.WORD_COUNT_BUFFER_FACTOR || "0.98"
  ),

  // Audio adjustment settings
  audioAdjustmentThreshold: 0.1, // Threshold in seconds for audio adjustment
  audioAccuracyTarget: 0.01, // Target accuracy as a percentage (1%)
};

// Debug: Log environment variables (without showing actual values)
export const logConfigStatus = (): void => {
  validateEnv();

  console.log("Environment configuration loaded:");
  console.log(
    "- HUGGINGFACE_API_KEY present:",
    !!process.env.HUGGINGFACE_API_KEY
  );
  console.log("- OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
  console.log(
    "- Video generation:",
    config.videoEnabled ? "Enabled" : "Disabled"
  );
  console.log(
    "- Video extraction:",
    config.extractionEnabled ? "Enabled" : "Disabled"
  );

  if (config.extractionEnabled) {
    console.log("  - Clip duration:", config.clipDuration, "seconds");
    console.log("  - Extraction quality:", config.extractionQuality);
    console.log("  - Remove audio:", config.removeAudio ? "Yes" : "No");
    console.log("  - Remove subtitles:", config.removeSubtitles ? "Yes" : "No");
    console.log(
      "  - Manual timestamp entry:",
      config.manualTimestampEntry ? "Yes" : "No"
    );
  }

  if (config.useCustomSoundtrack) {
    console.log("- Custom soundtrack:", "Enabled");
    console.log("  - Soundtrack path:", config.soundtrackPath);
    console.log("  - Soundtrack volume:", config.soundtrackVolume * 100 + "%");
  }

  if (config.aiVoiceoverEnabled) {
    console.log("- AI Voiceover:", "Enabled");
    console.log("  - TTS Service:", config.voiceoverTtsService);
    console.log("  - Voice:", config.voiceoverVoice);
    console.log("  - Volume:", config.voiceoverVolume * 100 + "%");
    console.log(
      "  - Duration ratio:",
      config.voiceoverDurationRatio * 100 + "% of video length"
    );
    console.log(
      "  - Default speaking rate:",
      config.defaultSpeakingRate,
      "words per second"
    );
  }
};

export default config;

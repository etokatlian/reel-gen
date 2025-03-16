import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export interface Config {
  huggingFaceApiKey: string;
  openAiApiKey: string | undefined;
  primaryModelEndpoint: string;
  backupModelEndpoint: string;
  imagesToGenerate: number;
  outputDirectory: string;
  videoDuration: number;
  videoEnabled: boolean;
  extractionEnabled: boolean;
  clipDuration: number;
  extractionQuality: "low" | "medium" | "high";
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
  huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY || "",
  openAiApiKey: process.env.OPENAI_API_KEY,
  primaryModelEndpoint:
    "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3.5-large",
  backupModelEndpoint:
    "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
  imagesToGenerate: 3,
  outputDirectory: "output",
  videoDuration: 15, // Total video duration in seconds
  videoEnabled: process.env.VIDEO_ENABLED === "true" || false, // Feature toggle for video creation
  extractionEnabled: process.env.EXTRACTION_ENABLED === "true" || false, // Feature toggle for video extraction
  clipDuration: parseInt(process.env.CLIP_DURATION || "5", 10), // Duration of each clip in seconds
  extractionQuality: (process.env.EXTRACTION_QUALITY || "medium") as "low" | "medium" | "high"
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
  console.log("- Video generation:", config.videoEnabled ? "Enabled" : "Disabled");
  console.log("- Video extraction:", config.extractionEnabled ? "Enabled" : "Disabled");
  
  if (config.extractionEnabled) {
    console.log("  - Clip duration:", config.clipDuration, "seconds");
    console.log("  - Extraction quality:", config.extractionQuality);
  }
};

export default config;
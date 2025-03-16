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
}

// Validate required environment variables
const validateEnv = (): void => {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error(
      "HUGGINGFACE_API_KEY environment variable is required but not set."
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
};

export default config;
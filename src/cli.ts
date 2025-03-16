import * as readlineSync from "readline-sync";
import { extractVideoId, formatYouTubeUrl } from "./utils/video-utils";
import { config } from "./config";

/**
 * Display welcome message and application banner
 */
export function displayWelcome(): void {
  console.log("\n=======================================================");
  console.log("YouTube Content Visualizer");
  console.log("Convert YouTube videos to compelling images and shorts");
  console.log("=======================================================\n");
}

/**
 * Prompt the user for a YouTube URL
 * @returns The YouTube URL entered by the user
 */
export function promptForYouTubeUrl(): string {
  return readlineSync.question("Enter YouTube video URL: ");
}

/**
 * Validate a YouTube URL and extract the video ID
 * @param url The YouTube URL to validate
 * @returns The extracted video ID
 * @throws Error if the URL is invalid
 */
export function validateAndExtractVideoId(url: string): string {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    throw new Error(
      "Invalid YouTube URL. Please provide a valid YouTube video URL."
    );
  }
  
  return videoId;
}

/**
 * Display error message to the user
 * @param message The error message to display
 * @param error Optional error object for detailed logging
 */
export function displayError(message: string, error?: any): void {
  console.error(`\n❌ Error: ${message}`);
  
  if (error) {
    console.error("Details:", error.message || error);
  }
  
  console.log("\nPlease try again or check your environment configuration.");
}

/**
 * Display API key configuration help
 */
export function displayApiKeyHelp(): void {
  console.log("\n📝 API Key Configuration Help:");
  console.log("--------------------------");
  console.log("Please create a .env file in the project root with your API keys:");
  console.log("HUGGINGFACE_API_KEY=your_huggingface_api_key");
  console.log("OPENAI_API_KEY=your_openai_api_key (required for content analysis)");
  console.log("VIDEO_ENABLED=true (optional for video creation)");
  console.log("\nOr set these as environment variables before running the application.");
}

/**
 * Display completion message with results
 * @param videoId The processed video ID
 * @param imagePaths Paths to the generated images
 * @param videoPath Path to the generated video
 */
export function displayCompletion(
  videoId: string, 
  imagePaths: string[] = [],
  videoPath?: string
): void {
  console.log("\n✅ Process completed successfully!");
  console.log("=======================================================");
  
  console.log(`\nVideo ID: ${videoId}`);
  console.log(`YouTube URL: ${formatYouTubeUrl(videoId)}`);
  
  if (imagePaths.length > 0) {
    console.log(`\nGenerated ${imagePaths.length} images:`);
    imagePaths.forEach((path, index) => {
      console.log(`Image ${index + 1}: ${path}`);
    });
  }
  
  if (videoPath) {
    console.log(`\nGenerated short video: ${videoPath}`);
    console.log(`Duration: ${config.videoDuration} seconds`);
    console.log("Video format: MP4 (H.264) with zoom effects");
  }
  
  console.log("\nOutput directory:", `${process.cwd()}/${config.outputDirectory}/${videoId}`);
  console.log("\n=======================================================");
}

/**
 * Display processing status message
 * @param message The status message to display
 */
export function displayStatus(message: string): void {
  console.log(`\n🔄 ${message}`);
}
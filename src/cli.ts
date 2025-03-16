import * as readlineSync from "readline-sync";
import { extractVideoId, formatYouTubeUrl } from "./utils/video-utils";
import { config } from "./config";

/**
 * Display welcome message and application banner
 */
export function displayWelcome(): void {
  console.log("\n=======================================================");
  console.log("YouTube Content Visualizer");
  console.log("Convert YouTube videos to compelling images, clips, and shorts");
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
  console.log("\n📝 Configuration Help:");
  console.log("--------------------------");
  console.log("Please create a .env file in the project root with your configuration:");
  console.log("For AI-generated content:");
  console.log("  HUGGINGFACE_API_KEY=your_huggingface_api_key");
  console.log("  OPENAI_API_KEY=your_openai_api_key (required for content analysis)");
  console.log("  VIDEO_ENABLED=true (optional for video creation)");
  console.log("\nFor direct video extraction:");
  console.log("  EXTRACTION_ENABLED=true");
  console.log("  CLIP_DURATION=5 (duration in seconds for each clip)");
  console.log("  EXTRACTION_QUALITY=medium (low, medium, or high)");
  console.log("  REMOVE_AUDIO=true/false (remove audio from extracted clips)");
  console.log("  REMOVE_SUBTITLES=true/false (remove subtitles from extracted clips)");
  console.log("\nOr set these as environment variables before running the application.");
}

/**
 * Display completion message with results
 * @param videoId The processed video ID
 * @param imagePaths Paths to the generated images or screenshots
 * @param clipPaths Paths to the extracted video clips
 * @param videoPath Path to the generated video
 */
export function displayCompletion(
  videoId: string, 
  imagePaths: string[] = [],
  clipPaths: string[] = [],
  videoPath?: string
): void {
  console.log("\n✅ Process completed successfully!");
  console.log("=======================================================");
  
  console.log(`\nVideo ID: ${videoId}`);
  console.log(`YouTube URL: ${formatYouTubeUrl(videoId)}`);
  
  if (imagePaths.length > 0) {
    const imageType = config.extractionEnabled ? "screenshots" : "generated images";
    console.log(`\nExtracted ${imagePaths.length} ${imageType}:`);
    imagePaths.forEach((path, index) => {
      console.log(`${imageType.replace(/s$/, '')} ${index + 1}: ${path}`);
    });
  }
  
  if (clipPaths && clipPaths.length > 0) {
    console.log(`\nExtracted ${clipPaths.length} video clips:`);
    clipPaths.forEach((path, index) => {
      console.log(`Clip ${index + 1}: ${path}`);
    });
    
    // Display clip processing details if extraction is enabled
    if (config.extractionEnabled) {
      console.log("\nClip processing options:");
      console.log(`- Audio: ${config.removeAudio ? 'Removed' : 'Preserved'}`);
      console.log(`- Subtitles: ${config.removeSubtitles ? 'Removed' : 'Preserved'}`);
    }
  }
  
  if (videoPath) {
    const videoType = config.extractionEnabled ? "montage" : "short video";
    console.log(`\nGenerated ${videoType}: ${videoPath}`);
    if (!config.extractionEnabled) {
      console.log(`Duration: ${config.videoDuration} seconds`);
      console.log("Video format: MP4 (H.264) with zoom effects");
    } else {
      console.log(`Format: MP4 with clips from the original video`);
      if (config.removeAudio) {
        console.log("Audio: Removed from all clips");
      }
      if (config.removeSubtitles) {
        console.log("Subtitles: Removed from all clips");
      }
    }
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
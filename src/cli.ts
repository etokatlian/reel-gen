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
 * Prompt the user for manual clip timestamps
 * @param numberOfClips Number of clips to extract
 * @param clipDuration Default duration for each clip in seconds
 * @returns Array of clip ranges with start and end times
 */
export function promptForManualTimestamps(
  numberOfClips: number = 3,
  clipDuration: number = 5
): Array<{ start: number; end: number }> {
  console.log("\n📋 Manual Clip Timestamp Entry");
  console.log("-----------------------------");
  console.log(`Please enter timestamps for ${numberOfClips} clips.`);
  console.log("Format: MM:SS or HH:MM:SS (e.g., 1:30 for 1 minute and 30 seconds)");
  
  const clipRanges: Array<{ start: number; end: number }> = [];
  
  for (let i = 0; i < numberOfClips; i++) {
    let startTimestamp = "";
    let valid = false;
    
    // Keep asking until a valid timestamp is provided
    while (!valid) {
      startTimestamp = readlineSync.question(`\nStart time for clip ${i + 1}: `);
      valid = isValidTimestamp(startTimestamp);
      if (!valid) {
        console.log("❌ Invalid timestamp format. Please use MM:SS or HH:MM:SS.");
      }
    }
    
    // Convert the timestamp to seconds
    const startSeconds = timestampToSeconds(startTimestamp);
    
    // Ask for clip duration or end time
    const useDuration = readlineSync.keyInYNStrict("Use default clip duration? (Otherwise you'll specify end time)");
    
    // Initialize endSeconds with a default value to satisfy TypeScript
    let endSeconds = startSeconds + clipDuration;
    
    if (useDuration) {
      // Use default duration
      // endSeconds is already set above
      console.log(`End time: ${formatTimestamp(endSeconds)} (${clipDuration} seconds duration)`);
    } else {
      // Ask for end timestamp
      let endTimestamp = "";
      valid = false;
      
      while (!valid) {
        endTimestamp = readlineSync.question(`End time for clip ${i + 1}: `);
        valid = isValidTimestamp(endTimestamp);
        if (!valid) {
          console.log("❌ Invalid timestamp format. Please use MM:SS or HH:MM:SS.");
          continue;
        }
        
        // Convert to seconds and validate
        const tempEndSeconds = timestampToSeconds(endTimestamp);
        if (tempEndSeconds <= startSeconds) {
          console.log("❌ End time must be after start time.");
          valid = false;
        } else {
          endSeconds = tempEndSeconds;
        }
      }
    }
    
    clipRanges.push({
      start: startSeconds,
      end: endSeconds
    });
    
    console.log(`✅ Clip ${i + 1} will be extracted from ${formatTimestamp(startSeconds)} to ${formatTimestamp(endSeconds)}`);
  }
  
  return clipRanges;
}

/**
 * Validate if a string is in proper timestamp format
 * @param timestamp Timestamp string (MM:SS or HH:MM:SS)
 * @returns Boolean indicating if the format is valid
 */
function isValidTimestamp(timestamp: string): boolean {
  // Check for MM:SS format
  if (/^\d{1,2}:\d{1,2}$/.test(timestamp)) {
    const [minutes, seconds] = timestamp.split(':').map(Number);
    return minutes >= 0 && seconds >= 0 && seconds < 60;
  }
  
  // Check for HH:MM:SS format
  if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(timestamp)) {
    const [hours, minutes, seconds] = timestamp.split(':').map(Number);
    return hours >= 0 && minutes >= 0 && seconds >= 0 && minutes < 60 && seconds < 60;
  }
  
  return false;
}

/**
 * Convert a timestamp string to seconds
 * @param timestamp Timestamp string (MM:SS or HH:MM:SS)
 * @returns Number of seconds
 */
function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  
  if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  return 0;
}

/**
 * Format seconds as a timestamp string (HH:MM:SS)
 * @param seconds Number of seconds
 * @returns Formatted timestamp
 */
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
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
  console.log("  MANUAL_TIMESTAMP_ENTRY=true (to manually specify clip timestamps)");
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
      if (config.useCustomSoundtrack) {
        console.log(`- Custom soundtrack: Added (${config.soundtrackPath})`);
      }
    }
  }
  
  if (videoPath) {
    const videoType = config.extractionEnabled ? "montage" : "short video";
    console.log(`\nGenerated ${videoType}: ${videoPath}`);
    if (!config.extractionEnabled) {
      console.log(`Duration: ${config.videoDuration} seconds`);
      console.log("Video format: MP4 (H.264) with zoom effects");
      if (config.useCustomSoundtrack) {
        console.log(`Custom soundtrack: ${config.soundtrackPath}`);
      }
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
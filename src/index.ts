import { logConfigStatus, config } from "./config";
import { 
  displayWelcome, 
  promptForYouTubeUrl, 
  validateAndExtractVideoId,
  displayStatus,
  displayError,
  displayApiKeyHelp,
  displayCompletion
} from "./cli";
import { createOutputDirectories } from "./utils/file-utils";
import { fetchTranscript, saveTranscript } from "./services/transcript-service";
import { extractKeyMoments, saveKeyMoments } from "./services/analysis-service";
import { generateImagesForKeyMoments } from "./services/image-service";
import { createShortVideo, checkFFmpegAvailability } from "./services/video-service";
import { ProcessedVideo } from "./types/youtube-transcript";

/**
 * Main application function
 */
async function main(): Promise<void> {
  try {
    // Display welcome message
    displayWelcome();
    
    // Check configuration
    logConfigStatus();
    
    // Get YouTube URL from user
    const youtubeUrl = promptForYouTubeUrl();
    
    // Extract and validate video ID
    const videoId = validateAndExtractVideoId(youtubeUrl);
    displayStatus(`Processing video ID: ${videoId}`);
    
    // Create output directories
    const { baseDir } = createOutputDirectories(videoId);
    
    // Initialize video data
    const videoData: ProcessedVideo = {
      videoId,
      url: youtubeUrl,
      transcript: "",
      outputDirectory: baseDir
    };
    
    // Fetch and save transcript
    displayStatus("Downloading transcript...");
    const transcript = await fetchTranscript(videoId);
    let processedVideo = {
      ...videoData,
      transcript
    };
    processedVideo = saveTranscript(processedVideo);
    displayStatus("Transcript downloaded and saved successfully");
    
    // Extract key moments if OpenAI API key is available
    if (config.openAiApiKey) {
      displayStatus("Analyzing transcript to extract key moments...");
      const keyMoments = await extractKeyMoments(transcript);
      processedVideo = {
        ...processedVideo,
        keyMoments
      };
      processedVideo = saveKeyMoments(processedVideo);
      displayStatus(`Extracted ${keyMoments.length} key moments from the video content`);
      
      // Generate images for key moments
      displayStatus("Generating images based on key moments...");
      processedVideo = await generateImagesForKeyMoments(processedVideo);
      displayStatus("Image generation completed");

      // Create video if enabled and FFmpeg is available
      if (config.videoEnabled && processedVideo.imagePaths && processedVideo.imagePaths.length > 0) {
        // Check if FFmpeg is installed
        const ffmpegAvailable = await checkFFmpegAvailability();
        
        if (ffmpegAvailable) {
          displayStatus("Creating short video from generated images...");
          const videoPath = await createShortVideo(processedVideo);
          
          processedVideo = {
            ...processedVideo,
            videoPath
          };
          
          displayStatus(`Video created successfully: ${videoPath}`);
        } else {
          displayStatus("Video creation skipped: FFmpeg not found. Please install FFmpeg to enable video creation.");
        }
      }
    } else {
      displayStatus("Skipping content analysis and image generation (OpenAI API key not set)");
      displayApiKeyHelp();
    }
    
    // Display completion message
    displayCompletion(videoId, processedVideo.imagePaths, processedVideo.videoPath);
    
  } catch (error: any) {
    // Handle errors
    displayError(error.message || "An unknown error occurred", error);
    
    if (!config.huggingFaceApiKey) {
      displayApiKeyHelp();
    }
    
    process.exit(1);
  }
}

// Run the application
if (require.main === module) {
  main().catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

export default main;
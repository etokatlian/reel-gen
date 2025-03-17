import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process";
import { ProcessedVideo } from "../types/youtube-transcript";
import { ensureDirectoryExists } from "../utils/file-utils";
import { config } from "../config";
import {
  createVoiceoverScript,
  generateVoiceover,
  getAudioDuration,
  calculateTargetWordCount,
  extendAudioToFillDuration,
} from "./tts-service";

/**
 * Extracts screenshots from a YouTube video at specific timestamps
 * @param videoData Processed video data
 * @param timestamps Array of timestamps (in seconds) to capture
 * @returns Promise resolving to array of screenshot file paths
 */
export async function extractScreenshots(
  videoData: ProcessedVideo,
  timestamps: number[]
): Promise<string[]> {
  if (!timestamps || timestamps.length === 0) {
    throw new Error("No timestamps provided for screenshot extraction");
  }

  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(videoData.outputDirectory, "screenshots");
  ensureDirectoryExists(screenshotsDir);

  console.log("Extracting screenshots from YouTube video...");

  const screenshotPaths: string[] = [];

  // Check if yt-dlp is installed
  const ytDlpAvailable = await checkYtDlpAvailability();
  if (!ytDlpAvailable) {
    throw new Error(
      "yt-dlp is not installed. Please install it to extract screenshots."
    );
  }

  // Check if FFmpeg is installed
  const ffmpegAvailable = await checkFFmpegAvailability();
  if (!ffmpegAvailable) {
    throw new Error(
      "FFmpeg is not installed. Please install it to extract screenshots."
    );
  }

  try {
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const outputPath = path.join(
        screenshotsDir,
        `${videoData.videoId}_screenshot_${i + 1}.jpg`
      );

      console.log(`Extracting screenshot at ${formatTimestamp(timestamp)}...`);

      await extractScreenshot(videoData.videoId, timestamp, outputPath);
      screenshotPaths.push(outputPath);

      console.log(`Screenshot saved to: ${outputPath}`);
    }

    return screenshotPaths;
  } catch (error) {
    console.error("Error extracting screenshots:", error);
    throw new Error(`Failed to extract screenshots: ${error}`);
  }
}

/**
 * Extracts video clips from a YouTube video at specific timestamp ranges
 * @param videoData Processed video data
 * @param clipRanges Array of objects with start and end timestamps
 * @returns Promise resolving to array of clip file paths
 */
export async function extractVideoClips(
  videoData: ProcessedVideo,
  clipRanges: { start: number; end: number }[]
): Promise<string[]> {
  if (!clipRanges || clipRanges.length === 0) {
    throw new Error("No clip ranges provided for video extraction");
  }

  // Create clips directory if it doesn't exist
  const clipsDir = path.join(videoData.outputDirectory, "clips");
  ensureDirectoryExists(clipsDir);

  console.log("Extracting video clips from YouTube video...");

  const clipPaths: string[] = [];

  // Check if yt-dlp is installed
  const ytDlpAvailable = await checkYtDlpAvailability();
  if (!ytDlpAvailable) {
    throw new Error(
      "yt-dlp is not installed. Please install it to extract video clips."
    );
  }

  // Check if FFmpeg is installed
  const ffmpegAvailable = await checkFFmpegAvailability();
  if (!ffmpegAvailable) {
    throw new Error(
      "FFmpeg is not installed. Please install it to extract video clips."
    );
  }

  try {
    for (let i = 0; i < clipRanges.length; i++) {
      const { start, end } = clipRanges[i];
      const duration = end - start;

      // Ensure duration is reasonable (between 1-10 seconds)
      if (duration < 1 || duration > 10) {
        console.warn(
          `Clip duration (${duration}s) outside recommended range. Adjusting to 5 seconds.`
        );
      }

      const adjustedDuration = Math.min(Math.max(duration, 1), 10);
      const outputPath = path.join(
        clipsDir,
        `${videoData.videoId}_clip_${i + 1}.mp4`
      );

      console.log(
        `Extracting ${adjustedDuration}s clip at ${formatTimestamp(start)}...`
      );

      await extractVideoClip(
        videoData.videoId,
        start,
        adjustedDuration,
        outputPath
      );
      clipPaths.push(outputPath);

      console.log(`Clip saved to: ${outputPath}`);
    }

    return clipPaths;
  } catch (error) {
    console.error("Error extracting video clips:", error);
    throw new Error(`Failed to extract video clips: ${error}`);
  }
}

/**
 * Creates a montage video from extracted clips
 * @param videoData Processed video data
 * @param clipPaths Array of clip file paths
 * @returns Promise resolving to the output video path
 */
export async function createVideoMontage(
  videoData: ProcessedVideo,
  clipPaths: string[]
): Promise<string> {
  if (!clipPaths || clipPaths.length === 0) {
    throw new Error("No video clips provided for montage creation");
  }

  // Create video directory if it doesn't exist
  const videoDir = path.join(videoData.outputDirectory, "video");
  ensureDirectoryExists(videoDir);

  // Output video path
  const outputVideoPath = path.join(
    videoDir,
    `${videoData.videoId}_montage.mp4`
  );

  console.log("Creating video montage from clips...");

  try {
    // Generate a file with the list of clips
    const clipListPath = path.join(
      videoDir,
      `${videoData.videoId}_clip_list.txt`
    );
    const clipListContent = clipPaths
      .map((clipPath) => `file '${clipPath}'`)
      .join("\n");
    fs.writeFileSync(clipListPath, clipListContent);

    // Create temporary intermediate file with concatenated clips
    const tempOutputPath = path.join(
      videoDir,
      `${videoData.videoId}_temp_montage.mp4`
    );

    // First create a temp file with concatenated clips
    let args = [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      clipListPath,
      "-c",
      "copy",
      tempOutputPath,
    ];

    await spawnFFmpeg(args);

    // Get the duration of the temp video
    const videoDuration = await getVideoDuration(tempOutputPath);
    if (!videoDuration) {
      throw new Error("Failed to get duration of concatenated video");
    }

    console.log(`Original video montage duration: ${videoDuration} seconds`);

    // Truncate to 15 seconds if longer
    const targetDuration = Math.min(videoDuration, config.videoDuration || 15);
    console.log(`Target video duration: ${targetDuration} seconds`);

    // Generate voiceover if enabled
    let voiceoverPath: string | null = null;
    if (config.aiVoiceoverEnabled) {
      console.log("Generating AI voiceover for the video...");
      try {
        // Calculate target voiceover duration based on the ratio
        const targetVoiceoverDuration =
          targetDuration * config.voiceoverDurationRatio;
        console.log(
          `Target voiceover duration: ${targetVoiceoverDuration.toFixed(2)}s (${
            config.voiceoverDurationRatio * 100
          }% of ${targetDuration}s video)`
        );

        // Calculate optimal word count based on video duration and speaking rate
        const voiceService = config.voiceoverTtsService || "openai";
        const voiceId = config.voiceoverVoice || "alloy";
        const voiceType =
          voiceService === "openai" ? `openai_${voiceId}` : "elevenlabs";

        // Use the calculateTargetWordCount function to get the optimal word count
        const optimalWordCount = calculateTargetWordCount(
          targetVoiceoverDuration,
          voiceType
        );

        // Using await with createVoiceoverScript as it's now async
        const script = await createVoiceoverScript(
          videoData.transcript,
          optimalWordCount
        );
        const voiceoverOutputPath = path.join(
          videoDir,
          `${videoData.videoId}_voiceover.mp3`
        );

        // Generate voiceover with the target duration
        voiceoverPath = await generateVoiceover(
          script,
          voiceoverOutputPath,
          targetDuration
        );

        // Measure the actual duration
        const voiceoverDuration = await getAudioDuration(voiceoverPath);
        if (voiceoverDuration) {
          console.log(
            `Generated voiceover duration: ${voiceoverDuration.toFixed(
              2
            )}s / ${targetVoiceoverDuration.toFixed(2)}s target`
          );

          // If the voiceover duration doesn't match our target, adjust it
          if (
            Math.abs(voiceoverDuration - targetVoiceoverDuration) >
            config.audioAdjustmentThreshold
          ) {
            console.log(
              `Adjusting voiceover to match target duration of ${targetVoiceoverDuration.toFixed(
                2
              )}s...`
            );
            const adjustedOutputPath = path.join(
              videoDir,
              `${videoData.videoId}_voiceover_adjusted.mp3`
            );

            // Add null check for voiceoverPath
            if (voiceoverPath) {
              const adjustedVoiceoverPath = await extendAudioToFillDuration(
                voiceoverPath,
                adjustedOutputPath,
                targetDuration
              );

              // Update the voiceover path and duration
              if (adjustedVoiceoverPath) {
                voiceoverPath = adjustedVoiceoverPath;
                const adjustedDuration = await getAudioDuration(voiceoverPath);
                console.log(
                  `Adjusted voiceover duration: ${adjustedDuration?.toFixed(
                    2
                  )}s / ${targetVoiceoverDuration.toFixed(2)}s target`
                );
              }
            }
          } else {
            console.log(
              "Voiceover duration is already within threshold of target, no adjustment needed"
            );
          }
        } else {
          console.log(`Voiceover generated at normal speaking rate`);
        }
      } catch (error) {
        console.error("Error generating voiceover:", error);
        console.log("Continuing without voiceover...");
      }
    } else {
      console.log(
        "AI voiceover is disabled. To enable, set AI_VOICEOVER_ENABLED=true in your .env file"
      );
    }

    // Build the final video with audio
    args = ["-y", "-i", tempOutputPath];

    // Add voiceover if available
    if (voiceoverPath) {
      args.push("-i", voiceoverPath);
    }

    // Add soundtrack if enabled
    let soundtrackUsed = false;
    if (config.useCustomSoundtrack && fs.existsSync(config.soundtrackPath)) {
      console.log(`Adding soundtrack: ${config.soundtrackPath}`);
      args.push("-i", config.soundtrackPath);
      soundtrackUsed = true;
    }

    // Setup audio filter based on enabled features
    let filterComplex = "";
    let audioMapping = "";

    // Determine the audio input index
    const voiceoverIndex = 1;
    const soundtrackIndex = voiceoverPath ? 2 : 1;

    if (config.aiVoiceoverEnabled && voiceoverPath) {
      if (!soundtrackUsed) {
        // Only voiceover
        filterComplex = `[${voiceoverIndex}:a]volume=${config.voiceoverVolume}[a]`;
        audioMapping = "-map 0:v -map [a]";
        console.log(
          `Using voiceover with volume: ${config.voiceoverVolume * 100}%`
        );
      } else {
        // Both voiceover and soundtrack - fixed to use amix with longest duration
        filterComplex =
          `[${voiceoverIndex}:a]volume=${config.voiceoverVolume}[voice];` +
          `[${soundtrackIndex}:a]volume=${config.soundtrackVolume}[music];` +
          `[voice][music]amix=inputs=2:duration=longest[a]`;
        audioMapping = "-map 0:v -map [a]";
        console.log(
          `Mixing voiceover (${
            config.voiceoverVolume * 100
          }%) with soundtrack (${config.soundtrackVolume * 100}%)`
        );
      }
    } else if (soundtrackUsed) {
      // Only soundtrack - removed the aloop filter
      filterComplex = `[${soundtrackIndex}:a]volume=${config.soundtrackVolume}[a]`;
      audioMapping = "-map 0:v -map [a]";
      console.log(
        `Using soundtrack with volume: ${config.soundtrackVolume * 100}%`
      );
    } else if (!config.removeAudio) {
      // No custom audio, keep original (if not removed)
      audioMapping = "-map 0";
      console.log("Using original audio from clips");
    } else {
      // Audio was removed and no other audio sources
      audioMapping = "-map 0:v";
      console.log(
        "No audio in final video (original audio removed, no voiceover or soundtrack)"
      );
    }

    // Add filter complex if we have one
    if (filterComplex) {
      args.push("-filter_complex", filterComplex);
    }

    // Add audio mapping
    args.push(...audioMapping.split(" "));

    // Add encoding options - always copy video to avoid re-encoding
    args.push("-c:v", "copy", "-c:a", "aac");

    // Important! Set the duration to enforce the 15 second limit
    args.push("-t", targetDuration.toString());

    // Save the FFmpeg command for debugging
    const commandPath = path.join(
      videoDir,
      `${videoData.videoId}_ffmpeg_command.txt`
    );
    fs.writeFileSync(
      commandPath,
      ["ffmpeg", ...args, outputVideoPath].join(" ")
    );

    // Add output path to args
    args.push(outputVideoPath);

    await spawnFFmpeg(args);

    // Clean up temp file
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }

    console.log(`Video montage created at: ${outputVideoPath}`);

    return outputVideoPath;
  } catch (error) {
    console.error("Error creating video montage:", error);
    throw new Error(`Failed to create video montage: ${error}`);
  }
}

/**
 * Get the duration of a video file using FFmpeg
 * @param videoPath Path to the video file
 * @returns Promise resolving to the duration in seconds
 */
async function getVideoDuration(videoPath: string): Promise<number | null> {
  return new Promise((resolve) => {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;

    childProcess.exec(command, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error("Error getting video duration:", error || stderr);
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
 * Extract a screenshot from a YouTube video at a specific timestamp
 * @param videoId YouTube video ID
 * @param timestamp Timestamp in seconds
 * @param outputPath Path to save the screenshot
 */
async function extractScreenshot(
  videoId: string,
  timestamp: number,
  outputPath: string
): Promise<void> {
  // First, get video URL with yt-dlp
  const videoUrl = await getVideoDownloadUrl(videoId);

  // Extract frame with FFmpeg
  const args = [
    "-y",
    "-ss",
    formatTimestamp(timestamp),
    "-i",
    videoUrl,
    "-frames:v",
    "1",
    "-q:v",
    "2",
    outputPath,
  ];

  await spawnFFmpeg(args);
}

/**
 * Extract a video clip from a YouTube video at a specific timestamp and duration
 * @param videoId YouTube video ID
 * @param startTime Start timestamp in seconds
 * @param duration Duration in seconds
 * @param outputPath Path to save the clip
 */
async function extractVideoClip(
  videoId: string,
  startTime: number,
  duration: number,
  outputPath: string
): Promise<void> {
  // First, get video URL with yt-dlp
  const videoUrl = await getVideoDownloadUrl(videoId);

  // Extract clip with FFmpeg, applying subtitle and audio removal options if enabled
  const args = [
    "-y",
    "-ss",
    formatTimestamp(startTime),
    "-i",
    videoUrl,
    "-t",
    duration.toString(),
  ];

  // Add video codec and quality settings
  args.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "22");

  // Handle audio based on config
  if (config.removeAudio) {
    // Remove audio stream entirely
    args.push("-an");
    console.log("Removing audio from clip...");
  } else {
    // Keep audio with AAC codec
    args.push("-c:a", "aac");
  }

  // Handle subtitles based on config
  if (config.removeSubtitles) {
    // Remove subtitle streams
    args.push("-sn");
    console.log("Removing subtitles from clip...");
  }

  // Add output path
  args.push(outputPath);

  await spawnFFmpeg(args);
}

/**
 * Process a clip to remove audio and/or subtitles
 * @param inputPath Path to input video
 * @param outputPath Path to save the processed video
 * @param removeAudio Whether to remove audio
 * @param removeSubtitles Whether to remove subtitles
 */
export async function processVideoClip(
  inputPath: string,
  outputPath: string,
  removeAudio: boolean = false,
  removeSubtitles: boolean = false
): Promise<void> {
  console.log(`Processing video clip: ${path.basename(inputPath)}`);

  // FFmpeg arguments
  const args = ["-y", "-i", inputPath];

  // Copy video stream
  args.push("-c:v", "copy");

  // Handle audio based on removeAudio flag
  if (removeAudio) {
    // Remove audio stream entirely
    args.push("-an");
    console.log("Removing audio...");
  } else {
    // Copy audio stream
    args.push("-c:a", "copy");
  }

  // Handle subtitles based on removeSubtitles flag
  if (removeSubtitles) {
    // Remove subtitle streams
    args.push("-sn");
    console.log("Removing subtitles...");
  }

  // Add output path
  args.push(outputPath);

  await spawnFFmpeg(args);

  console.log(`Processed clip saved to: ${outputPath}`);
}

/**
 * Process existing clips to remove audio and/or subtitles
 * @param clipPaths Array of clip file paths
 * @param outputDir Directory to save processed clips
 * @param removeAudio Whether to remove audio
 * @param removeSubtitles Whether to remove subtitles
 * @returns Promise resolving to array of processed clip file paths
 */
export async function processExistingClips(
  clipPaths: string[],
  outputDir: string,
  removeAudio: boolean = false,
  removeSubtitles: boolean = false
): Promise<string[]> {
  if (!clipPaths || clipPaths.length === 0) {
    throw new Error("No video clips provided for processing");
  }

  if (!removeAudio && !removeSubtitles) {
    return clipPaths; // No processing needed
  }

  // Ensure output directory exists
  ensureDirectoryExists(outputDir);

  const processedClipPaths: string[] = [];

  try {
    for (let i = 0; i < clipPaths.length; i++) {
      const clipPath = clipPaths[i];
      const clipName = path.basename(clipPath);

      // Add suffix to indicate processing
      const suffix = [];
      if (removeAudio) suffix.push("noaudio");
      if (removeSubtitles) suffix.push("nosubs");

      const outputPath = path.join(
        outputDir,
        `${path.basename(clipName, path.extname(clipName))}_${suffix.join(
          "_"
        )}${path.extname(clipName)}`
      );

      await processVideoClip(
        clipPath,
        outputPath,
        removeAudio,
        removeSubtitles
      );
      processedClipPaths.push(outputPath);
    }

    return processedClipPaths;
  } catch (error) {
    console.error("Error processing video clips:", error);
    throw new Error(`Failed to process video clips: ${error}`);
  }
}

/**
 * Add a soundtrack to an existing video
 * @param inputPath Path to input video
 * @param outputPath Path to save the output video
 * @param soundtrackPath Path to the soundtrack file
 * @param volume Volume level (0.0-1.0)
 */
export async function addSoundtrackToVideo(
  inputPath: string,
  outputPath: string,
  soundtrackPath: string,
  volume: number = 0.5
): Promise<void> {
  console.log(`Adding soundtrack to video: ${path.basename(inputPath)}`);

  if (!fs.existsSync(soundtrackPath)) {
    throw new Error(`Soundtrack file not found: ${soundtrackPath}`);
  }

  // Get the video duration
  const videoDuration = await getVideoDuration(inputPath);
  if (!videoDuration) {
    throw new Error("Failed to get video duration");
  }

  // FFmpeg arguments with improved audio mix
  const args = [
    "-y",
    "-i",
    inputPath,
    "-i",
    soundtrackPath,
    "-filter_complex",
    `[1:a]volume=${volume}[a]`,
    "-map",
    "0:v",
    "-map",
    "[a]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-t",
    videoDuration.toString(),
    outputPath,
  ];

  await spawnFFmpeg(args);

  console.log(`Video with soundtrack saved to: ${outputPath}`);
}

/**
 * Get a direct video URL from YouTube using yt-dlp
 * @param videoId YouTube video ID
 * @returns Promise resolving to a direct video URL
 */
async function getVideoDownloadUrl(videoId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Use yt-dlp to get the direct video URL without downloading
    const command = `yt-dlp -f "best[height<=720]" --get-url ${youtubeUrl}`;

    childProcess.exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("yt-dlp error:", stderr);
        reject(new Error(`Failed to get video URL: ${error.message}`));
        return;
      }

      // Get the first line of output (direct URL)
      const directUrl = stdout.trim().split("\n")[0];

      if (!directUrl) {
        reject(new Error("Failed to get direct video URL from yt-dlp"));
        return;
      }

      resolve(directUrl);
    });
  });
}

/**
 * Format a timestamp in seconds to HH:MM:SS format
 * @param seconds Timestamp in seconds
 * @returns Formatted timestamp string
 */
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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

    // Set a timeout to kill the process if it takes too long
    const timeout = setTimeout(() => {
      console.warn(
        "FFmpeg process timed out after 2 minutes, killing process..."
      );
      process.kill();
      reject(new Error("FFmpeg process timed out after 2 minutes"));
    }, 120000); // 2 minutes

    // Clear the timeout when the process completes
    process.on("close", () => {
      clearTimeout(timeout);
    });
  });
}

/**
 * Check if FFmpeg is installed on the system
 * @returns Promise resolving to boolean indicating if FFmpeg is available
 */
export async function checkFFmpegAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    childProcess.exec("ffmpeg -version", (error) => {
      if (error) {
        console.warn("FFmpeg is not installed or not found in PATH");
        resolve(false);
        return;
      }

      resolve(true);
    });
  });
}

/**
 * Check if yt-dlp is installed on the system
 * @returns Promise resolving to boolean indicating if yt-dlp is available
 */
export async function checkYtDlpAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    childProcess.exec("yt-dlp --version", (error) => {
      if (error) {
        console.warn("yt-dlp is not installed or not found in PATH");
        resolve(false);
        return;
      }

      resolve(true);
    });
  });
}

/**
 * Determine key timestamps from transcript segments
 * @param transcriptSegments Array of transcript segments with timestamps
 * @param numberOfTimestamps Number of timestamps to extract
 * @returns Array of timestamps in seconds
 */
export function extractKeyTimestamps(
  transcriptSegments: Array<{ text: string; offset: number }>,
  numberOfTimestamps: number = 3
): number[] {
  if (!transcriptSegments || transcriptSegments.length === 0) {
    throw new Error("No transcript segments provided");
  }

  // Sort segments by offset time
  const sortedSegments = [...transcriptSegments].sort(
    (a, b) => a.offset - b.offset
  );

  // Get total duration
  const totalDuration = sortedSegments[sortedSegments.length - 1].offset;

  // Calculate evenly distributed timestamps
  const timestamps: number[] = [];

  for (let i = 0; i < numberOfTimestamps; i++) {
    // Find timestamp at position totalDuration * (i + 1) / (numberOfTimestamps + 1)
    // This distributes the timestamps evenly across the video duration
    const targetOffset = (totalDuration * (i + 1)) / (numberOfTimestamps + 1);

    // Find the segment closest to this offset
    const closestSegment = sortedSegments.reduce((prev, curr) => {
      return Math.abs(curr.offset - targetOffset) <
        Math.abs(prev.offset - targetOffset)
        ? curr
        : prev;
    });

    timestamps.push(closestSegment.offset);
  }

  return timestamps;
}

/**
 * Determine key clip ranges from transcript segments
 * @param transcriptSegments Array of transcript segments with timestamps
 * @param numberOfClips Number of clips to extract
 * @param clipDuration Duration of each clip in seconds
 * @returns Array of clip ranges with start and end times
 */
export function extractKeyClipRanges(
  transcriptSegments: Array<{ text: string; offset: number; duration: number }>,
  numberOfClips: number = 3,
  clipDuration: number = 5
): Array<{ start: number; end: number }> {
  if (!transcriptSegments || transcriptSegments.length === 0) {
    throw new Error("No transcript segments provided");
  }

  // Sort segments by offset time
  const sortedSegments = [...transcriptSegments].sort(
    (a, b) => a.offset - b.offset
  );

  // Get total duration
  const totalDuration =
    sortedSegments[sortedSegments.length - 1].offset +
    sortedSegments[sortedSegments.length - 1].duration;

  // Calculate evenly distributed clip ranges
  const clipRanges: Array<{ start: number; end: number }> = [];

  for (let i = 0; i < numberOfClips; i++) {
    // Find timestamp at position totalDuration * (i + 1) / (numberOfClips + 1)
    // This distributes the clips evenly across the video duration
    const targetOffset = (totalDuration * (i + 1)) / (numberOfClips + 1);

    // Find the segment closest to this offset
    const closestSegment = sortedSegments.reduce((prev, curr) => {
      return Math.abs(curr.offset - targetOffset) <
        Math.abs(prev.offset - targetOffset)
        ? curr
        : prev;
    });

    // Calculate start and end times
    const start = closestSegment.offset;
    const end = start + Math.min(clipDuration, closestSegment.duration);

    clipRanges.push({ start, end });
  }

  return clipRanges;
}

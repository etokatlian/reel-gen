import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process";
import { ProcessedVideo } from "../types/youtube-transcript";
import { ensureDirectoryExists } from "../utils/file-utils";
import { config } from "../config";

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
    throw new Error("yt-dlp is not installed. Please install it to extract screenshots.");
  }
  
  // Check if FFmpeg is installed
  const ffmpegAvailable = await checkFFmpegAvailability();
  if (!ffmpegAvailable) {
    throw new Error("FFmpeg is not installed. Please install it to extract screenshots.");
  }

  try {
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const outputPath = path.join(screenshotsDir, `${videoData.videoId}_screenshot_${i + 1}.jpg`);
      
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
    throw new Error("yt-dlp is not installed. Please install it to extract video clips.");
  }
  
  // Check if FFmpeg is installed
  const ffmpegAvailable = await checkFFmpegAvailability();
  if (!ffmpegAvailable) {
    throw new Error("FFmpeg is not installed. Please install it to extract video clips.");
  }

  try {
    for (let i = 0; i < clipRanges.length; i++) {
      const { start, end } = clipRanges[i];
      const duration = end - start;
      
      // Ensure duration is reasonable (between 1-10 seconds)
      if (duration < 1 || duration > 10) {
        console.warn(`Clip duration (${duration}s) outside recommended range. Adjusting to 5 seconds.`);
      }
      
      const adjustedDuration = Math.min(Math.max(duration, 1), 10);
      const outputPath = path.join(clipsDir, `${videoData.videoId}_clip_${i + 1}.mp4`);
      
      console.log(`Extracting ${adjustedDuration}s clip at ${formatTimestamp(start)}...`);
      
      await extractVideoClip(videoData.videoId, start, adjustedDuration, outputPath);
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
    // Check if we're using a custom soundtrack
    if (config.useCustomSoundtrack && fs.existsSync(config.soundtrackPath)) {
      console.log(`Adding soundtrack: ${config.soundtrackPath}`);
      
      // We'll create a custom approach using filter_complex
      // First, create temporary intermediate file with concatenated clips
      const tempOutputPath = path.join(videoDir, `${videoData.videoId}_temp_montage.mp4`);
      
      // Generate a file with the list of clips
      const clipListPath = path.join(videoDir, `${videoData.videoId}_clip_list.txt`);
      const clipListContent = clipPaths.map(clipPath => `file '${clipPath}'`).join('\n');
      fs.writeFileSync(clipListPath, clipListContent);
      
      // First create a temp file with concatenated clips
      let args = [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', clipListPath,
        '-c', 'copy',
        tempOutputPath
      ];
      
      await spawnFFmpeg(args);
      
      // Now add the soundtrack to the temp file
      args = [
        '-y',
        '-i', tempOutputPath,
        '-i', config.soundtrackPath,
        '-filter_complex', `[1:a]volume=${config.soundtrackVolume}[a]`,
        '-map', '0:v',
        '-map', '[a]',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-shortest',
        outputVideoPath
      ];
      
      await spawnFFmpeg(args);
      
      // Clean up temp file
      if (fs.existsSync(tempOutputPath)) {
        fs.unlinkSync(tempOutputPath);
      }
    } else {
      // Original behavior - no soundtrack
      // Generate a file with the list of clips
      const clipListPath = path.join(videoDir, `${videoData.videoId}_clip_list.txt`);
      const clipListContent = clipPaths.map(clipPath => `file '${clipPath}'`).join('\n');
      fs.writeFileSync(clipListPath, clipListContent);
      
      // Create montage using FFmpeg concat demuxer
      const args = [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', clipListPath,
        '-c', 'copy',
        outputVideoPath
      ];
      
      await spawnFFmpeg(args);
    }
    
    console.log(`Video montage created at: ${outputVideoPath}`);
    
    return outputVideoPath;
  } catch (error) {
    console.error("Error creating video montage:", error);
    throw new Error(`Failed to create video montage: ${error}`);
  }
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
    '-y',
    '-ss', formatTimestamp(timestamp),
    '-i', videoUrl,
    '-frames:v', '1',
    '-q:v', '2',
    outputPath
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
    '-y',
    '-ss', formatTimestamp(startTime),
    '-i', videoUrl,
    '-t', duration.toString()
  ];
  
  // Add video codec and quality settings
  args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22');
  
  // Handle audio based on config
  if (config.removeAudio) {
    // Remove audio stream entirely
    args.push('-an');
    console.log('Removing audio from clip...');
  } else {
    // Keep audio with AAC codec
    args.push('-c:a', 'aac');
  }
  
  // Handle subtitles based on config
  if (config.removeSubtitles) {
    // Remove subtitle streams
    args.push('-sn');
    console.log('Removing subtitles from clip...');
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
  const args = [
    '-y',
    '-i', inputPath
  ];
  
  // Copy video stream
  args.push('-c:v', 'copy');
  
  // Handle audio based on removeAudio flag
  if (removeAudio) {
    // Remove audio stream entirely
    args.push('-an');
    console.log('Removing audio...');
  } else {
    // Copy audio stream
    args.push('-c:a', 'copy');
  }
  
  // Handle subtitles based on removeSubtitles flag
  if (removeSubtitles) {
    // Remove subtitle streams
    args.push('-sn');
    console.log('Removing subtitles...');
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
      if (removeAudio) suffix.push('noaudio');
      if (removeSubtitles) suffix.push('nosubs');
      
      const outputPath = path.join(
        outputDir,
        `${path.basename(clipName, path.extname(clipName))}_${suffix.join('_')}${path.extname(clipName)}`
      );
      
      await processVideoClip(clipPath, outputPath, removeAudio, removeSubtitles);
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
  
  // FFmpeg arguments
  const args = [
    '-y',
    '-i', inputPath,
    '-i', soundtrackPath,
    '-filter_complex', `[1:a]volume=${volume}[a]`,
    '-map', '0:v',
    '-map', '[a]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-shortest',
    outputPath
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
      const directUrl = stdout.trim().split('\n')[0];
      
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
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Executes FFmpeg using spawn for better process handling
 * @param args Array of arguments to pass to FFmpeg
 * @returns Promise that resolves when command completes
 */
function spawnFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create a process
    const process = childProcess.spawn('ffmpeg', args);
    
    let stderrData = '';
    
    // Capture stderr (FFmpeg outputs progress here)
    process.stderr.on('data', (data) => {
      const text = data.toString();
      stderrData += text;
      
      // Only log occasionally to avoid console spam
      if (text.includes('frame=') && text.includes('fps=')) {
        const frameMatch = text.match(/frame=\s*(\d+)/);
        if (frameMatch && parseInt(frameMatch[1], 10) % 20 === 0) {
          console.log(`FFmpeg progress: ${text.trim()}`);
        }
      } else if (text.includes('Error') || text.includes('error') || text.includes('failed')) {
        // Always log errors
        console.error(`FFmpeg error: ${text.trim()}`);
      }
    });
    
    // Handle process completion
    process.on('close', (code) => {
      if (code === 0) {
        // Success
        resolve();
      } else {
        // Error
        console.error(`FFmpeg process exited with code ${code}`);
        console.error('FFmpeg stderr output:', stderrData);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
    
    // Handle process errors
    process.on('error', (err) => {
      console.error('Failed to start FFmpeg process:', err);
      reject(err);
    });
    
    // Set a timeout to kill the process if it takes too long
    const timeout = setTimeout(() => {
      console.warn('FFmpeg process timed out after 2 minutes, killing process...');
      process.kill();
      reject(new Error('FFmpeg process timed out after 2 minutes'));
    }, 120000); // 2 minutes
    
    // Clear the timeout when the process completes
    process.on('close', () => {
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
  const sortedSegments = [...transcriptSegments].sort((a, b) => a.offset - b.offset);
  
  // Get total duration
  const totalDuration = sortedSegments[sortedSegments.length - 1].offset;
  
  // Calculate evenly distributed timestamps
  const timestamps: number[] = [];
  
  for (let i = 0; i < numberOfTimestamps; i++) {
    // Find timestamp at position totalDuration * (i + 1) / (numberOfTimestamps + 1)
    // This distributes the timestamps evenly across the video duration
    const targetOffset = totalDuration * (i + 1) / (numberOfTimestamps + 1);
    
    // Find the segment closest to this offset
    const closestSegment = sortedSegments.reduce((prev, curr) => {
      return Math.abs(curr.offset - targetOffset) < Math.abs(prev.offset - targetOffset) ? curr : prev;
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
  const sortedSegments = [...transcriptSegments].sort((a, b) => a.offset - b.offset);
  
  // Get total duration
  const totalDuration = sortedSegments[sortedSegments.length - 1].offset + 
                        sortedSegments[sortedSegments.length - 1].duration;
  
  // Calculate evenly distributed clip ranges
  const clipRanges: Array<{ start: number; end: number }> = [];
  
  for (let i = 0; i < numberOfClips; i++) {
    // Find timestamp at position totalDuration * (i + 1) / (numberOfClips + 1)
    // This distributes the clips evenly across the video duration
    const targetOffset = totalDuration * (i + 1) / (numberOfClips + 1);
    
    // Find the segment closest to this offset
    const closestSegment = sortedSegments.reduce((prev, curr) => {
      return Math.abs(curr.offset - targetOffset) < Math.abs(prev.offset - targetOffset) ? curr : prev;
    });
    
    // Calculate start and end times
    const start = closestSegment.offset;
    const end = start + Math.min(clipDuration, closestSegment.duration);
    
    clipRanges.push({ start, end });
  }
  
  return clipRanges;
}
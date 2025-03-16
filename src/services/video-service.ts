import * as path from "path";
import * as fs from "fs";
import { exec, spawn } from "child_process";
import { ProcessedVideo } from "../types/youtube-transcript";
import { ensureDirectoryExists } from "../utils/file-utils";
import { config } from "../config";

/**
 * Creates a video from a series of images with a zoom effect
 * @param videoData Processed video data with image paths
 * @returns Promise resolving to video file path
 */
export async function createShortVideo(
  videoData: ProcessedVideo
): Promise<string> {
  if (!videoData.imagePaths || videoData.imagePaths.length === 0) {
    throw new Error("No images available for video creation");
  }

  // Create video directory if it doesn't exist
  const videoDir = path.join(videoData.outputDirectory, "video");
  ensureDirectoryExists(videoDir);

  // Output video path
  const outputVideoPath = path.join(
    videoDir,
    `${videoData.videoId}_short.mp4`
  );

  // Total video duration in seconds
  const totalDuration = config.videoDuration || 15;
  
  // Duration per image in seconds
  const durationPerImage = totalDuration / videoData.imagePaths.length;
  
  try {
    console.log("Generating short video...");
    
    // We'll use the simplest possible FFmpeg command to avoid any complexity
    const ffmpegArgs = [
      '-y', // Overwrite output files without asking
    ];

    // Add input files
    videoData.imagePaths.forEach(imagePath => {
      ffmpegArgs.push('-loop', '1', '-t', durationPerImage.toString(), '-i', imagePath);
    });

    // Add soundtrack if enabled
    let filterComplex = `concat=n=${videoData.imagePaths.length}:v=1:a=0[v]`;
    
    if (config.useCustomSoundtrack && fs.existsSync(config.soundtrackPath)) {
      console.log(`Adding soundtrack: ${config.soundtrackPath}`);
      
      // Add soundtrack as input
      ffmpegArgs.push('-i', config.soundtrackPath);
      
      // Modify filter complex to include audio
      filterComplex = `concat=n=${videoData.imagePaths.length}:v=1:a=0[v];[${videoData.imagePaths.length}:a]volume=${config.soundtrackVolume}[a]`;
      
      // Add filter for concatenation and output options with audio
      ffmpegArgs.push(
        '-filter_complex', filterComplex,
        '-map', '[v]',
        '-map', '[a]',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-shortest', // End when the shortest input stream ends
        '-preset', 'ultrafast', // Use ultrafast preset for speed
        '-pix_fmt', 'yuv420p',
        '-t', totalDuration.toString(), // Limit to total duration
        outputVideoPath
      );
    } else {
      // Original behavior - no soundtrack
      ffmpegArgs.push(
        '-filter_complex', filterComplex,
        '-map', '[v]',
        '-c:v', 'libx264',
        '-preset', 'ultrafast', // Use ultrafast preset for speed
        '-pix_fmt', 'yuv420p',
        '-t', (durationPerImage * videoData.imagePaths.length).toString(),
        outputVideoPath
      );
    }
    
    // For debugging - save the command to a file
    const commandPath = path.join(videoDir, `${videoData.videoId}_ffmpeg_command.txt`);
    fs.writeFileSync(commandPath, ['ffmpeg', ...ffmpegArgs].join(' '));
    
    console.log("Executing FFmpeg directly with spawn...");
    
    // Execute FFmpeg using spawn instead of exec
    await spawnFFmpeg(ffmpegArgs);
    
    console.log(`Video successfully created at: ${outputVideoPath}`);
    
    return outputVideoPath;
  } catch (error) {
    console.error("Error creating video:", error);
    throw new Error(`Failed to create video: ${error}`);
  }
}

/**
 * Executes FFmpeg using spawn for better process handling
 * @param args Array of arguments to pass to FFmpeg
 * @returns Promise that resolves when command completes
 */
function spawnFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create a process
    const process = spawn('ffmpeg', args);
    
    let stdoutData = '';
    let stderrData = '';
    
    // Capture stdout
    process.stdout.on('data', (data) => {
      const text = data.toString();
      stdoutData += text;
      console.log(`FFmpeg stdout: ${text.trim()}`);
    });
    
    // Capture stderr (FFmpeg outputs progress here)
    process.stderr.on('data', (data) => {
      const text = data.toString();
      stderrData += text;
      
      // Only log frame updates occasionally to avoid console spam
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
    exec("ffmpeg -version", (error) => {
      if (error) {
        console.warn("FFmpeg is not installed or not found in PATH");
        resolve(false);
        return;
      }
      
      resolve(true);
    });
  });
}
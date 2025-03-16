import * as path from "path";
import * as fs from "fs";
import { exec, spawn } from "child_process";
import { ProcessedVideo } from "../types/youtube-transcript";
import { ensureDirectoryExists } from "../utils/file-utils";
import { config } from "../config";
import {
  createVoiceoverScript,
  generateVoiceover,
  getAudioDuration,
  extendAudioToFillDuration,
  calculateTargetWordCount,
} from "./tts-service";

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
  const outputVideoPath = path.join(videoDir, `${videoData.videoId}_short.mp4`);

  // Total video duration in seconds - strictly enforce 15 seconds
  const totalDuration = config.videoDuration || 15;

  // Duration per image in seconds
  const durationPerImage = totalDuration / videoData.imagePaths.length;

  try {
    console.log("Generating short video...");
    console.log(
      `Target video duration: ${totalDuration} seconds (${durationPerImage.toFixed(
        2
      )}s per image)`
    );

    // Generate voiceover if enabled
    let voiceoverPath: string | null = null;
    let voiceoverDuration: number | null = null;
    let adjustedVoiceoverPath: string | null = null;

    if (config.aiVoiceoverEnabled) {
      console.log("Generating AI voiceover for the video...");
      try {
        // Calculate target voiceover duration based on the ratio
        const targetVoiceoverDuration =
          totalDuration * config.voiceoverDurationRatio;
        console.log(
          `Target voiceover duration: ${targetVoiceoverDuration.toFixed(2)}s (${
            config.voiceoverDurationRatio * 100
          }% of ${totalDuration}s video)`
        );

        // Calculate optimal word count based on video duration and speaking rate
        // This is a key improvement - we dynamically calculate the word count based on the video duration
        const voiceService = config.voiceoverTtsService || "openai";
        const voiceId = config.voiceoverVoice || "alloy";
        const voiceType =
          voiceService === "openai" ? `openai_${voiceId}` : "elevenlabs";

        // Use the calculateTargetWordCount function to get the optimal word count
        const optimalWordCount = calculateTargetWordCount(
          targetVoiceoverDuration,
          voiceType
        );

        // Create a script with appropriate length for the video duration
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
          totalDuration
        );

        // Measure the actual duration - this is key for accurate synchronization
        voiceoverDuration = await getAudioDuration(voiceoverPath);
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
            adjustedVoiceoverPath = await extendAudioToFillDuration(
              voiceoverPath,
              adjustedOutputPath,
              totalDuration
            );

            // Update the voiceover path and duration
            if (adjustedVoiceoverPath) {
              voiceoverPath = adjustedVoiceoverPath;
              voiceoverDuration = await getAudioDuration(voiceoverPath);
              console.log(
                `Adjusted voiceover duration: ${voiceoverDuration?.toFixed(
                  2
                )}s / ${targetVoiceoverDuration.toFixed(2)}s target`
              );
            }
          } else {
            console.log(
              "Voiceover duration is already within 0.1s of target, no adjustment needed"
            );
          }
        }
      } catch (error) {
        console.error("Error generating voiceover:", error);
        console.log("Continuing without voiceover...");
        voiceoverPath = null;
      }
    } else {
      console.log(
        "AI voiceover is disabled. To enable, set AI_VOICEOVER_ENABLED=true in your .env file"
      );
    }

    // Add soundtrack if enabled
    let soundtrackPath: string | null = null;

    if (config.useCustomSoundtrack && fs.existsSync(config.soundtrackPath)) {
      soundtrackPath = config.soundtrackPath;
      console.log(`Using soundtrack: ${soundtrackPath}`);
    }

    // Now proceed with video creation using a different approach to ensure audio syncs properly
    console.log("Building FFmpeg command for video creation...");

    // We'll use a different FFmpeg approach that gives us better control over audio sync
    const ffmpegArgs = [
      "-y", // Overwrite output files without asking
    ];

    // Add input files - images
    videoData.imagePaths.forEach((imagePath) => {
      ffmpegArgs.push(
        "-loop",
        "1",
        "-t",
        durationPerImage.toString(),
        "-i",
        imagePath
      );
    });

    // Add voiceover if available
    if (voiceoverPath) {
      ffmpegArgs.push("-i", voiceoverPath);
    }

    // Add soundtrack if available
    if (soundtrackPath) {
      ffmpegArgs.push("-i", soundtrackPath);
    }

    // Base video filter (concatenate images)
    let filterComplex = `concat=n=${videoData.imagePaths.length}:v=1:a=0[mainvideo]`;

    // Setup complex audio mixing based on what inputs we have
    const voiceoverIndex = videoData.imagePaths.length; // First audio input after images
    const soundtrackIndex = voiceoverPath ? voiceoverIndex + 1 : voiceoverIndex; // Second audio input or first if no voiceover

    // Add video mapping
    ffmpegArgs.push("-map", "[mainvideo]");

    if (voiceoverPath && soundtrackPath) {
      // We have both voiceover and soundtrack - mix them with proper levels
      // Instead of using aloop (which has syntax issues), we'll use the amix filter
      // with duration=longest to ensure the soundtrack plays for the entire video
      filterComplex += `;[${voiceoverIndex}:a]volume=${config.voiceoverVolume}[voice];`;
      filterComplex += `[${soundtrackIndex}:a]volume=${config.soundtrackVolume}[music];`;
      filterComplex += `[voice][music]amix=inputs=2:duration=longest[mainaudio]`;

      // Add audio mapping
      ffmpegArgs.push("-map", "[mainaudio]");

      console.log(
        `Mixing voiceover (${
          config.voiceoverVolume * 100
        }%) with continuous soundtrack (${config.soundtrackVolume * 100}%)`
      );
    } else if (voiceoverPath) {
      // Only voiceover, no soundtrack
      filterComplex += `;[${voiceoverIndex}:a]volume=${config.voiceoverVolume}[mainaudio]`;
      ffmpegArgs.push("-map", "[mainaudio]");
      console.log(
        `Using voiceover with volume: ${config.voiceoverVolume * 100}%`
      );
    } else if (soundtrackPath) {
      // Only soundtrack, no voiceover
      // Just use the soundtrack for the entire duration without aloop
      filterComplex += `;[${soundtrackIndex}:a]volume=${config.soundtrackVolume}[mainaudio]`;
      ffmpegArgs.push("-map", "[mainaudio]");
      console.log(
        `Using continuous soundtrack with volume: ${
          config.soundtrackVolume * 100
        }%`
      );
    }

    // Add filter complex
    ffmpegArgs.push("-filter_complex", filterComplex);

    // Add encoding options
    ffmpegArgs.push(
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac"
    );

    // Set exact duration for the entire video
    ffmpegArgs.push("-t", totalDuration.toString());

    // Output file
    ffmpegArgs.push(outputVideoPath);

    // Save the command for debugging
    const commandPath = path.join(
      videoDir,
      `${videoData.videoId}_ffmpeg_command.txt`
    );
    fs.writeFileSync(commandPath, ["ffmpeg", ...ffmpegArgs].join(" "));

    console.log("Executing FFmpeg to create final video...");
    await spawnFFmpeg(ffmpegArgs);

    // Verify the output video duration
    const actualDuration = await getVideoDuration(outputVideoPath);
    console.log(
      `Video created with duration: ${
        actualDuration ? actualDuration.toFixed(2) : "unknown"
      } seconds`
    );

    return outputVideoPath;
  } catch (error) {
    console.error("Error creating video:", error);
    throw new Error(`Failed to create video: ${error}`);
  }
}

/**
 * Get the duration of a video file using FFmpeg
 * @param videoPath Path to the video file
 * @returns Promise resolving to the duration in seconds or null on error
 */
async function getVideoDuration(videoPath: string): Promise<number | null> {
  return new Promise((resolve) => {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;

    exec(command, (error, stdout, stderr) => {
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
 * Executes FFmpeg using spawn for better process handling
 * @param args Array of arguments to pass to FFmpeg
 * @returns Promise that resolves when command completes
 */
function spawnFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create a process
    const process = spawn("ffmpeg", args);

    let stdoutData = "";
    let stderrData = "";

    // Capture stdout
    process.stdout.on("data", (data) => {
      const text = data.toString();
      stdoutData += text;
      console.log(`FFmpeg stdout: ${text.trim()}`);
    });

    // Capture stderr (FFmpeg outputs progress here)
    process.stderr.on("data", (data) => {
      const text = data.toString();
      stderrData += text;

      // Only log frame updates occasionally to avoid console spam
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

// test-video-durations.ts
import * as path from "path";
import * as fs from "fs";
import { exec } from "child_process";
import { config } from "./src/config";
import { createShortVideo } from "./src/services/video-service";
import { ProcessedVideo } from "./src/types/youtube-transcript";
import { getAudioDuration } from "./src/services/tts-service";

async function testVideoDurations() {
  try {
    // Sample transcript
    const transcript = `
      In this video, we're going to explore the history of World War I, also known as the Great War. 
      It began in 1914 after the assassination of Archduke Franz Ferdinand and lasted until 1918.
      The war was fought between the Allied Powers (Britain, France, Russia, Italy, and the United States)
      and the Central Powers (Germany, Austria-Hungary, Ottoman Empire, and Bulgaria).
      
      The conflict was characterized by trench warfare on the Western Front, where soldiers faced terrible conditions.
      New weapons like machine guns, tanks, and poison gas made this war particularly deadly.
      
      The war resulted in the deaths of approximately 9 million soldiers and 5 million civilians.
      It also led to the collapse of four empires: the Russian, Ottoman, Austro-Hungarian, and German.
      
      The Treaty of Versailles officially ended the war in 1919, but the harsh conditions imposed on Germany
      would contribute to the rise of Nazi Germany and eventually World War II.
      
      The Great War changed the world forever, redrawing national boundaries, shifting global power,
      and laying the groundwork for future conflicts that continue to shape our world today.
    `;

    // Create output directory if it doesn't exist
    const outputDir = path.join("output", "test-video-durations");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create sample image paths
    const imagePaths = [
      path.join(
        __dirname,
        "output",
        "test-video-durations",
        "sample_image_1.jpg"
      ),
      path.join(
        __dirname,
        "output",
        "test-video-durations",
        "sample_image_2.jpg"
      ),
      path.join(
        __dirname,
        "output",
        "test-video-durations",
        "sample_image_3.jpg"
      ),
    ];

    // Create sample images if they don't exist
    for (const imagePath of imagePaths) {
      if (!fs.existsSync(imagePath)) {
        // Create a simple 640x480 black image
        const imageDir = path.dirname(imagePath);
        if (!fs.existsSync(imageDir)) {
          fs.mkdirSync(imageDir, { recursive: true });
        }

        console.log(`Creating sample image: ${imagePath}`);
        // Use a command to create a black image
        exec(
          `ffmpeg -f lavfi -i color=c=black:s=640x480 -frames:v 1 "${imagePath}"`,
          (error) => {
            if (error) {
              console.error(`Error creating sample image: ${error}`);
            }
          }
        );
      }
    }

    // Test different video durations
    const videoDurations = [15, 30, 60];

    // Enable AI voiceover for testing
    const originalAiVoiceoverEnabled = config.aiVoiceoverEnabled;
    const originalVoiceoverDurationRatio = config.voiceoverDurationRatio;

    config.aiVoiceoverEnabled = true;

    for (const videoDuration of videoDurations) {
      console.log(
        `\n--- TESTING VIDEO CREATION FOR ${videoDuration}s DURATION ---`
      );

      // Update config for this test
      config.videoDuration = videoDuration;

      // Create processed video data
      const videoData: ProcessedVideo = {
        videoId: `test-${videoDuration}s`,
        url: `https://youtube.com/watch?v=test-${videoDuration}s`,
        transcript,
        outputDirectory: outputDir,
        imagePaths,
      };

      // Calculate target voiceover duration
      const targetVoiceoverDuration =
        videoDuration * config.voiceoverDurationRatio;
      console.log(
        `Target voiceover duration: ${targetVoiceoverDuration.toFixed(2)}s (${
          config.voiceoverDurationRatio * 100
        }% of ${videoDuration}s video)`
      );

      // Create the video
      const videoPath = await createShortVideo(videoData);
      console.log(`Video created: ${videoPath}`);

      // Check the voiceover file
      const voiceoverPath = path.join(
        outputDir,
        "video",
        `${videoData.videoId}_voiceover_adjusted.mp3`
      );
      if (fs.existsSync(voiceoverPath)) {
        const voiceoverDuration = await getAudioDuration(voiceoverPath);
        console.log(
          `Final voiceover duration: ${voiceoverDuration?.toFixed(
            2
          )}s / ${targetVoiceoverDuration.toFixed(2)}s target`
        );

        // Calculate accuracy
        if (voiceoverDuration) {
          const accuracy =
            (1 -
              Math.abs(voiceoverDuration - targetVoiceoverDuration) /
                targetVoiceoverDuration) *
            100;
          console.log(`Accuracy: ${accuracy.toFixed(2)}%`);

          // Check if we're within 1% of the target
          const isWithinTarget =
            Math.abs(voiceoverDuration - targetVoiceoverDuration) <
            targetVoiceoverDuration * 0.01;
          console.log(`Within 1% of target: ${isWithinTarget ? "YES" : "NO"}`);
        }
      } else {
        console.log(`Adjusted voiceover file not found: ${voiceoverPath}`);
      }
    }

    // Restore original config
    config.aiVoiceoverEnabled = originalAiVoiceoverEnabled;
    config.voiceoverDurationRatio = originalVoiceoverDurationRatio;
    config.videoDuration = 15; // Reset to default

    console.log("\nTest complete!");
  } catch (error) {
    console.error("Error in test:", error);
  }
}

testVideoDurations();

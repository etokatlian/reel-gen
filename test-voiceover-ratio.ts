// test-voiceover-ratio.ts
import {
  createVoiceoverScript,
  generateVoiceover,
  getAudioDuration,
  extendAudioToFillDuration,
} from "./src/services/tts-service";
import { config } from "./src/config";
import * as path from "path";
import * as fs from "fs";

async function testVoiceoverRatio() {
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
    const outputDir = path.join("output", "test-voiceover-ratio");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Test different video durations
    const videoDurations = [15, 30, 60];

    for (const videoDuration of videoDurations) {
      console.log(`\n--- TESTING VOICEOVER FOR ${videoDuration}s VIDEO ---`);

      // Calculate target voiceover duration based on the ratio
      const targetVoiceoverDuration =
        videoDuration * config.voiceoverDurationRatio;
      console.log(
        `Target voiceover duration: ${targetVoiceoverDuration.toFixed(2)}s (${
          config.voiceoverDurationRatio * 100
        }% of ${videoDuration}s video)`
      );

      // Calculate optimal word count
      const optimalWordCount = Math.floor(targetVoiceoverDuration * 2.9);
      console.log(`Optimal word count: ${optimalWordCount} words`);

      // Create voiceover script
      const script = await createVoiceoverScript(transcript, optimalWordCount);
      console.log(`Script (${script.split(/\s+/).length} words):`);
      console.log(script);

      // Generate voiceover
      const voiceoverPath = path.join(
        outputDir,
        `voiceover_${videoDuration}s.mp3`
      );
      await generateVoiceover(script, voiceoverPath, videoDuration);

      // Measure initial duration
      const initialDuration = await getAudioDuration(voiceoverPath);
      console.log(
        `Initial voiceover duration: ${initialDuration?.toFixed(
          2
        )}s / ${targetVoiceoverDuration.toFixed(2)}s target`
      );

      // Adjust voiceover duration
      const adjustedPath = path.join(
        outputDir,
        `voiceover_${videoDuration}s_adjusted.mp3`
      );
      await extendAudioToFillDuration(
        voiceoverPath,
        adjustedPath,
        videoDuration
      );

      // Measure final duration
      const finalDuration = await getAudioDuration(adjustedPath);
      console.log(
        `Final voiceover duration: ${finalDuration?.toFixed(
          2
        )}s / ${targetVoiceoverDuration.toFixed(2)}s target`
      );

      // Calculate accuracy
      if (finalDuration) {
        const accuracy =
          (1 -
            Math.abs(finalDuration - targetVoiceoverDuration) /
              targetVoiceoverDuration) *
          100;
        console.log(`Accuracy: ${accuracy.toFixed(2)}%`);

        // Check if we're within 0.5% of the target
        const isWithinTarget =
          Math.abs(finalDuration - targetVoiceoverDuration) <
          targetVoiceoverDuration * 0.005;
        console.log(`Within 0.5% of target: ${isWithinTarget ? "YES" : "NO"}`);
      }
    }

    console.log("\nTest complete!");
  } catch (error) {
    console.error("Error in test:", error);
  }
}

testVoiceoverRatio();

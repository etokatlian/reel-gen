// test-config.ts
import { config } from "./src/config";
import { calculateTargetWordCount } from "./src/services/tts-service";

function testConfig() {
  console.log("Testing consolidated configuration...");

  // Test video duration settings
  console.log("\n=== Video Duration Settings ===");
  console.log(`Video Duration: ${config.videoDuration} seconds`);
  console.log(`Images to Generate: ${config.imagesToGenerate}`);
  console.log(`Output Directory: ${config.outputDirectory}`);

  // Test voiceover settings
  console.log("\n=== Voiceover Settings ===");
  console.log(`AI Voiceover Enabled: ${config.aiVoiceoverEnabled}`);
  console.log(`Voiceover TTS Service: ${config.voiceoverTtsService}`);
  console.log(`Voiceover Voice: ${config.voiceoverVoice}`);
  console.log(`Voiceover Volume: ${config.voiceoverVolume * 100}%`);
  console.log(
    `Voiceover Duration Ratio: ${
      config.voiceoverDurationRatio * 100
    }% of video length`
  );

  // Test word count calculation
  console.log("\n=== Word Count Calculation ===");
  const voiceType = `${config.voiceoverTtsService}_${config.voiceoverVoice}`;
  console.log(`Voice Type: ${voiceType}`);
  console.log(
    `Speaking Rate: ${
      config.speakingRates[voiceType] || config.defaultSpeakingRate
    } words per second`
  );
  console.log(`Word Count Buffer Factor: ${config.wordCountBufferFactor}`);

  // Calculate target word counts for different durations
  const durations = [15, 30, 60];
  for (const duration of durations) {
    const targetVoiceoverDuration = duration * config.voiceoverDurationRatio;
    const wordCount = calculateTargetWordCount(
      targetVoiceoverDuration,
      voiceType
    );
    console.log(
      `For ${duration}s video (${targetVoiceoverDuration.toFixed(
        2
      )}s voiceover): ${wordCount} words`
    );
  }

  // Test audio adjustment settings
  console.log("\n=== Audio Adjustment Settings ===");
  console.log(
    `Audio Adjustment Threshold: ${config.audioAdjustmentThreshold} seconds`
  );
  console.log(`Audio Accuracy Target: ${config.audioAccuracyTarget * 100}%`);

  console.log("\nTest complete!");
}

testConfig();

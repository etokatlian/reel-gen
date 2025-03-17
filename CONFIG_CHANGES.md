# Configuration Consolidation

## Overview

We've consolidated all configuration settings related to video duration, voiceover generation, and audio adjustment into a single place in the `config.ts` file. This makes it easier to change these settings without having to modify multiple files.

## Changes Made

1. **Enhanced Config Interface**: Added new configuration options for word count calculation, speaking rates, and audio adjustment settings.

2. **Centralized Settings**: Moved hardcoded values from various files into the config object.

3. **Environment Variables**: Added support for configuring these settings via environment variables.

4. **Improved Modularity**: Updated all relevant functions to use the centralized configuration.

## New Configuration Options

### Video Settings
- `videoDuration`: Duration of generated video in seconds (default: 30)
- `imagesToGenerate`: Number of images to generate (default: 3)
- `outputDirectory`: Directory to store output files (default: "output")

### Voiceover Settings
- `voiceoverDurationRatio`: Ratio of voiceover duration to video length (default: 0.93)
- `speakingRates`: Speaking rates for different voice types
- `defaultSpeakingRate`: Default speaking rate if voice type not found
- `wordCountBufferFactor`: Buffer factor for word count calculation

### Audio Adjustment Settings
- `audioAdjustmentThreshold`: Threshold in seconds for audio adjustment (default: 0.1)
- `audioAccuracyTarget`: Target accuracy as a percentage (default: 1%)

## Environment Variables

You can configure these settings using environment variables in your `.env` file:

```
# Video Settings
VIDEO_DURATION=30
IMAGES_TO_GENERATE=3
OUTPUT_DIRECTORY=output

# Voiceover Settings
VOICEOVER_DURATION_RATIO=0.93

# Advanced Settings
WORD_COUNT_BUFFER_FACTOR=0.98
```

## Usage Examples

### Changing Video Duration

To change the video duration to 60 seconds:

1. Set in `.env` file:
   ```
   VIDEO_DURATION=60
   ```

2. Or modify in code:
   ```typescript
   config.videoDuration = 60;
   ```

### Adjusting Voiceover Duration Ratio

To change the voiceover duration ratio to 95% of the video length:

1. Set in `.env` file:
   ```
   VOICEOVER_DURATION_RATIO=0.95
   ```

2. Or modify in code:
   ```typescript
   config.voiceoverDurationRatio = 0.95;
   ```

## Benefits

1. **Easier Maintenance**: All configuration settings are in one place.
2. **Better Flexibility**: Settings can be changed without modifying multiple files.
3. **Improved Consistency**: Ensures consistent values are used throughout the application.
4. **Enhanced Testability**: Makes it easier to test different configurations.

## Bug Fixes

### Fixed Extraction Service Voiceover Duration

We identified and fixed an issue in the extraction service where it was using a hardcoded word count (42 words) for voiceovers, which was only appropriate for 15-second videos. This resulted in voiceovers that were too short for longer videos.

The fix includes:

1. **Dynamic Word Count Calculation**: The extraction service now calculates the optimal word count based on the video duration and the configured voiceover duration ratio.

2. **Voiceover Duration Adjustment**: The extraction service now properly adjusts the voiceover duration to match the target duration, ensuring that the voiceover is proportional to the video length.

3. **Consistent Behavior**: Both the video generation and extraction services now use the same approach for calculating and adjusting voiceover duration, ensuring consistent behavior across the application.

## Testing

We've created test scripts to verify that the consolidated configuration works correctly:

1. `test-config.ts`: Tests the consolidated configuration settings.
2. `test-30s-video.ts`: Tests generating a 30-second video with the correct voiceover duration ratio.

Both tests confirm that our implementation works correctly with the consolidated configuration. 
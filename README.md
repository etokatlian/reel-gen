# YouTube Content Visualizer

This application processes YouTube videos in two different ways:
1. **AI-Generated Content**: Downloads transcripts, analyzes content, generates images, and creates short videos
2. **Direct Extraction**: Extracts actual screenshots and video clips from the original YouTube video

## Features

- Download and analyze YouTube video transcripts
- **AI-Based Approach**:
  - Extract key moments using OpenAI's GPT models
  - Generate images representing those key moments using Hugging Face
  - Create short videos with zoom effects from the generated images
  - **Add custom soundtrack** to generated videos
  - **Generate AI voiceover** based on transcript content
- **Direct Extraction Approach**:
  - Extract screenshots at key moments from the original video
  - Extract short video clips from the most relevant parts
  - **Manually specify timestamps** for clip extraction
  - Create a montage of the extracted clips
  - **Remove audio and/or subtitles** from extracted clips
  - **Add custom soundtrack** to montage videos
  - **Generate AI voiceover** for the video montage
- Organized output with all assets saved in a structured directory

## Project Structure

The codebase follows a modular architecture for maintainability:

```
src/
├── index.ts                         # Main entry point
├── config.ts                        # Configuration and environment setup
├── cli.ts                           # Command-line interface handling
├── services/                        # Core functionalities
│   ├── transcript-service.ts        # YouTube transcript fetching
│   ├── analysis-service.ts          # Content analysis using OpenAI
│   ├── image-service.ts             # Image generation using Hugging Face
│   ├── video-service.ts             # Video creation with FFmpeg
│   ├── tts-service.ts               # Text-to-speech for voiceover generation
│   └── youtube-extraction-service.ts # Screenshot and clip extraction
├── types/                           # Type definitions
│   └── youtube-transcript.d.ts
└── utils/                           # Utility functions
    ├── file-utils.ts                # File operations
    └── video-utils.ts               # Video-related utilities
```

## Key Workflows

### 1. Transcript Processing

The application fetches video transcripts using the `youtube-transcript` library. The transcript is saved to disk and then used for either AI analysis or timestamp extraction.

### 2. AI-Based Approach

In this approach:
- The transcript is analyzed by OpenAI's GPT models to identify key moments
- Images are generated using Hugging Face's Stable Diffusion models
- A short video is created from these images using FFmpeg
- AI voiceover can be generated from the transcript content
- A custom soundtrack can be added to the video

### 3. Direct Extraction Approach

In this approach:
- Key timestamps are determined (either automatically from the transcript or manually specified)
- Screenshots are captured at those timestamps using FFmpeg and yt-dlp
- Short video clips are extracted at key moments
- Audio and/or subtitles can be optionally removed from clips
- A montage video is created from these clips
- AI voiceover can be generated from the transcript content
- A custom soundtrack can be added to the montage

## System Requirements

- Node.js (v16+)
- FFmpeg (required for both approaches)
- yt-dlp (required for direct extraction)
- Hugging Face API key (required for AI-generated images)
- OpenAI API key (optional for content analysis and TTS)
- ElevenLabs API key (optional for alternative TTS service)

## Installation

1. Install dependencies:
   - **FFmpeg**:
     - **macOS**: `brew install ffmpeg`
     - **Ubuntu/Debian**: `sudo apt install ffmpeg`
     - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html) or install with Chocolatey: `choco install ffmpeg`
   
   - **yt-dlp** (for direct extraction):
     - **macOS**: `brew install yt-dlp`
     - **Ubuntu/Debian**: `sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod a+rx /usr/local/bin/yt-dlp`
     - **Windows**: Download from [yt-dlp's GitHub](https://github.com/yt-dlp/yt-dlp/releases) or install with Chocolatey: `choco install yt-dlp`

2. Clone this repository

3. Install Node.js dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the project root and configure it based on your preferred approach:

   ### For AI-Generated Content:
   ```
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   OPENAI_API_KEY=your_openai_api_key
   VIDEO_ENABLED=true
   USE_CUSTOM_SOUNDTRACK=true
   SOUNDTRACK_PATH=audio/slowlife.mp3
   SOUNDTRACK_VOLUME=0.5
   AI_VOICEOVER_ENABLED=true
   VOICEOVER_TTS_SERVICE=openai
   VOICEOVER_VOICE=alloy
   VOICEOVER_VOLUME=0.8
   ```

   ### For Direct Video Extraction:
   ```
   EXTRACTION_ENABLED=true
   CLIP_DURATION=5
   EXTRACTION_QUALITY=medium
   REMOVE_AUDIO=false
   REMOVE_SUBTITLES=false
   USE_CUSTOM_SOUNDTRACK=true
   SOUNDTRACK_PATH=audio/slowlife.mp3
   SOUNDTRACK_VOLUME=0.5
   MANUAL_TIMESTAMP_ENTRY=true
   AI_VOICEOVER_ENABLED=true
   VOICEOVER_TTS_SERVICE=openai
   VOICEOVER_VOICE=alloy
   VOICEOVER_VOLUME=0.8
   ```

## Usage

Run the application:

```
npm start
```

Follow the prompts to enter a YouTube video URL. The application will:

1. Download the video transcript
2. Process the content based on your chosen approach (AI-based or direct extraction)
3. If `MANUAL_TIMESTAMP_ENTRY` is enabled, prompt you to enter timestamps for clip extraction
4. Save everything to an organized output directory

## Output Structure

### AI-Based Approach:
```
output/
└── [video_id]/
    ├── transcript/
    │   ├── [video_id]_transcript.txt
    │   ├── [video_id]_all_moments.txt
    │   └── [video_id]_moment_[1-3].txt
    ├── images/
    │   ├── [video_id]_image_1.png
    │   ├── [video_id]_image_1_description.txt
    │   ├── [video_id]_image_2.png
    │   └── ...
    └── video/
        ├── [video_id]_short.mp4
        ├── [video_id]_voiceover.mp3
        ├── [video_id]_voiceover_adjusted.mp3
        └── [video_id]_ffmpeg_command.txt
```

### Direct Extraction Approach:
```
output/
└── [video_id]/
    ├── transcript/
    │   └── [video_id]_transcript.txt
    ├── screenshots/
    │   ├── [video_id]_screenshot_1.jpg
    │   ├── [video_id]_screenshot_2.jpg
    │   └── ...
    ├── clips/
    │   ├── [video_id]_clip_1.mp4
    │   ├── [video_id]_clip_2.mp4
    │   └── ...
    └── video/
        ├── [video_id]_montage.mp4
        ├── [video_id]_voiceover.mp3
        ├── [video_id]_voiceover_adjusted.mp3
        └── [video_id]_clip_list.txt
```

## Configuration

You can configure the application by modifying the `.env` file or the `config.ts` file:

### Environment Variables

- `HUGGINGFACE_API_KEY`: API key for Hugging Face (for AI image generation)
- `OPENAI_API_KEY`: API key for OpenAI (for content analysis and TTS)
- `ELEVENLABS_API_KEY`: API key for ElevenLabs (alternative TTS service)
- `VIDEO_ENABLED`: Enable video creation (true/false)
- `EXTRACTION_ENABLED`: Enable direct extraction from YouTube (true/false)
- `CLIP_DURATION`: Duration of each extracted clip in seconds (default: 5)
- `EXTRACTION_QUALITY`: Quality of extraction (low, medium, high)
- `REMOVE_AUDIO`: Remove audio from extracted clips (true/false)
- `REMOVE_SUBTITLES`: Remove subtitles/text from extracted clips (true/false)
- `USE_CUSTOM_SOUNDTRACK`: Enable custom soundtrack (true/false)
- `SOUNDTRACK_PATH`: Path to the soundtrack file (default: audio/slowlife.mp3)
- `SOUNDTRACK_VOLUME`: Volume level for the soundtrack (0.0-1.0, default: 0.5)
- `MANUAL_TIMESTAMP_ENTRY`: Enable manual timestamp entry (true/false)
- `AI_VOICEOVER_ENABLED`: Enable AI voiceover (true/false)
- `VOICEOVER_TTS_SERVICE`: TTS service to use (openai or elevenlabs, default: openai)
- `VOICEOVER_VOICE`: Voice ID/name for the voiceover (default: alloy)
- `VOICEOVER_VOLUME`: Volume level for the voiceover (0.0-1.0, default: 0.8)

### config.ts Settings

- `imagesToGenerate`: Number of images/screenshots/clips to generate (default: 3)
- `videoDuration`: Total duration of the generated video in seconds (default: 15)
- `outputDirectory`: Base directory for output files (default: "output")
- `removeAudio`: Remove audio from extracted clips (default: false)
- `removeSubtitles`: Remove subtitles from extracted clips (default: false)
- `useCustomSoundtrack`: Enable custom soundtrack (default: false)
- `soundtrackPath`: Path to the soundtrack file (default: audio/slowlife.mp3)
- `soundtrackVolume`: Volume level for the soundtrack (default: 0.5)
- `manualTimestampEntry`: Enable manual timestamp entry (default: false)
- `aiVoiceoverEnabled`: Enable AI voiceover (default: false)
- `voiceoverVoice`: Voice ID/name for the voiceover (default: alloy)
- `voiceoverTtsService`: TTS service to use (default: openai)
- `voiceoverVolume`: Volume level for the voiceover (default: 0.8)

## Manual Timestamp Entry

The application supports manually specifying timestamps for clip extraction instead of relying on automatic analysis of the transcript. This is useful when:

- You want to extract specific moments from the video that you already know
- You need precise control over which segments of the video are included in the montage
- The automated extraction might not correctly identify the most important moments

### How it works

When this feature is enabled:
1. The application will still download and analyze the transcript for reference
2. Instead of automatically selecting clips, it will prompt you to enter timestamps
3. For each clip, you'll enter the start time in MM:SS or HH:MM:SS format
4. You can choose to use the default clip duration or specify an end time
5. The clips will be extracted from the video based on your manual timestamps

### Configuration

To enable manual timestamp entry, set the following in your `.env` file:

```
MANUAL_TIMESTAMP_ENTRY=true
```

You can still combine this with other options like audio removal, subtitle removal, and custom soundtrack.

## Audio & Subtitle Removal

The application supports removing audio and/or subtitles from extracted YouTube video clips. This is particularly useful when:

- You want to create clips without the original audio (for adding your own voiceover or music)
- The video contains burned-in captions or subtitles that you want to remove
- You need clean video footage without text overlays

### How it works

The functionality uses FFmpeg's stream manipulation capabilities:
- `-an` flag is used to remove audio streams
- `-sn` flag is used to remove subtitle streams

### Configuration

To enable these features, set the following in your `.env` file:

```
REMOVE_AUDIO=true    # Set to true to remove audio from clips
REMOVE_SUBTITLES=true # Set to true to remove subtitles from clips
```

Note that subtitle removal only works for actual subtitle streams. For burned-in text that is part of the video image, more advanced processing would be required.

### Usage in code

If you need to process existing clips programmatically, you can use the `processVideoClip` function:

```typescript
import { processVideoClip } from './services/youtube-extraction-service';

// Process a single clip
await processVideoClip(
  'input.mp4',   // Input file path
  'output.mp4',  // Output file path
  true,          // Remove audio
  true           // Remove subtitles
);

// For batch processing multiple clips
import { processExistingClips } from './services/youtube-extraction-service';

const processedPaths = await processExistingClips(
  ['clip1.mp4', 'clip2.mp4'],  // Input clips
  'processed_clips',           // Output directory
  true,                        // Remove audio
  true                         // Remove subtitles
);
```

## Custom Soundtrack

The application supports adding a custom soundtrack to both AI-generated videos and extracted video montages. This allows you to:

- Replace the original audio with your preferred music
- Create a consistent sound across all your generated videos
- Enhance viewer engagement with appropriate background music

### How it works

The functionality uses FFmpeg's audio processing capabilities:
- For AI-generated videos: The soundtrack is mixed in during the image-to-video process
- For extracted video montages: The soundtrack replaces or overlays the original audio
- Volume controls allow you to adjust the soundtrack's loudness

### Configuration

To enable the custom soundtrack, set the following in your `.env` file:

```
USE_CUSTOM_SOUNDTRACK=true      # Enable custom soundtrack
SOUNDTRACK_PATH=audio/slowlife.mp3  # Path to your MP3 file
SOUNDTRACK_VOLUME=0.5           # Volume level (0.0-1.0)
```

The application comes with a default soundtrack (`audio/slowlife.mp3`), but you can specify any MP3 file path.

### Usage in code

If you need to add a soundtrack to an existing video programmatically, you can use the `addSoundtrackToVideo` function:

```typescript
import { addSoundtrackToVideo } from './services/youtube-extraction-service';

// Add soundtrack to a video
await addSoundtrackToVideo(
  'input.mp4',             // Input video path
  'output_with_music.mp4', // Output video path
  'audio/slowlife.mp3',    // Soundtrack path
  0.5                      // Volume level (0.0-1.0)
);
```

## AI Voiceover

The application supports adding AI-generated voiceover to both AI-generated videos and extracted video montages. This feature:

- Creates a concise script based on the video transcript
- Generates speech using either OpenAI or ElevenLabs Text-to-Speech (TTS) services
- Adjusts the voiceover duration to match the video length
- Combines the voiceover with the video, optionally mixing it with a custom soundtrack

### How It Works

The AI voiceover feature:
1. Analyzes the video transcript to extract key points
2. Creates a concise script that captures the essence of the content
3. Generates high-quality speech using the selected TTS service
4. Adjusts the voiceover timing to perfectly match the length of the video
5. Mixes the voiceover with the video, along with any soundtrack if enabled

### Enhanced Transcript Distillation

The voiceover feature has been enhanced to intelligently distill YouTube video transcripts into more concise content that matches the length of the generated video. Previously, the system was using the raw transcript directly, which often resulted in voiceovers that were either too long or contained too much irrelevant information.

#### Key improvements:

- **Smart Content Selection**: Extracts key sentences from beginning, middle, and end of the transcript
- **Proportional Word Count**: Automatically calculates optimal word count based on video duration
- **Context Preservation**: Maintains the essence of the original content while trimming excess
- **HTML Entity Handling**: Properly decodes HTML entities for natural-sounding speech
- **Sentence Optimization**: Formats sentences for better speech rhythm and clarity

This ensures that voiceovers are concise, relevant, and perfectly timed to match the video duration, providing a better viewing experience.

### Configuration

To enable AI voiceover, set the following in your `.env` file:

```
AI_VOICEOVER_ENABLED=true               # Enable AI voiceover
VOICEOVER_TTS_SERVICE=openai            # TTS service to use (openai or elevenlabs)
VOICEOVER_VOICE=alloy                   # Voice ID/name
VOICEOVER_VOLUME=0.8                    # Volume level (0.0-1.0)
```

For OpenAI TTS, available voices are: alloy, echo, fable, onyx, nova, shimmer.

For ElevenLabs, you'll need to:
1. Set `ELEVENLABS_API_KEY` in your `.env` file
2. Use the voice ID from the ElevenLabs dashboard

### Usage in code

If you need to generate a voiceover programmatically:

```typescript
import { generateVoiceover, createVoiceoverScript } from './services/tts-service';

// Generate a voiceover script from a transcript
const script = createVoiceoverScript(videoTranscript, 150);

// Generate a voiceover
const voiceoverPath = await generateVoiceover(
  script,
  "output_path.mp3",
  30 // Optional: target duration in seconds
);
```

## Development Guide

### Prerequisites
- Node.js (v16+)
- npm or pnpm
- FFmpeg and yt-dlp (for direct extraction)

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your configuration

### Development Commands

#### Basic Commands
- `npm run build`: Build the TypeScript code
- `npm start`: Build and run the application
- `npm run dev`: Run in development mode with ts-node

#### Testing & Linting
- `npm test`: Run unit tests
- `npm run test:watch`: Run tests in watch mode (watches files you modify)
- `npm run test:watchAll`: Run tests in watch mode (watches all test files)
- `npm run test:coverage`: Run tests with coverage report
- `npm run lint`: Run ESLint to check code quality
- `npm run lint:watch`: Run ESLint in watch mode

#### Continuous Development
- `npm run dev:watch`: Run the application with automatic restart when files change
- `npm run watch`: **Recommended** - Run tests and linting simultaneously in watch mode

### Continuous Testing

For the best development experience, we recommend using the `npm run watch` command, which:

- Runs tests and linting in parallel
- Automatically re-runs tests when files change
- Shows color-coded output to distinguish between tests and linting
- Provides interactive commands for clearing the console, showing help, and quitting

This ensures you get immediate feedback when making changes, helping you catch issues early.

### Testing Strategy

The project uses Jest for testing. Critical functions have unit tests to prevent regressions:
- Video ID extraction and URL formatting
- File system operations
- Transcript fetching
- Content analysis
- Video generation and extraction
- Audio and subtitle removal options

Tests are focused on critical functionality rather than implementation details, making them more maintainable and less prone to breaking when refactoring.

## License

MIT
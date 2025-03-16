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
- **Direct Extraction Approach**:
  - Extract screenshots at key moments from the original video
  - Extract short video clips from the most relevant parts
  - Create a montage of the extracted clips
  - **Remove audio and/or subtitles** from extracted clips
  - **Add custom soundtrack** to montage videos
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
- A custom soundtrack can be added to the video

### 3. Direct Extraction Approach

In this approach:
- Key timestamps are determined from the transcript
- Screenshots are captured at those timestamps using FFmpeg and yt-dlp
- Short video clips are extracted at key moments
- Audio and/or subtitles can be optionally removed from clips
- A montage video is created from these clips
- A custom soundtrack can be added to the montage

## System Requirements

- Node.js (v16+)
- FFmpeg (required for both approaches)
- yt-dlp (required for direct extraction)
- Hugging Face API key (required for AI-generated images)
- OpenAI API key (optional for content analysis)

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
   ```

## Usage

Run the application:

```
npm start
```

Follow the prompts to enter a YouTube video URL. The application will:

1. Download the video transcript
2. Process the content based on your chosen approach (AI-based or direct extraction)
3. Save everything to an organized output directory

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
        └── [video_id]_clip_list.txt
```

## Configuration

You can configure the application by modifying the `.env` file or the `config.ts` file:

### Environment Variables

- `HUGGINGFACE_API_KEY`: API key for Hugging Face (for AI image generation)
- `OPENAI_API_KEY`: API key for OpenAI (for content analysis)
- `VIDEO_ENABLED`: Enable video creation (true/false)
- `EXTRACTION_ENABLED`: Enable direct extraction from YouTube (true/false)
- `CLIP_DURATION`: Duration of each extracted clip in seconds (default: 5)
- `EXTRACTION_QUALITY`: Quality of extraction (low, medium, high)
- `REMOVE_AUDIO`: Remove audio from extracted clips (true/false)
- `REMOVE_SUBTITLES`: Remove subtitles/text from extracted clips (true/false)
- `USE_CUSTOM_SOUNDTRACK`: Enable custom soundtrack (true/false)
- `SOUNDTRACK_PATH`: Path to the soundtrack file (default: audio/slowlife.mp3)
- `SOUNDTRACK_VOLUME`: Volume level for the soundtrack (0.0-1.0, default: 0.5)

### config.ts Settings

- `imagesToGenerate`: Number of images/screenshots/clips to generate (default: 3)
- `videoDuration`: Total duration of the generated video in seconds (default: 15)
- `outputDirectory`: Base directory for output files (default: "output")
- `removeAudio`: Remove audio from extracted clips (default: false)
- `removeSubtitles`: Remove subtitles from extracted clips (default: false)
- `useCustomSoundtrack`: Enable custom soundtrack (default: false)
- `soundtrackPath`: Path to the soundtrack file (default: audio/slowlife.mp3)
- `soundtrackVolume`: Volume level for the soundtrack (default: 0.5)

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
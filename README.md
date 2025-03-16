# YouTube Content Visualizer

This application downloads YouTube video transcripts, generates images that directly represent the key moments discussed in the video content, and optionally creates TikTok/YouTube Shorts-style videos from those images.

## Features

- Download transcripts from any YouTube video
- Analyze video content to extract key visual moments
- Generate images that accurately represent the actual content (not just style variations)
- Create short videos with zoom effects from the generated images
- Organized output with transcripts, images, and videos saved in a structured directory

## Project Structure

The codebase follows a modular architecture for maintainability:

```
src/
├── index.ts                  # Main entry point
├── config.ts                 # Configuration and environment setup
├── cli.ts                    # Command-line interface handling
├── services/                 # Core functionalities
│   ├── transcript-service.ts # YouTube transcript fetching
│   ├── analysis-service.ts   # Content analysis using OpenAI
│   ├── image-service.ts      # Image generation using Hugging Face
│   └── video-service.ts      # Video creation with FFmpeg
├── types/                    # Type definitions
│   └── youtube-transcript.d.ts
└── utils/                    # Utility functions
    ├── file-utils.ts         # File operations
    └── video-utils.ts        # Video-related utilities
```

## Key Workflows

### 1. Transcript Processing

The application fetches video transcripts using the `youtube-transcript` library in `transcript-service.ts`. The transcript is saved to disk and then analyzed for key moments.

### 2. Content Analysis

In `analysis-service.ts`, OpenAI's GPT models analyze the transcript to identify distinct, important moments that can be visualized. The analysis focuses on extracting specific content rather than stylistic elements.

### 3. Image Generation

The `image-service.ts` module handles generating images from the extracted key moments using Hugging Face's Stable Diffusion models. It ensures images directly represent the actual content discussed in the video.

### 4. Video Creation

The `video-service.ts` module creates a short video (default: 15 seconds) from the generated images, applying a subtle zoom effect to each image. This creates an engaging TikTok/YouTube Shorts-style video.

## System Requirements

- Node.js (v16+)
- FFmpeg (required for video generation)
- Hugging Face API key (required for image generation)
- OpenAI API key (optional for content analysis)

## Installation

1. Install FFmpeg (required for video generation):
   - **macOS**: `brew install ffmpeg`
   - **Ubuntu/Debian**: `sudo apt install ffmpeg`
   - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html) or install with Chocolatey: `choco install ffmpeg`

2. Clone this repository

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the project root with your API keys:
   ```
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   OPENAI_API_KEY=your_openai_api_key
   VIDEO_ENABLED=true
   ```

## Usage

Run the application:

```
npm start
```

Follow the prompts to enter a YouTube video URL. The application will:

1. Download the video transcript
2. Analyze the content to identify key moments (if OpenAI API key is provided)
3. Generate images that accurately represent those key moments (using Hugging Face's Stable Diffusion)
4. Create a short video with zoom effects from the generated images (if FFmpeg is installed and VIDEO_ENABLED=true)
5. Save everything to an organized output directory

## Output Structure

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
    │   ├── [video_id]_image_2_description.txt
    │   ├── [video_id]_image_3.png
    │   └── [video_id]_image_3_description.txt
    └── video/
        ├── [video_id]_short.mp4
        └── [video_id]_ffmpeg_command.txt
```

## Configuration

You can configure the application by modifying the `config.ts` file:

- `imagesToGenerate`: Number of images to generate (default: 3)
- `videoDuration`: Total duration of the generated video in seconds (default: 15)
- `videoEnabled`: Whether to enable video generation (default: false, set to true in .env)
- `outputDirectory`: Base directory for output files (default: "output")
- Model endpoints and other parameters can also be customized

## Development Guide

### Prerequisites
- Node.js (v16+)
- npm or pnpm
- FFmpeg (for video generation)

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your API keys

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
- Video generation

Tests are focused on critical functionality rather than implementation details, making them more maintainable and less prone to breaking when refactoring.

### Important Development Notes

1. **Content Focus**: When modifying image generation, focus on content accuracy rather than style variations.

2. **Error Handling**: All modules include comprehensive error handling and fallback mechanisms.

3. **Type Safety**: The `ProcessedVideo` interface in `types/youtube-transcript.d.ts` defines the data structure that flows through the application pipeline.

4. **FFmpeg Dependency**: Video generation requires FFmpeg to be installed on the system.

## License

MIT
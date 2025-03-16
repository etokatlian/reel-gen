# YouTube Content Visualizer

This application downloads YouTube video transcripts and generates images that directly represent the key moments discussed in the video content.

## Features

- Download transcripts from any YouTube video
- Analyze video content to extract key visual moments
- Generate images that accurately represent the actual content (not just style variations)
- Organized output with transcripts and images saved in a structured directory

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
│   └── image-service.ts      # Image generation using Hugging Face
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

Important functions:
- `extractKeyMoments(transcript)`: Identifies 3 key moments from the transcript
- `saveKeyMoments(videoData)`: Saves the extracted moments to disk

### 3. Image Generation

The `image-service.ts` module handles generating images from the extracted key moments using Hugging Face's Stable Diffusion models. It ensures images directly represent the actual content discussed in the video.

Key features:
- Content-focused prompts prioritize accuracy over style
- Fallback to backup models if primary model fails
- Consistent seed generation for reproducible but varied results

## Configuration

All configuration is centralized in `config.ts`. The application requires:

- `HUGGINGFACE_API_KEY`: Required for image generation
- `OPENAI_API_KEY`: Optional but needed for content analysis

## Output Structure

```
output/
└── [video_id]/
    ├── transcript/
    │   ├── [video_id]_transcript.txt
    │   ├── [video_id]_all_moments.txt
    │   └── [video_id]_moment_[1-3].txt
    └── images/
        ├── [video_id]_image_[1-3].png
        └── [video_id]_image_[1-3]_description.txt
```

## Development Guide

### Prerequisites
- Node.js (v16+)
- npm or pnpm

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your API keys

### Commands
- `npm run build`: Build the TypeScript code
- `npm start`: Build and run the application
- `npm run dev`: Run in development mode with ts-node
- `npm test`: Run unit tests
- `npm run test:coverage`: Run tests with coverage report

### Testing
The project uses Jest for testing. Critical functions have unit tests to prevent regressions:
- Video ID extraction and URL formatting
- File system operations
- Transcript fetching
- Content analysis

### Important Development Notes

1. **Content Focus**: When modifying image generation, focus on content accuracy rather than style variations.

2. **Error Handling**: All modules include comprehensive error handling and fallback mechanisms.

3. **Type Safety**: The `ProcessedVideo` interface in `types/youtube-transcript.d.ts` defines the data structure that flows through the application pipeline.

4. **Environment Requirements**: The application requires ES2021+ support for features like `string.replaceAll()`.

## License

MIT

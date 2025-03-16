# YouTube Content Visualizer

This application downloads YouTube video transcripts and generates images that directly represent the key moments discussed in the video content.

## Features

- Download transcripts from any YouTube video
- Analyze video content to extract key visual moments
- Generate images that accurately represent the actual content (not just style variations)
- Organized output with transcripts and images saved in a structured directory

## Requirements

- Node.js (v16+)
- Hugging Face API key (required for image generation)
- OpenAI API key (optional for content analysis)

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the project root with your API keys:
   ```
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   OPENAI_API_KEY=your_openai_api_key
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
4. Save everything to an organized output directory

## Output Structure

```
output/
└── [video_id]/
    ├── transcript/
    │   ├── [video_id]_transcript.txt
    │   ├── [video_id]_all_moments.txt
    │   ├── [video_id]_moment_1.txt
    │   ├── [video_id]_moment_2.txt
    │   └── [video_id]_moment_3.txt
    └── images/
        ├── [video_id]_image_1.png
        ├── [video_id]_image_1_description.txt
        ├── [video_id]_image_2.png
        ├── [video_id]_image_2_description.txt
        ├── [video_id]_image_3.png
        └── [video_id]_image_3_description.txt
```

## Configuration

You can configure the application by modifying the `config.ts` file:

- `imagesToGenerate`: Number of images to generate (default: 3)
- `outputDirectory`: Base directory for output files (default: "output")
- Model endpoints and other parameters can also be customized

## Development

Build the TypeScript code:
```
npm run build
```

Run in development mode with ts-node:
```
npm run dev
```

## License

MIT

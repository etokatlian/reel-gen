# YouTube Transcript Downloader & Image Generator

A command-line tool to download the transcript from any YouTube video, analyze its content, and generate relevant images.

## Features

- Extracts video ID from any YouTube URL format
- Downloads the transcript text
- Analyzes the transcript content using LangChain and OpenAI
- Generates images based on the content using Hugging Face's Stable Diffusion model
- Saves the transcript, content description, and generated images

## Prerequisites

- Node.js (v14 or higher)
- npm or pnpm
- Hugging Face API key (for image generation)
- OpenAI API key (for content analysis)

## Installation

Clone this repository and install dependencies:

```bash
git clone <repository-url>
cd <repository-directory>
pnpm install
```

## Configuration

Create a `.env` file in the root directory with your API keys:

```
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

You can copy the `.env.example` file and replace the placeholder values with your actual API keys.

## Usage

Run the script:

```bash
pnpm start
```

You will be prompted to enter a YouTube video URL. The script will:

1. Extract the video ID from the URL
2. Download the transcript
3. Save it to a file in the `transcripts` folder
4. Analyze the transcript content (if OpenAI API key is provided)
5. Generate 3 images based on the content (if Hugging Face API key is provided)
6. Save the images to the `transcripts/images` folder

Example:

```
YouTube Transcript Downloader & Image Generator
---------------------------------------------
Enter YouTube video URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
Downloading transcript for video ID: dQw4w9WgXcQ
Transcript saved to: /path/to/transcripts/dQw4w9WgXcQ.txt
Transcript downloaded successfully!
Analyzing transcript content...
Description saved to: /path/to/transcripts/dQw4w9WgXcQ_description.txt
Generating images based on the content...
Generating 3 images based on the description...
Generating image 1/3...
Image saved to: /path/to/transcripts/images/dQw4w9WgXcQ_1.png
Generating image 2/3...
Image saved to: /path/to/transcripts/images/dQw4w9WgXcQ_2.png
Generating image 3/3...
Image saved to: /path/to/transcripts/images/dQw4w9WgXcQ_3.png
Process completed successfully!
Generated 3 images.
```

## Limitations

- The video must have captions/subtitles available
- Only works with public videos (not private or unlisted)
- Currently only downloads the default language transcript
- Requires API keys for full functionality

## License

ISC 
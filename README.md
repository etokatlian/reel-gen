# YouTube Transcript Downloader

A simple command-line tool to download the transcript (subtitles/captions) from any YouTube video.

## Features

- Extracts video ID from any YouTube URL format
- Downloads the transcript text
- Saves the transcript to a text file

## Prerequisites

- Node.js (v14 or higher)
- npm or pnpm

## Installation

Clone this repository and install dependencies:

```bash
git clone <repository-url>
cd <repository-directory>
pnpm install
```

## Usage

Run the script:

```bash
pnpm start
```

You will be prompted to enter a YouTube video URL. The script will:

1. Extract the video ID from the URL
2. Download the transcript
3. Save it to a file in the `transcripts` folder

Example:

```
YouTube Transcript Downloader
----------------------------
Enter YouTube video URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
Downloading transcript for video ID: dQw4w9WgXcQ
Transcript saved to: /path/to/transcripts/dQw4w9WgXcQ.txt
Transcript downloaded successfully!
```

## Limitations

- The video must have captions/subtitles available
- Only works with public videos (not private or unlisted)
- Currently only downloads the default language transcript

## License

ISC 
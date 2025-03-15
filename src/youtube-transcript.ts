import * as fs from "fs";
import * as path from "path";
import * as readlineSync from "readline-sync";
import { YoutubeTranscript, TranscriptResponse } from "youtube-transcript";

/**
 * Extract the video ID from a YouTube URL
 * @param url YouTube URL
 * @returns Video ID or null if not found
 */
function extractVideoId(url: string): string | null {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : null;
}

/**
 * Download transcript from a YouTube video
 * @param videoId YouTube video ID
 * @returns Promise with transcript text
 */
async function getTranscript(videoId: string): Promise<string> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map((item: TranscriptResponse) => item.text).join(" ");
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw error;
  }
}

/**
 * Save transcript to a file
 * @param transcript Transcript text
 * @param videoId Video ID for filename
 */
function saveTranscript(transcript: string, videoId: string): void {
  const outputDir = path.join(process.cwd(), "transcripts");

  // Create transcripts directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, `${videoId}.txt`);
  fs.writeFileSync(filePath, transcript);
  console.log(`Transcript saved to: ${filePath}`);
}

/**
 * Main function to run the program
 */
async function main(): Promise<void> {
  console.log("YouTube Transcript Downloader");
  console.log("----------------------------");

  // Prompt user for YouTube URL
  const youtubeUrl = readlineSync.question("Enter YouTube video URL: ");

  // Extract video ID
  const videoId = extractVideoId(youtubeUrl);

  if (!videoId) {
    console.error("Invalid YouTube URL. Please provide a valid URL.");
    return;
  }

  console.log(`Downloading transcript for video ID: ${videoId}`);

  try {
    // Get transcript
    const transcript = await getTranscript(videoId);

    // Save transcript to file
    saveTranscript(transcript, videoId);

    console.log("Transcript downloaded successfully!");
  } catch (error) {
    console.error("Failed to download transcript.");
  }
}

// Run the program
main().catch(console.error);

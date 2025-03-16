import * as path from "path";
import { YoutubeTranscript, TranscriptResponse } from "youtube-transcript";
import { ProcessedVideo } from "../types/youtube-transcript";
import { saveTextToFile } from "../utils/file-utils";

/**
 * Download transcript from a YouTube video
 * @param videoId YouTube video ID
 * @returns Promise with transcript text
 */
export async function fetchTranscript(videoId: string): Promise<string> {
  try {
    // Fetch the transcript using the YoutubeTranscript library
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    // Convert transcript segments to a single text string
    const transcriptText = transcript
      .map((item: TranscriptResponse) => item.text)
      .join(" ");
    
    return transcriptText;
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw new Error(`Failed to fetch transcript for video ${videoId}: ${error}`);
  }
}

/**
 * Save the transcript to a file
 * @param videoData Processed video data with transcript
 * @returns Updated ProcessedVideo with saved transcript path
 */
export function saveTranscript(videoData: ProcessedVideo): ProcessedVideo {
  try {
    // Create transcript file path
    const transcriptPath = path.join(
      videoData.outputDirectory,
      "transcript",
      `${videoData.videoId}_transcript.txt`
    );
    
    // Save the transcript to the file
    saveTextToFile(videoData.transcript, transcriptPath);
    console.log(`Transcript saved to: ${transcriptPath}`);
    
    return {
      ...videoData,
      transcriptPath
    };
  } catch (error) {
    console.error("Error saving transcript:", error);
    throw new Error(`Failed to save transcript for video ${videoData.videoId}: ${error}`);
  }
}
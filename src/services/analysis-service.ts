import * as path from "path";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ProcessedVideo } from "../types/youtube-transcript";
import { saveTextItemsToFiles, saveTextToFile } from "../utils/file-utils";
import { config } from "../config";

/**
 * Analyze transcript content to extract key visual moments
 * @param transcript The transcript text to analyze
 * @returns Array of descriptions for key visual moments
 */
export async function extractKeyMoments(transcript: string): Promise<string[]> {
  if (!config.openAiApiKey) {
    throw new Error("OpenAI API key is required for content analysis but not set");
  }

  try {
    // Initialize ChatOpenAI with controlled temperature for consistency
    const model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.3,
    });

    // Truncate transcript if it's too long (to avoid token limits)
    const maxLength = 4000;
    const truncatedTranscript = transcript.length > maxLength
      ? transcript.substring(0, maxLength) + "..."
      : transcript;

    // Create system message with clear instructions
    const systemMessage = new SystemMessage(
      "You are an expert content analyzer. Your task is to identify 3 distinct, important moments or concepts from the video transcript that would make compelling, representative images. Focus on the actual content being discussed, not stylistic variations. Each description should be specific, concrete, and directly based on what was explicitly mentioned in the transcript. Prioritize accuracy over creativity."
    );

    // Create human message with the transcript
    const humanMessage = new HumanMessage(
      `Analyze this YouTube video transcript and identify 3 distinct key moments or concepts that could be visualized as images:\n\n${truncatedTranscript}\n\nFor each moment, provide a detailed description that would allow an image generation model to create an accurate representation. Focus only on what was explicitly discussed in the video - do not invent or embellish beyond what was actually mentioned. Each description should represent a different part of the content.`
    );

    // Get response from the model
    const response = await model.invoke([systemMessage, humanMessage]);
    const content = response.content.toString();
    
    // Parse the response to extract the three descriptions
    const descriptions: string[] = [];
    
    // Look for numbered items (1., 2., 3.) or items separated by double newlines
    const parts = content.split(/(?:\d+\.|\n\n)/).filter(part => part.trim().length > 0);
    
    // Take up to 3 parts
    for (let i = 0; i < Math.min(parts.length, 3); i++) {
      descriptions.push(parts[i].trim());
    }
    
    // If we didn't get 3 descriptions, generate some defaults or use the whole content
    while (descriptions.length < 3) {
      if (descriptions.length === 0) {
        descriptions.push(content.trim());
      } else {
        // Create variations of the first description as fallback
        descriptions.push(`Alternative perspective of: ${descriptions[0]}`);
      }
    }

    return descriptions;
  } catch (error) {
    console.error("Error analyzing transcript:", error);
    throw new Error(`Failed to analyze transcript content: ${error}`);
  }
}

/**
 * Save key moments to files
 * @param videoData Processed video data with key moments
 * @returns Updated ProcessedVideo with saved moment paths
 */
export function saveKeyMoments(videoData: ProcessedVideo): ProcessedVideo {
  if (!videoData.keyMoments || videoData.keyMoments.length === 0) {
    return videoData;
  }

  try {
    // Save all moments to a single file
    const allMomentsPath = path.join(
      videoData.outputDirectory,
      "transcript",
      `${videoData.videoId}_all_moments.txt`
    );
    
    saveTextToFile(
      videoData.keyMoments.join('\n\n---\n\n'),
      allMomentsPath
    );
    
    // Save individual moment files
    const momentPaths = saveTextItemsToFiles(
      videoData.keyMoments,
      path.join(videoData.outputDirectory, "transcript"),
      `${videoData.videoId}_moment`
    );
    
    console.log(`Key moments saved to: ${allMomentsPath}`);
    
    return {
      ...videoData,
      momentPaths
    };
  } catch (error) {
    console.error("Error saving key moments:", error);
    throw new Error(`Failed to save key moments for video ${videoData.videoId}: ${error}`);
  }
}
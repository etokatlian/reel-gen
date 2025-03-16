import * as path from "path";
import { ProcessedVideo, ImageGenerationResult } from "../types/youtube-transcript";
import { saveBinaryToFile, saveTextToFile } from "../utils/file-utils";
import { config } from "../config";

/**
 * Enhance a prompt for better image generation results
 * @param prompt The original prompt to enhance
 * @returns Enhanced prompt optimized for image generation
 */
function enhancePrompt(prompt: string): string {
  return `Create a photorealistic visual scene that accurately represents this content from a YouTube video: ${prompt}. High quality, detailed, no text, no watermarks. The image must directly represent the actual content described without stylistic embellishments.`;
}

/**
 * Generate an image using Hugging Face's image generation API
 * @param prompt The text prompt to generate an image from
 * @param useBackupModel Whether to use the backup model (defaults to false)
 * @returns Promise resolving to a Blob containing the image data
 */
async function generateImage(
  prompt: string,
  useBackupModel = false
): Promise<Blob> {
  // Enhance the prompt for better visual results
  const enhancedPrompt = enhancePrompt(prompt);

  // Use consistent seeds for reproducible results, but different for each image
  // Creates a simple hash of the prompt to get a deterministic but different seed per prompt
  const promptHash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = useBackupModel ? promptHash % 1000 + 1000 : promptHash % 1000;

  // Select the appropriate model endpoint
  const modelEndpoint = useBackupModel
    ? config.backupModelEndpoint
    : config.primaryModelEndpoint;

  // Add negative prompts to specifically avoid unwanted elements
  const negativePrompt = 
    "text, watermark, logo, words, letters, signature, cartoon style, anime style, " +
    "drawing, illustration, painting style, abstract, surreal, modern technology, " +
    "futuristic elements, anachronistic elements";

  // Make the API request
  const response = await fetch(modelEndpoint, {
    headers: {
      Authorization: `Bearer ${config.huggingFaceApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      inputs: enhancedPrompt,
      parameters: {
        seed: seed,
        num_inference_steps: 50,  // Higher for more detail
        guidance_scale: 8.5,      // Higher for better prompt adherence
        negative_prompt: negativePrompt,
      },
    }),
  });

  // Handle errors
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Image generation API error: ${response.status} - ${errorText}`);
  }

  // Return the image blob
  return await response.blob();
}

/**
 * Generate images for each key moment in the video content
 * @param videoData Processed video data with key moments
 * @returns Promise resolving to updated ProcessedVideo with image paths
 */
export async function generateImagesForKeyMoments(
  videoData: ProcessedVideo
): Promise<ProcessedVideo> {
  if (!videoData.keyMoments || videoData.keyMoments.length === 0) {
    throw new Error("No key moments available for image generation");
  }

  console.log(`Generating ${videoData.keyMoments.length} images from key moments...`);
  
  const imageResults: ImageGenerationResult[] = [];

  // Process each key moment
  for (let i = 0; i < videoData.keyMoments.length; i++) {
    const moment = videoData.keyMoments[i];
    console.log(`\nGenerating image ${i + 1}/${videoData.keyMoments.length}...`);
    console.log(`Content: ${moment.substring(0, 100)}${moment.length > 100 ? '...' : ''}`);

    try {
      // Try primary model first, fall back to backup if needed
      let imageBlob: Blob;
      try {
        imageBlob = await generateImage(moment, false);
      } catch (primaryError) {
        console.warn("Primary model failed, trying backup model:", primaryError);
        imageBlob = await generateImage(moment, true);
      }

      // Convert blob to buffer for saving
      const arrayBuffer = await imageBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create filenames
      const imagePath = path.join(
        videoData.outputDirectory,
        "images", 
        `${videoData.videoId}_image_${i + 1}.png`
      );
      
      const descriptionPath = path.join(
        videoData.outputDirectory,
        "images", 
        `${videoData.videoId}_image_${i + 1}_description.txt`
      );

      // Save the image and its description
      saveBinaryToFile(buffer, imagePath);
      saveTextToFile(moment, descriptionPath);

      // Add to results
      imageResults.push({
        path: imagePath,
        description: moment
      });

      console.log(`Image ${i + 1} saved to: ${imagePath}`);
    } catch (error) {
      console.error(`Error generating image ${i + 1}:`, error);
      // Continue with next image instead of failing completely
    }
  }

  // Return updated video data
  return {
    ...videoData,
    imagePaths: imageResults.map(result => result.path)
  };
}
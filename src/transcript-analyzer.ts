import * as fs from "fs";
import * as path from "path";
import { InferenceClient } from "@huggingface/inference";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Initialize Hugging Face client
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
const client = new InferenceClient(HF_API_KEY);

/**
 * Analyzes transcript content using LangChain to generate a detailed description
 * @param transcriptText The transcript text to analyze
 * @returns A detailed description of the content
 */
export async function analyzeTranscript(
  transcriptText: string
): Promise<string> {
  try {
    // Check if OPENAI_API_KEY is set
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    // Initialize ChatOpenAI
    const model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
    });

    // Create system and human messages
    const systemMessage = new SystemMessage(
      "You are an expert content analyzer and visual scene creator. Your task is to analyze the transcript of a YouTube video and create a detailed, vivid description that captures the main theme and key points. Focus on creating a description that would make a compelling visual scene for a YouTube short or TikTok reel. The description must be historically accurate and faithful to the actual content and time period discussed in the video. DO NOT create a description that would result in an image with text. Instead, describe a visual scene that represents the content. Be specific about colors, lighting, composition, and visual elements. Stay true to the historical period, setting, and context of the content."
    );

    // Truncate transcript if it's too long (to avoid token limits)
    const truncatedTranscript =
      transcriptText.length > 4000
        ? transcriptText.substring(0, 4000) + "..."
        : transcriptText;

    const humanMessage = new HumanMessage(
      `Please analyze this YouTube video transcript and create a detailed visual scene description that could be used to generate a compelling image for a YouTube short or TikTok reel:\n\n${truncatedTranscript}\n\nRemember to focus on visual elements only, not text. The description should be for a scene that visually represents the content, not text explaining the content. Most importantly, stay true to the historical period, setting, and context of the content. If the content is about a specific time period (like WW1, ancient Rome, etc.), make sure the visual description accurately reflects that period.`
    );

    // Get response from the model
    const response = await model.invoke([systemMessage, humanMessage]);

    return response.content.toString();
  } catch (error) {
    console.error("Error analyzing transcript:", error);
    throw error;
  }
}

/**
 * Creates a variation of the base description to generate distinct images
 * @param baseDescription The original description
 * @param variationIndex The index of the variation
 * @returns A modified description
 */
async function createDescriptionVariation(
  baseDescription: string,
  variationIndex: number
): Promise<string> {
  try {
    // Check if OPENAI_API_KEY is set
    if (!process.env.OPENAI_API_KEY) {
      // If no OpenAI key, create simple variations
      const variations = [
        `${baseDescription} Historical accuracy preserved. Dramatic lighting, cinematic composition.`,
        `${baseDescription} Authentic period details. Vibrant colors, dynamic perspective.`,
        `${baseDescription} True to historical context. Moody atmosphere, artistic style.`,
      ];
      return variations[variationIndex % variations.length];
    }

    // Initialize ChatOpenAI
    const model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.8, // Slightly lower temperature for more controlled variations
    });

    const variationTypes = [
      "Create a variation with different lighting, perspective, and mood. Make it dramatic and cinematic, while maintaining historical accuracy and the authentic context of the original content.",
      "Create a variation with different colors, composition, and style. Make it vibrant and dynamic, while ensuring all period details and historical elements remain accurate and true to the content.",
      "Create a variation with different atmosphere, setting, and visual elements. Make it artistic and unique, while preserving the historical context and time period of the original content.",
    ];

    const systemMessage = new SystemMessage(
      "You are an expert at creating variations of visual scene descriptions. Your task is to take a base description and create a distinct variation that will result in a visually different image when used with an image generation model. Focus only on visual elements, not text content. Most importantly, maintain the historical accuracy, time period, and contextual authenticity of the original description. Never modernize historical content or add anachronistic elements."
    );

    const humanMessage = new HumanMessage(
      `Base description: ${baseDescription}\n\n${
        variationTypes[variationIndex % variationTypes.length]
      }\n\nProvide ONLY the new description, no explanations or other text. Ensure the variation stays true to the historical period and context of the original content.`
    );

    // Get response from the model
    const response = await model.invoke([systemMessage, humanMessage]);

    return response.content.toString();
  } catch (error) {
    console.warn("Error creating description variation:", error);
    // Fallback to simple variation
    return `${baseDescription} ${
      variationIndex === 0
        ? "Historically accurate. Dramatic lighting."
        : variationIndex === 1
        ? "Authentic period details. Vibrant colors."
        : "True to historical context. Artistic style."
    }`;
  }
}

/**
 * Enhances a prompt for better image generation
 * @param prompt The original prompt
 * @returns An enhanced prompt
 */
function enhancePromptForVisualImage(prompt: string): string {
  // Add prefixes and suffixes to guide the model toward visual images
  // Include instructions to maintain historical accuracy
  return `Create a photorealistic visual scene that is historically accurate and contextually appropriate: ${prompt}. High quality, detailed, 4K, no text, cinematic lighting, professional photography. Stay true to the historical period and setting.`;
}

/**
 * Direct fetch to Hugging Face API for image generation
 * @param prompt The text prompt to generate an image from
 * @param useBackupModel Whether to use the backup model
 * @returns A Blob containing the image data
 */
async function fetchImageFromHuggingFace(
  prompt: string,
  useBackupModel = false
): Promise<Blob> {
  console.log(
    `Using direct fetch to Hugging Face API${
      useBackupModel ? " (backup model)" : ""
    }...`
  );

  // Debug: Log API key presence (not the actual key)
  console.log("HF API Key present:", !!process.env.HUGGINGFACE_API_KEY);

  // Enhance the prompt for better visual results
  const enhancedPrompt = enhancePromptForVisualImage(prompt);

  // Add a random seed to ensure different results each time
  const randomSeed = Math.floor(Math.random() * 1000000);

  // Select the model endpoint
  const modelEndpoint = useBackupModel
    ? "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5" // Backup model
    : "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3.5-large"; // Primary model

  // Add negative prompts to avoid anachronistic elements
  const negativePrompt =
    "futuristic, cyberpunk, modern technology, anachronistic elements, text, watermark";

  const response = await fetch(modelEndpoint, {
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      inputs: enhancedPrompt,
      parameters: {
        seed: randomSeed,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        negative_prompt: negativePrompt,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Hugging Face API error: ${response.status} - ${errorText}`
    );
  }

  return await response.blob();
}

/**
 * Generates images based on a description using Hugging Face's Stable Diffusion model
 * @param description The description to generate images from
 * @param count Number of images to generate
 * @param outputDir Directory to save images to
 * @param videoId Video ID for filename
 * @returns Array of paths to the generated images
 */
export async function generateImages(
  description: string,
  count: number,
  outputDir: string,
  videoId: string
): Promise<string[]> {
  try {
    console.log(`Generating ${count} images based on the description...`);

    // Create images directory if it doesn't exist
    const imagesDir = path.join(outputDir, "images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const imagePaths: string[] = [];

    // Generate multiple images with different prompts
    for (let i = 0; i < count; i++) {
      console.log(`Generating image ${i + 1}/${count}...`);

      try {
        // Create a variation of the description for each image
        const variationDescription = await createDescriptionVariation(
          description,
          i
        );
        console.log(
          `Using description variation ${
            i + 1
          }: ${variationDescription.substring(0, 100)}...`
        );

        // Try with primary model first
        let imageBlob: Blob;
        try {
          imageBlob = await fetchImageFromHuggingFace(
            variationDescription,
            false
          );
        } catch (error: any) {
          console.warn(
            "Primary model failed, trying backup model:",
            error.message
          );
          // If primary model fails, try backup model
          imageBlob = await fetchImageFromHuggingFace(
            variationDescription,
            true
          );
        }

        // Convert blob to buffer
        const arrayBuffer = await imageBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Save image to file
        const imagePath = path.join(imagesDir, `${videoId}_${i + 1}.png`);
        fs.writeFileSync(imagePath, buffer);

        imagePaths.push(imagePath);
        console.log(`Image saved to: ${imagePath}`);
      } catch (error) {
        console.error(`Error generating image ${i + 1}:`, error);
        // Continue with next image instead of failing completely
      }
    }

    return imagePaths;
  } catch (error) {
    console.error("Error generating images:", error);
    throw error;
  }
}

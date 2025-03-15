"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readlineSync = __importStar(require("readline-sync"));
const youtube_transcript_1 = require("youtube-transcript");
const transcript_analyzer_1 = require("./transcript-analyzer");
const dotenv = __importStar(require("dotenv"));
// Load environment variables from .env file
dotenv.config();
// Debug: Log environment variables (without showing actual values)
console.log("Environment variables loaded:");
console.log("- HUGGINGFACE_API_KEY present:", !!process.env.HUGGINGFACE_API_KEY);
console.log("- OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
/**
 * Extract the video ID from a YouTube URL
 * @param url YouTube URL
 * @returns Video ID or null if not found
 */
function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
}
/**
 * Download transcript from a YouTube video
 * @param videoId YouTube video ID
 * @returns Promise with transcript text
 */
async function getTranscript(videoId) {
    try {
        const transcript = await youtube_transcript_1.YoutubeTranscript.fetchTranscript(videoId);
        return transcript.map((item) => item.text).join(" ");
    }
    catch (error) {
        console.error("Error fetching transcript:", error);
        throw error;
    }
}
/**
 * Save transcript to a file
 * @param transcript Transcript text
 * @param videoId Video ID for filename
 * @returns Path to the saved transcript file
 */
function saveTranscript(transcript, videoId) {
    const outputDir = path.join(process.cwd(), "transcripts");
    // Create transcripts directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const filePath = path.join(outputDir, `${videoId}.txt`);
    fs.writeFileSync(filePath, transcript);
    console.log(`Transcript saved to: ${filePath}`);
    return outputDir;
}
/**
 * Save description to a file
 * @param description The content description
 * @param videoId Video ID for filename
 * @param outputDir Directory to save the description to
 */
function saveDescription(description, videoId, outputDir) {
    const descriptionPath = path.join(outputDir, `${videoId}_description.txt`);
    fs.writeFileSync(descriptionPath, description);
    console.log(`Description saved to: ${descriptionPath}`);
}
/**
 * Main function to run the program
 */
async function main() {
    console.log("YouTube Transcript Downloader & Image Generator");
    console.log("---------------------------------------------");
    // Check for required API keys
    if (!process.env.HUGGINGFACE_API_KEY) {
        console.error("Error: HUGGINGFACE_API_KEY environment variable is not set");
        console.log("Please create a .env file with your API keys:");
        console.log("HUGGINGFACE_API_KEY=your_huggingface_api_key");
        console.log("OPENAI_API_KEY=your_openai_api_key (optional for content analysis)");
        return;
    }
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
        const outputDir = saveTranscript(transcript, videoId);
        console.log("Transcript downloaded successfully!");
        // Analyze transcript if OpenAI API key is available
        if (process.env.OPENAI_API_KEY) {
            console.log("Analyzing transcript content...");
            const description = await (0, transcript_analyzer_1.analyzeTranscript)(transcript);
            console.log("\nGenerated base description:");
            console.log("------------------------");
            console.log(description);
            console.log("------------------------\n");
            // Save description to file
            saveDescription(description, videoId, outputDir);
            // Generate images based on the description
            console.log("Generating images based on the content...");
            console.log("This will create 3 distinct visual scenes from the description.");
            console.log("Each image will have different visual elements, lighting, and composition.");
            console.log("All images will maintain historical accuracy and stay true to the content's context.");
            console.log("Anachronistic elements like futuristic or cyberpunk themes will be avoided.");
            const imagePaths = await (0, transcript_analyzer_1.generateImages)(description, 3, outputDir, videoId);
            console.log("\nProcess completed successfully!");
            console.log(`Generated ${imagePaths.length} unique images that are historically accurate and contextually appropriate for your YouTube shorts or TikTok reels.`);
            console.log("Image locations:");
            imagePaths.forEach((path, index) => {
                console.log(`Image ${index + 1}: ${path}`);
            });
        }
        else {
            console.log("Skipping content analysis and image generation (OPENAI_API_KEY not set)");
            console.log("To enable these features, add OPENAI_API_KEY to your .env file");
        }
    }
    catch (error) {
        console.error("An error occurred:", error);
    }
}
// Run the program
main().catch(console.error);

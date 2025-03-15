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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readlineSync = __importStar(require("readline-sync"));
const youtube_transcript_1 = require("youtube-transcript");
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
function getTranscript(videoId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const transcript = yield youtube_transcript_1.YoutubeTranscript.fetchTranscript(videoId);
            return transcript.map((item) => item.text).join(" ");
        }
        catch (error) {
            console.error("Error fetching transcript:", error);
            throw error;
        }
    });
}
/**
 * Save transcript to a file
 * @param transcript Transcript text
 * @param videoId Video ID for filename
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
}
/**
 * Main function to run the program
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
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
            const transcript = yield getTranscript(videoId);
            // Save transcript to file
            saveTranscript(transcript, videoId);
            console.log("Transcript downloaded successfully!");
        }
        catch (error) {
            console.error("Failed to download transcript.");
        }
    });
}
// Run the program
main().catch(console.error);

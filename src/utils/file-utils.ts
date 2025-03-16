import * as fs from "fs";
import * as path from "path";
import { config } from "../config";

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath Path to the directory
 * @returns The directory path
 */
export function ensureDirectoryExists(dirPath: string): string {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

/**
 * Create output directory structure for a specific video
 * @param videoId YouTube video ID to create directories for
 * @returns Object with paths to various output directories
 */
export function createOutputDirectories(videoId: string): {
  baseDir: string;
  transcriptDir: string;
  imageDir: string;
} {
  const baseDir = path.join(process.cwd(), config.outputDirectory, videoId);
  const transcriptDir = path.join(baseDir, "transcript");
  const imageDir = path.join(baseDir, "images");

  ensureDirectoryExists(baseDir);
  ensureDirectoryExists(transcriptDir);
  ensureDirectoryExists(imageDir);

  return {
    baseDir,
    transcriptDir,
    imageDir,
  };
}

/**
 * Save text content to a file
 * @param content Content to save
 * @param filePath Path to save the file
 * @returns Full path to the saved file
 */
export function saveTextToFile(content: string, filePath: string): string {
  // Ensure the directory exists
  const directory = path.dirname(filePath);
  ensureDirectoryExists(directory);

  // Write the content to the file
  fs.writeFileSync(filePath, content);
  
  return filePath;
}

/**
 * Save binary data to a file
 * @param data Binary data to save
 * @param filePath Path to save the file
 * @returns Full path to the saved file
 */
export function saveBinaryToFile(data: Buffer, filePath: string): string {
  // Ensure the directory exists
  const directory = path.dirname(filePath);
  ensureDirectoryExists(directory);

  // Write the binary data to the file
  fs.writeFileSync(filePath, data);
  
  return filePath;
}

/**
 * Save multiple text items to separate files with a common prefix
 * @param items Array of text items to save
 * @param directory Directory to save the files in
 * @param filenamePrefix Prefix for the filenames
 * @param extension File extension (defaults to .txt)
 * @returns Array of paths to the saved files
 */
export function saveTextItemsToFiles(
  items: string[],
  directory: string,
  filenamePrefix: string,
  extension = ".txt"
): string[] {
  // Ensure the directory exists
  ensureDirectoryExists(directory);
  
  const filePaths: string[] = [];
  
  // Save each item to a separate file
  items.forEach((item, index) => {
    const filename = `${filenamePrefix}_${index + 1}${extension}`;
    const filePath = path.join(directory, filename);
    saveTextToFile(item, filePath);
    filePaths.push(filePath);
  });
  
  return filePaths;
}
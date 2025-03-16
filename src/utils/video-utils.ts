/**
 * Utility functions for working with YouTube videos
 */

/**
 * Extract the video ID from a YouTube URL
 * @param url YouTube URL
 * @returns Video ID or null if not found
 */
export function extractVideoId(url: string): string | null {
  // Handle different YouTube URL formats
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  
  return match && match[7].length === 11 ? match[7] : null;
}

/**
 * Format a YouTube video URL from a video ID
 * @param videoId YouTube video ID
 * @returns Formatted YouTube URL
 */
export function formatYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Get a YouTube video thumbnail URL
 * @param videoId YouTube video ID
 * @returns URL to the video thumbnail
 */
export function getVideoThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
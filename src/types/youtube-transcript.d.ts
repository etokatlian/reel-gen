declare module "youtube-transcript" {
  export interface TranscriptResponse {
    text: string;
    duration: number;
    offset: number;
  }

  export interface TranscriptConfig {
    lang?: string;
    country?: string;
  }

  export class YoutubeTranscript {
    static fetchTranscript(
      videoId: string,
      options?: TranscriptConfig
    ): Promise<TranscriptResponse[]>;
  }
}

// Application-specific types
export interface ProcessedVideo {
  videoId: string;
  url: string;
  transcript: string;
  keyMoments?: string[];
  imagePaths?: string[];
  outputDirectory: string;
  transcriptPath?: string;
  momentPaths?: string[];
  videoPath?: string;
}

export interface ImageGenerationResult {
  path: string;
  description: string;
}
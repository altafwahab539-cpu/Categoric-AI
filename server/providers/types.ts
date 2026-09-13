/**
 * Categoric AI - Video Generation Provider Abstraction
 */

export interface GenerationRequest {
  prompt: string;
  enhancedPrompt?: string;
  negativePrompt?: string;
  modelId: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p' | '4k';
  durationSeconds?: number;
  inputImageBase64?: string;
  inputImageMime?: string;
  lastFrameImageBase64?: string;
  lastFrameImageMime?: string;
  referenceImages?: Array<{
    imageBase64: string;
    mimeType: string;
    referenceType?: 'asset' | 'style' | 'character';
  }>;
  cameraMovement?: string;
  lens?: string;
  style?: string;
  audioDescription?: string;
  dialogue?: string;
}

export interface ProviderOperationResult {
  operationName: string;
  provider: string;
  model: string;
  isAsync: boolean;
}

export interface ProviderStatusResult {
  done: boolean;
  error?: string;
  videoUri?: string;
  progressStep?: 'QUEUED' | 'GENERATING' | 'AUDIO_RENDERING' | 'FINALIZING' | 'COMPLETED' | 'FAILED';
  rawResponse?: any;
}

export interface VideoGenerationProvider {
  name: string;
  generate(request: GenerationRequest): Promise<ProviderOperationResult>;
  getStatus(operationName: string): Promise<ProviderStatusResult>;
  download(videoUriOrOperationName: string): Promise<Buffer>;
  extend(previousVideoUriOrOperation: any, prompt: string, options: { aspectRatio: '16:9' | '9:16' }): Promise<ProviderOperationResult>;
  supportsImageInput(): boolean;
  supportsReferenceImages(): boolean;
  supportsExtension(): boolean;
  supportsInterpolation(): boolean;
}

/**
 * Categoric AI - Google Veo 3.1 Video Generation Provider
 * Interacts directly with Google's official @google/genai SDK
 * for Veo 3.1 video generation, status polling, and secure download.
 */
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import { VIDEO_MODELS } from '../config.js';
import {
  GenerationRequest,
  ProviderOperationResult,
  ProviderStatusResult,
  VideoGenerationProvider
} from './types.js';

export class GoogleVeoProvider implements VideoGenerationProvider {
  public name = 'google_veo';
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing. Please configure it in your secrets.');
    }
    if (!this.client) {
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
    return this.client;
  }

  supportsImageInput(): boolean {
    return true;
  }

  supportsReferenceImages(): boolean {
    return true;
  }

  supportsExtension(): boolean {
    return true;
  }

  supportsInterpolation(): boolean {
    return true;
  }

  async generate(request: GenerationRequest): Promise<ProviderOperationResult> {
    const ai = this.getClient();
    const modelConfig = VIDEO_MODELS[request.modelId] || VIDEO_MODELS.veo_3_1;
    const modelName = modelConfig.model;

    // Build the finalized prompt (including cinematic camera, lens, style, audio notes)
    let finalPrompt = request.enhancedPrompt || request.prompt;
    const promptParts: string[] = [finalPrompt];

    if (request.style) {
      promptParts.push(`Visual Aesthetic: ${request.style}`);
    }
    if (request.cameraMovement) {
      promptParts.push(`Camera Movement: ${request.cameraMovement}`);
    }
    if (request.lens) {
      promptParts.push(`Lens: ${request.lens}`);
    }
    if (request.audioDescription) {
      promptParts.push(`Audio Environment: ${request.audioDescription}`);
    }
    if (request.dialogue) {
      promptParts.push(`Dialogue: "${request.dialogue}"`);
    }
    if (request.negativePrompt) {
      promptParts.push(`Negative Constraints: ${request.negativePrompt}`);
    }

    const compiledPrompt = promptParts.join('. ');

    const payloadConfig: any = {
      numberOfVideos: 1,
      aspectRatio: request.aspectRatio || '16:9',
      resolution: request.resolution === '4k' ? '1080p' : request.resolution || '720p' // Fallback safely if model limits resolution
    };

    // Veo 3.1 specific 4K check
    if (request.resolution === '4k') {
      if (modelName === 'veo-3.1-generate-preview') {
        payloadConfig.resolution = '4k';
      } else {
        payloadConfig.resolution = '1080p';
      }
    }

    // Build the request payload for @google/genai
    const generateParams: any = {
      model: modelName,
      prompt: compiledPrompt,
      config: payloadConfig
    };

    // Mode A & B: Image to Video (Starting frame)
    if (request.inputImageBase64) {
      generateParams.image = {
        imageBytes: request.inputImageBase64,
        mimeType: request.inputImageMime || 'image/jpeg'
      };
    }

    // Mode D: First Frame -> Last Frame Interpolation
    if (request.lastFrameImageBase64) {
      payloadConfig.lastFrame = {
        imageBytes: request.lastFrameImageBase64,
        mimeType: request.lastFrameImageMime || 'image/jpeg'
      };
    }

    // Mode C: Reference Images (up to 3, requires veo-3.1-generate-preview, 720p, 16:9)
    if (request.referenceImages && request.referenceImages.length > 0) {
      generateParams.model = 'veo-3.1-generate-preview';
      payloadConfig.resolution = '720p';
      payloadConfig.aspectRatio = '16:9';

      const refPayload: any[] = [];
      for (const ref of request.referenceImages.slice(0, 3)) {
        refPayload.push({
          image: {
            imageBytes: ref.imageBase64,
            mimeType: ref.mimeType || 'image/jpeg'
          },
          referenceType: 'ASSET'
        });
      }
      payloadConfig.referenceImages = refPayload;
    }

    try {
      console.log(`[GoogleVeoProvider] Initiating video generation with model: ${generateParams.model}`);
      const operation = await ai.models.generateVideos(generateParams);

      if (!operation || !operation.name) {
        throw new Error('Provider did not return a valid operation name.');
      }

      console.log(`[GoogleVeoProvider] Operation received: ${operation.name}`);
      return {
        operationName: operation.name,
        provider: this.name,
        model: generateParams.model,
        isAsync: true
      };
    } catch (err: any) {
      console.error('[GoogleVeoProvider] Generate failed:', err);
      const msg = err?.message || 'Failed to submit generation job to Veo 3.1';
      throw new Error(msg);
    }
  }

  async getStatus(operationName: string): Promise<ProviderStatusResult> {
    const ai = this.getClient();
    try {
      const op = new GenerateVideosOperation();
      op.name = operationName;

      const updated = await ai.operations.getVideosOperation({ operation: op });

      if (updated.done) {
        if (updated.error) {
          return {
            done: true,
            error: (updated.error as any)?.message || String(updated.error) || 'Veo generation encountered an error',
            progressStep: 'FAILED'
          };
        }

        const generatedVideos = updated.response?.generatedVideos;
        if (!generatedVideos || generatedVideos.length === 0) {
          return {
            done: true,
            error: 'No generated video was returned by the Veo service.',
            progressStep: 'FAILED'
          };
        }

        const videoUri = (generatedVideos[0]?.video as any)?.uri as string | undefined;
        return {
          done: true,
          videoUri,
          progressStep: 'COMPLETED',
          rawResponse: updated.response
        };
      }

      // In progress
      return {
        done: false,
        progressStep: 'GENERATING'
      };
    } catch (err: any) {
      console.error('[GoogleVeoProvider] getStatus error:', err);
      return {
        done: true,
        error: err?.message || 'Failed to query operation status',
        progressStep: 'FAILED'
      };
    }
  }

  async download(videoUri: string): Promise<Buffer> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required to download generated video.');
    }

    console.log(`[GoogleVeoProvider] Fetching video from signed provider URI...`);
    const res = await fetch(videoUri, {
      headers: {
        'x-goog-api-key': apiKey
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to download video from Google Veo storage. Status: ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async extend(previousVideoUri: string, prompt: string, options: { aspectRatio: '16:9' | '9:16' }): Promise<ProviderOperationResult> {
    const ai = this.getClient();
    const model = 'veo-3.1-generate-preview';

    try {
      console.log(`[GoogleVeoProvider] Extending video with prompt: "${prompt}"`);
      const operation = await ai.models.generateVideos({
        model,
        prompt: prompt || 'Continue the scene with natural cinematic camera movement and environmental detail.',
        video: {
          uri: previousVideoUri
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: options.aspectRatio || '16:9'
        }
      });

      return {
        operationName: operation.name,
        provider: this.name,
        model,
        isAsync: true
      };
    } catch (err: any) {
      console.error('[GoogleVeoProvider] Extend failed:', err);
      throw new Error(err?.message || 'Failed to extend video with Veo 3.1');
    }
  }
}

export const googleVeoProvider = new GoogleVeoProvider();

/**
 * Categoric AI - Prompt Intelligence & Cinematic Video Enhancer
 * Uses Google Gemini (gemini-3.8-flash) to transform raw user ideas
 * into richly specified, photorealistic Veo 3.1 video prompts.
 */
import { GoogleGenAI } from '@google/genai';

export interface PromptBuilderInput {
  rawPrompt: string;
  subject?: string;
  action?: string;
  environment?: string;
  location?: string;
  time?: string;
  lighting?: string;
  camera?: string;
  lens?: string;
  composition?: string;
  movement?: string;
  visualStyle?: string;
  mood?: string;
  color?: string;
  audio?: string;
  dialogue?: string;
  negativeInstructions?: string;
}

export class PromptEnhancerService {
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required for prompt enhancement');
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

  /**
   * Intelligently enhances a simple user prompt or structured fields into a cinematic Veo prompt
   */
  async enhancePrompt(input: PromptBuilderInput): Promise<{
    enhancedPrompt: string;
    suggestedCamera: string;
    suggestedLighting: string;
    suggestedAudio: string;
  }> {
    const ai = this.getClient();

    const systemInstruction = `You are the lead director and cinematographer at Categoric AI, an elite AI video generation platform powered by Google Veo 3.1.
Your task is to take a user's raw prompt or structured inputs and craft an ultra-detailed, photorealistic, cinematic video prompt engineered specifically for Google Veo 3.1 video models.

Follow these cinematic guidelines:
1. Synthesize: SUBJECT, ACTION, ENVIRONMENT, CAMERA, COMPOSITION, LIGHTING, LENS, MOTION, MATERIALS, PHYSICS, ATMOSPHERE, STYLE, and AUDIO.
2. Preserve user intent: Do not change the core concept, culture, or story. Elevate the realism and physical optics.
3. Be precise with camera optics (e.g. 35mm anamorphic, 50mm f/1.4, subtle handheld sway, drone tilt-down, macro rim light).
4. Audio & ambience: Suggest ambient sounds, subtle foley, and realistic acoustics appropriate to the scene.
5. Return clean JSON with:
   - "enhancedPrompt": Single paragraph of dense, evocative, cinematic description (100-150 words).
   - "suggestedCamera": Recommended camera motion (e.g., "Tracking Shot", "Dolly In", "Orbit", "Handheld").
   - "suggestedLighting": Recommended lighting style (e.g., "Golden Hour Sunset", "Volumetric Neon", "Studio Rim Light").
   - "suggestedAudio": Recommended sound design / audio prompt (e.g., "Busy Lahore bazaar ambience with distant vehicle horns and gentle chatter").`;

    const userPromptContent = `Raw Input: "${input.rawPrompt || ''}"
Structured Elements (if provided):
- Subject: ${input.subject || 'N/A'}
- Action: ${input.action || 'N/A'}
- Environment: ${input.environment || 'N/A'}
- Location: ${input.location || 'N/A'}
- Time/Day: ${input.time || 'N/A'}
- Lighting: ${input.lighting || 'N/A'}
- Camera Movement: ${input.camera || 'N/A'}
- Lens: ${input.lens || 'N/A'}
- Composition: ${input.composition || 'N/A'}
- Visual Style: ${input.visualStyle || 'N/A'}
- Mood: ${input.mood || 'N/A'}
- Audio: ${input.audio || 'N/A'}
- Dialogue: ${input.dialogue || 'N/A'}
- Negative Instructions: ${input.negativeInstructions || 'N/A'}

Generate the optimized cinematic Veo 3.1 prompt. Return only valid JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPromptContent,
        config: {
          systemInstruction,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);

      return {
        enhancedPrompt: parsed.enhancedPrompt || input.rawPrompt,
        suggestedCamera: parsed.suggestedCamera || input.camera || 'Tracking Shot',
        suggestedLighting: parsed.suggestedLighting || input.lighting || 'Cinematic Natural',
        suggestedAudio: parsed.suggestedAudio || input.audio || 'Ambient environment soundscape'
      };
    } catch (err: any) {
      console.warn('[PromptEnhancer] Gemini prompt enhancement fallback:', err.message);
      // Clean rule-based fallback if API is unreachable or key not configured yet
      const fallbackPrompt = `Ultra-realistic cinematic shot of ${input.rawPrompt || input.subject || 'scene'}, with authentic physical lighting, ${input.lighting || 'natural sunlight'}, captured on a ${input.lens || '50mm prime lens'} with ${input.camera || 'smooth tracking motion'}, shallow depth of field, high dynamic range and subtle ambient acoustics.`;
      return {
        enhancedPrompt: fallbackPrompt,
        suggestedCamera: input.camera || 'Cinematic Tracking',
        suggestedLighting: input.lighting || 'Golden Hour',
        suggestedAudio: input.audio || 'Natural ambient sounds'
      };
    }
  }

  /**
   * AI Director: Generates a multi-scene storyboard script from a brief
   * (e.g. "Make a 30-second advertisement for my burger shop")
   */
  async generateStoryboard(concept: string): Promise<Array<{
    sceneNumber: number;
    title: string;
    prompt: string;
    camera: string;
    audio: string;
    duration: number;
  }>> {
    const ai = this.getClient();

    const promptText = `You are a world-class commercial director. Create a 4 to 5 scene storyboard for a video production based on this concept:
"${concept}"

For each scene provide:
- sceneNumber (1 to 5)
- title (e.g. "Exterior Restaurant Glow", "Sizzling Patty Assembly", "Crispy Bite Reaction")
- prompt (High quality photorealistic prompt for Google Veo 3.1)
- camera (e.g., "Dolly In", "Macro Close-up", "Low Angle Pan")
- audio (Sound effects and foley)
- duration (4, 6, or 8 seconds)

Return valid JSON with an array named "scenes".`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (Array.isArray(parsed.scenes)) {
        return parsed.scenes;
      }
      return parsed;
    } catch (err: any) {
      console.error('[PromptEnhancer] Storyboard generation failed:', err);
      // Fallback 4 scenes
      return [
        {
          sceneNumber: 1,
          title: 'Establishing Shot',
          prompt: `Cinematic wide establishing shot of ${concept}, atmospheric lighting, 35mm lens, smooth aerial push-in.`,
          camera: 'Dolly In',
          audio: 'Distant city rumble, soft gentle breeze',
          duration: 6
        },
        {
          sceneNumber: 2,
          title: 'Hero Detail',
          prompt: `Extreme close-up macro of hero element in ${concept}, glistening texture, dynamic rim light, 100mm lens.`,
          camera: 'Macro',
          audio: 'Crisp sizzle and tactile foley',
          duration: 4
        },
        {
          sceneNumber: 3,
          title: 'Human Interaction',
          prompt: `Medium tracking shot of person experiencing ${concept}, authentic joyful facial expression, warm bokeh.`,
          camera: 'Tracking Shot',
          audio: 'Subtle ambient conversation, warm upbeat acoustic chords',
          duration: 6
        },
        {
          sceneNumber: 4,
          title: 'Final Hero Climax',
          prompt: `Slow motion orbit around the completed product for ${concept}, golden hour light flare, immaculate commercial finish.`,
          camera: 'Orbit',
          audio: 'Musical crescendo and smooth brand signature sting',
          duration: 6
        }
      ];
    }
  }
}

export const promptEnhancerService = new PromptEnhancerService();

import type { MintGeminiLiveTokenOptions } from './mint-gemini-live-token-options';
import { toGeminiSchema } from './to-gemini-schema';

const AUDIO = 'AUDIO';
const NONE = 0;

/**
 * The `bidiGenerateContentSetup` baked into a token.
 *
 * @remarks
 * - **Audio out, text through transcription.** Native-audio models accept only
 *   the `AUDIO` modality; a UI's transcript comes from the two transcription
 *   streams, which is why both are always on.
 * - **A sliding window, always.** Without one the whole conversation is re-sent
 *   as context every turn, so a long session costs with the square of its length.
 * - **Resumption is always enabled**, with the handle when there is one: the
 *   socket is dropped roughly every ten minutes, and a handle is what lets the
 *   next one continue without paying setup and context again.
 * - **Tools are declared in the measured form.** `parameters` is ordinary JSON
 *   Schema in a `ToolDefinition`; `toGeminiSchema` spells its types the way the
 *   Live API is known to accept them.
 */
export function buildLiveSetup(options: MintGeminiLiveTokenOptions): Record<string, unknown> {
  const tools = options.tools ?? [];
  return {
    model: options.model,
    generationConfig: {
      responseModalities: [AUDIO],
      ...(options.languageCode !== undefined || options.voiceName !== undefined
        ? {
            speechConfig: {
              ...(options.languageCode !== undefined ? { languageCode: options.languageCode } : {}),
              ...(options.voiceName !== undefined
                ? { voiceConfig: { prebuiltVoiceConfig: { voiceName: options.voiceName } } }
                : {}),
            },
          }
        : {}),
    },
    ...(options.systemInstruction !== undefined ? { systemInstruction: { parts: [{ text: options.systemInstruction }] } } : {}),
    ...(tools.length > NONE
      ? {
          tools: [
            {
              functionDeclarations: tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                ...(tool.parameters !== undefined ? { parameters: toGeminiSchema(tool.parameters) } : {}),
              })),
            },
          ],
        }
      : {}),
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    contextWindowCompression: { slidingWindow: {} },
    sessionResumption: options.resumptionHandle !== undefined ? { handle: options.resumptionHandle } : {},
  };
}

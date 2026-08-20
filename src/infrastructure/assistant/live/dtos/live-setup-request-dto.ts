/**
 * The one frame that configures a live session, exactly as it goes on the wire.
 *
 * It is sent once, before anything else, and nothing in it can be changed
 * afterwards — which is why the tool list here is a single entry rather than
 * one tool per screen.
 */
export interface LiveSetupRequestDto {
  setup: {
    model: string;
    generationConfig: { responseModalities: string[]; speechConfig?: { languageCode: string } };
    systemInstruction: { parts: { text: string }[] };
    tools: {
      functionDeclarations: {
        name: string;
        description: string;
        parameters: {
          type: string;
          properties: {
            action: { type: string; enum: readonly string[] };
            arg: { type: string; description: string };
          };
          required: string[];
        };
      }[];
    }[];
    inputAudioTranscription: Record<string, never>;
    outputAudioTranscription: Record<string, never>;
    contextWindowCompression: { slidingWindow: Record<string, never> };
    sessionResumption: { handle?: string };
  };
}

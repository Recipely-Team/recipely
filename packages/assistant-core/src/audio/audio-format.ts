/**
 * The sample rates a provider speaks. Adapters declare their own: Gemini Live
 * takes 16 kHz and answers at 24 kHz, an OpenAI-Realtime-compatible provider
 * uses 24 kHz both ways. The audio layer resamples to whatever is declared.
 */
export interface AudioFormat {
  readonly inputSampleRate: number;
  readonly outputSampleRate: number;
}

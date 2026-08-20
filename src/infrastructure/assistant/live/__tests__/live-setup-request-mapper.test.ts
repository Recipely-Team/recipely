import { AssistantAction } from '@domain/assistant/assistant-action-type';
import { toLiveSetupRequest } from '@infrastructure/assistant/live/live-setup-request-mapper';

describe('live-setup-request-mapper', () => {
  const setup = (overrides: Partial<Parameters<typeof toLiveSetupRequest>[0]> = {}) =>
    toLiveSetupRequest({ model: 'models/gemini-flash-latest', languageCode: 'tr-TR', ...overrides }).setup;

  // The Live API fixes the tool list at setup and will not accept a new one
  // mid-session. The assistant navigates between screens while talking, so a
  // second tool here means reconnecting — and paying setup and context again —
  // every time it moves.
  it('declares exactly one tool', () => {
    expect(setup().tools).toHaveLength(1);
    expect(setup().tools[0]!.functionDeclarations).toHaveLength(1);
    expect(setup().tools[0]!.functionDeclarations[0]!.name).toBe('runAction');
  });

  // The words the model may choose from and the words the registry dispatches
  // have to be the same list; typing them out here is how they drift.
  it('offers exactly the action vocabulary, in one enum', () => {
    const { properties } = setup().tools[0]!.functionDeclarations[0]!.parameters;

    expect(properties.action.enum).toEqual(Object.values(AssistantAction));
    expect(properties.action.enum).toContain(AssistantAction.GenerateRecipe);
  });

  it('requires the action and leaves the argument optional', () => {
    const { required } = setup().tools[0]!.functionDeclarations[0]!.parameters;

    expect(required).toEqual(['action']);
  });

  // Native-audio models accept only the AUDIO modality; asking for TEXT as well
  // is rejected at setup, and the on-screen text comes from transcription.
  it('asks for audio only, with both transcriptions on', () => {
    expect(setup().generationConfig.responseModalities).toEqual(['AUDIO']);
    expect(setup().inputAudioTranscription).toEqual({});
    expect(setup().outputAudioTranscription).toEqual({});
  });

  // Without a sliding window the whole conversation is re-sent as context on
  // every turn, so a ten-minute session costs with the square of its length.
  it('turns on context-window compression', () => {
    expect(setup().contextWindowCompression).toEqual({ slidingWindow: {} });
  });

  describe('resumption', () => {
    it('asks for a handle but sends none on a fresh session', () => {
      expect(setup().sessionResumption).toEqual({});
    });

    // The connection drops roughly every ten minutes. Continuing without the
    // handle means paying setup and the whole context again.
    it('sends the handle back when continuing after a goAway', () => {
      expect(setup({ resumptionHandle: 'h-7' }).sessionResumption).toEqual({ handle: 'h-7' });
    });
  });

  // A listed model is not necessarily a callable one — this app has already had
  // a published id answer NOT_FOUND — so the backend says which to use and a
  // model change ships without an app update.
  it('takes the model and language from its caller', () => {
    expect(setup({ model: 'models/other' }).model).toBe('models/other');
    expect(setup({ languageCode: 'en-US' }).generationConfig.speechConfig?.languageCode).toBe('en-US');
  });

  // Re-sent on every session and every resumption, so its length is a
  // per-session tax rather than a one-off.
  it('keeps the system instruction short', () => {
    const [instruction] = setup().systemInstruction.parts;

    expect(instruction!.text.length).toBeLessThan(400);
  });
});

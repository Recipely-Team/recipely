import { AssistantAction } from '@domain/assistant/assistant-action-type';
import type { LiveSetupRequestDto } from '@infrastructure/assistant/live/dtos/live-setup-request-dto';
import type { RequestMapper } from '@core/mapper/request-mapper';

/**
 * Builds the frame that opens a live session.
 *
 * @remarks
 * - **Everything here is fixed for the life of the session.** The API accepts
 *   this once; there is no way to add a tool, change the system instruction or
 *   switch modality later. An assistant that walks between screens therefore
 *   gets one tool whose `action` enum spans every screen, rather than a tool
 *   list that would have to be re-declared — which would mean reconnecting, and
 *   paying setup and context again, on every navigation.
 * - **The enum comes from the vocabulary, not from a list typed here.** That
 *   is what keeps the words the model is offered identical to the ones the
 *   registry dispatches, which is the whole point of rule 5 for this feature.
 * - **`AUDIO` alone, because native-audio models accept nothing else.** Asking
 *   for `TEXT` as well is rejected at setup; the text on screen comes from the
 *   two transcription streams, which is why both are switched on here rather
 *   than being optional extras.
 * - **`slidingWindow` is what makes a long session affordable**: without it the
 *   whole conversation is re-sent as context on every turn, so the cost of a
 *   ten-minute session grows with its square rather than its length.
 * - **The model id is an argument, never a constant.** A listed model is not
 *   necessarily a callable one, and this app has already been bitten by a
 *   published id answering `NOT_FOUND`. The backend mints the session and says
 *   which model to use, so a model change ships without an app update.
 */
// Kept deliberately short — the system instruction is re-sent on every session
// and on every resumption, so its length is a per-session tax. Examples of what
// to do belong in the action names, which the model reads anyway.
const SYSTEM_INSTRUCTION =
  'You drive the Recipely app for the user. Decide what to do and call runAction; ' +
  'never dictate the user\'s words into fields. Keep spoken replies to one short sentence. ' +
  'Never compose recipe text yourself — call generateRecipe and let the app write it. ' +
  'Reply in the language the user speaks.';

const TOOL_NAME = 'runAction';
const TOOL_DESCRIPTION = 'Perform one action in the Recipely app.';
const ARG_DESCRIPTION = 'The action argument: a recipe prompt, a search query, a field value, or an id.';
const AUDIO_MODALITY = 'AUDIO';
const OBJECT_TYPE = 'OBJECT';
const STRING_TYPE = 'STRING';
const ACTION_PROPERTY = 'action';

// Only this file names it, so rule 1 keeps it unexported and next to its use.
interface LiveSetupInput {
  model: string;
  languageCode: string;
  /** Present only when continuing a session the server asked us to leave. */
  resumptionHandle?: string;
}

export const toLiveSetupRequest: RequestMapper<LiveSetupInput, LiveSetupRequestDto> = (input) => ({
  setup: {
    model: input.model,
    generationConfig: {
      responseModalities: [AUDIO_MODALITY],
      speechConfig: { languageCode: input.languageCode },
    },
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    tools: [
      {
        functionDeclarations: [
          {
            name: TOOL_NAME,
            description: TOOL_DESCRIPTION,
            parameters: {
              type: OBJECT_TYPE,
              properties: {
                action: { type: STRING_TYPE, enum: Object.values(AssistantAction) },
                arg: { type: STRING_TYPE, description: ARG_DESCRIPTION },
              },
              required: [ACTION_PROPERTY],
            },
          },
        ],
      },
    ],
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    contextWindowCompression: { slidingWindow: {} },
    sessionResumption: input.resumptionHandle === undefined ? {} : { handle: input.resumptionHandle },
  },
});

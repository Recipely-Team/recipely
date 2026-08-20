import { toLiveSetupRequest } from '@infrastructure/assistant/live/live-setup-request-mapper';

/**
 * These assert a deliberate ABSENCE, which is unusual enough to explain.
 *
 * The plan had this mapper building the whole session: system instruction, the
 * single `runAction` tool and its action enum, the audio modality, both
 * transcriptions, sliding-window compression, the resumption handle. Measured
 * against the live API, none of it had any effect. With an ephemeral token the
 * setup baked in at mint time is authoritative and this frame's contents are
 * discarded — sending the full setup and sending `{ model }` produced sessions
 * identical down to the prompt token count, and a client that declared tools
 * the token did not carry got a session with no tools and no error saying so.
 *
 * So anything added back here would be a lie the type system cannot catch.
 * That is what these tests are guarding.
 */
describe('live-setup-request-mapper', () => {
  it('sends the model, because the frame has to carry something', () => {
    expect(toLiveSetupRequest({ model: 'models/gemini-3.1-flash-live-preview' })).toEqual({
      setup: { model: 'models/gemini-3.1-flash-live-preview' },
    });
  });

  // The frame is a trigger, not a configuration: a session that never sends one
  // does not error, it hangs until it times out.
  it('carries nothing the server would ignore', () => {
    const { setup } = toLiveSetupRequest({ model: 'models/any' });

    expect(Object.keys(setup)).toEqual(['model']);
  });
});

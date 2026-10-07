import { AskAssistantUseCase } from '@application/assistant/session/ask-assistant-use-case';
import type { AssistantMessengerInterface } from '@domain/assistant/session/assistant-messenger-interface';

const messengerSpy = (): { messenger: AssistantMessengerInterface; ask: jest.Mock } => {
  const ask = jest.fn().mockResolvedValue({ ok: true, value: { reply: 'Tamam' } });
  return { messenger: { ask }, ask };
};

describe('AskAssistantUseCase', () => {
  it('sends the screen line the turn was typed on', async () => {
    const { messenger, ask } = messengerSpy();

    const answered = await new AskAssistantUseCase(messenger).execute('kaydet', 'tr', 'screen=recipe');

    expect(ask).toHaveBeenCalledWith('kaydet', 'tr', 'screen=recipe');
    expect(answered).toEqual({ ok: true, value: { reply: 'Tamam' } });
  });

  it('omits an empty screen line, which the backend would append to the prompt', async () => {
    const { messenger, ask } = messengerSpy();

    await new AskAssistantUseCase(messenger).execute('merhaba', 'tr', '');

    expect(ask).toHaveBeenCalledWith('merhaba', 'tr', undefined);
  });
});

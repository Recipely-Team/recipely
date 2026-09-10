import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { parseOsIntentLink } from '@presentation/navigation/os-intent-link';

describe('parseOsIntentLink — what a launcher shortcut may ask for', () => {
  it('reads the action and its argument', () => {
    expect(parseOsIntentLink('/assistant/run?action=search&arg=mercimek')).toEqual({
      action: AssistantAction.Search,
      arg: 'mercimek',
    });
  });

  // A scheme URL reaches expo-router with its host collapsed into the path, and
  // the number of leading slashes differs between a cold launch and a warm one.
  it.each(['assistant/run', '/assistant/run', '///assistant/run', '/assistant/run/'])(
    'accepts %s, however the launch collapsed the slashes',
    (route) => {
      expect(parseOsIntentLink(`${route}?action=refresh`)).toEqual({
        action: AssistantAction.Refresh,
        arg: null,
      });
    },
  );

  it('decodes an argument that was percent-encoded', () => {
    expect(parseOsIntentLink('/assistant/run?action=search&arg=k%C3%B6fte')?.arg).toBe('köfte');
  });

  it('treats an empty argument as no argument', () => {
    expect(parseOsIntentLink('/assistant/run?action=refresh&arg=')?.arg).toBeNull();
  });
});

describe('parseOsIntentLink — what it must refuse', () => {
  // A shortcut pinned to the launcher outlives the build that created it. A
  // user who pinned a recipe last year can tap it after an update renamed the
  // action, and that has to land the app on a screen rather than dispatch a
  // word nothing answers.
  it('refuses an action this build no longer knows', () => {
    expect(parseOsIntentLink('/assistant/run?action=writeBio&arg=hello')).toBeNull();
  });

  it('refuses a link with no action at all', () => {
    expect(parseOsIntentLink('/assistant/run?arg=mercimek')).toBeNull();
  });

  // `includes('assistant/run')` would have accepted this, and a recipe whose id
  // merely contained the phrase would have been read as a command.
  it('refuses a path that only contains the link, rather than being it', () => {
    expect(parseOsIntentLink('/recipes/assistant/run?action=search&arg=x')).toBeNull();
    expect(parseOsIntentLink('/recipes/abc-assistant/run-123?action=search')).toBeNull();
  });

  it('refuses an ordinary route', () => {
    expect(parseOsIntentLink('/recipes?q=mercimek')).toBeNull();
    expect(parseOsIntentLink('/')).toBeNull();
  });
});

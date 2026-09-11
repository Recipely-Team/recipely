import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { CONFIRMED_ACTIONS } from '@domain/assistant/actions/confirmed-actions';
import { OS_INTENT_CATALOGUE } from '@domain/assistant/os/os-intent-catalogue';
import { isOsReachableAction } from '@domain/assistant/os/is-os-reachable-action';
import { OsIntentId } from '@domain/assistant/os/os-intent-id';

describe('OS intent catalogue — it may only offer words the app answers', () => {
  // The in-app assistant already shipped an empty registry once: twenty-three
  // actions were offered to the model and none had a handler. An OS intent is
  // worse, because Siri offers the phrase to the user before the app is even
  // running — the failure arrives as the app denying something the system just
  // promised. The boundaries refuse `confirm` and `cancel` from the OS, so an
  // entry offering one would be a phrase that is dropped every time it is said.
  it('names only actions the assistant vocabulary defines and the OS may send', () => {
    for (const entry of OS_INTENT_CATALOGUE) {
      if (entry.action === null) continue;
      expect(isOsReachableAction(entry.action)).toBe(true);
    }
  });

  it('gives every id in the vocabulary exactly one entry', () => {
    const ids = OS_INTENT_CATALOGUE.map((entry) => entry.id);

    expect([...ids].sort()).toEqual(Object.values(OsIntentId).sort());
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('OS intent catalogue — nothing destructive may run unattended', () => {
  // A headless entry is answered by native code with no screen, so the
  // confirmation sheet the registry relies on never appears. The in-app
  // assistant learned that a safety gate has to be answerable in the same
  // modality it interrupts; a gate that cannot appear at all is worse than one
  // the user cannot reach.
  it('marks no confirmed action headless', () => {
    const headless = OS_INTENT_CATALOGUE.filter((entry) => entry.headless);

    for (const entry of headless) {
      expect(CONFIRMED_ACTIONS).not.toContain(entry.action);
    }
  });

  it('keeps every destructive word out of the catalogue entirely', () => {
    const offered = OS_INTENT_CATALOGUE.map((entry) => entry.action);

    for (const confirmed of CONFIRMED_ACTIONS) {
      expect(offered).not.toContain(confirmed);
    }
  });
});

describe('OS intent catalogue — the free-text entries', () => {
  // Siri will not fill a freeform string from inside a shortcut phrase, so an
  // entry that wants a sentence has to arrive by one of two routes: Apple's
  // searchInApp schema, or a parameterless phrase plus a follow-up question.
  // `askRecipely` is the only entry with no fixed action, because it is the
  // only one where the assistant, not the catalogue, decides what to do.
  it('leaves exactly one entry without a fixed action, and it is the headless one', () => {
    const openEnded = OS_INTENT_CATALOGUE.filter((entry) => entry.action === null);

    expect(openEnded.map((entry) => entry.id)).toEqual([OsIntentId.AskRecipely]);
    expect(openEnded[0]?.headless).toBe(true);
  });

  it('routes search through the action the feed already answers', () => {
    const search = OS_INTENT_CATALOGUE.find((entry) => entry.id === OsIntentId.SearchRecipes);

    expect(search?.action).toBe(AssistantAction.Search);
    expect(search?.headless).toBe(false);
  });
});

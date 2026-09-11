import { Speaker } from '../../session/speaker';
import { ToolRunStatus } from '../tool-run-status';
import { Transcript } from '../transcript';
import { TranscriptEntryKind } from '../transcript-entry-kind';

const texts = (t: Transcript) =>
  t.entries.map((e) => (e.kind === TranscriptEntryKind.Message ? `${e.speaker}:${e.text}` : `tool:${e.call.name}`));

describe('Transcript', () => {
  // Transcription streams; one entry per fragment turned an answer into a
  // column of one-word bubbles.
  it('joins the fragments of one utterance into one message', () => {
    const t = new Transcript();
    t.appendSpeech(Speaker.Assistant, 'The alarm ');
    t.appendSpeech(Speaker.Assistant, 'is set.');

    expect(texts(t)).toEqual(['assistant:The alarm is set.']);
    expect(t.entries[0]).toMatchObject({ isFinal: false });
  });

  it('keeps the id stable while a message grows, so a list can animate it', () => {
    const t = new Transcript();
    t.appendSpeech(Speaker.User, 'set an');
    const id = t.entries[0]!.id;
    t.appendSpeech(Speaker.User, ' alarm');

    expect(t.entries[0]!.id).toBe(id);
  });

  // Two things said in a row with no reply between merged into one bubble
  // until the caller's pause closed the turn.
  it('starts a new message after the turn is closed', () => {
    const t = new Transcript();
    t.appendSpeech(Speaker.User, 'first');
    t.closeTurn();
    t.appendSpeech(Speaker.User, 'second');

    expect(texts(t)).toEqual(['user:first', 'user:second']);
    expect(t.entries[0]).toMatchObject({ isFinal: true });
  });

  it('closes a message when the other party speaks or a tool runs', () => {
    const t = new Transcript();
    t.appendSpeech(Speaker.User, 'open settings');
    t.addTool({ id: 'c1', name: 'navigate', args: {} });
    t.appendSpeech(Speaker.Assistant, 'Done');
    t.appendSpeech(Speaker.User, 'thanks');

    expect(texts(t)).toEqual(['user:open settings', 'tool:navigate', 'assistant:Done', 'user:thanks']);
  });

  it('settles a running tool once and never reopens a cancelled one', () => {
    const t = new Transcript();
    t.addTool({ id: 'c1', name: 'navigate', args: {} });
    t.settleTool('c1', ToolRunStatus.Cancelled);
    t.settleTool('c1', ToolRunStatus.Succeeded, { ok: true });

    expect(t.entries[0]).toMatchObject({ status: ToolRunStatus.Cancelled });
  });

  it('produces a new array on every change and keeps untouched entries identical', () => {
    const t = new Transcript();
    t.addMessage(Speaker.User, 'hi');
    const before = t.entries;
    t.appendSpeech(Speaker.Assistant, 'Hello');

    expect(t.entries).not.toBe(before);
    expect(t.entries[0]).toBe(before[0]);
  });
});

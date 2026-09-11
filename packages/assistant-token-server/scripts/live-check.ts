/**
 * End-to-end check against the real Gemini Live API, run by hand with a key:
 *
 *   read -s GEMINI_API_KEY && export GEMINI_API_KEY
 *   npx tsx packages/assistant-token-server/scripts/live-check.ts
 *
 * or, with the key in a server's env file (GEMINI_API_KEYS pools are read too):
 *
 *   npx tsx --env-file=<path to .env> packages/assistant-token-server/scripts/live-check.ts
 *
 * 1. Mints a token with this package (instruction + a generic `startTimer`
 *    tool), runs the headless controller over it with a silent microphone,
 *    and prints the tool call the model made and the transcript.
 * 2. Answers an open question: does a token minted WITHOUT a setup honour the
 *    client's own setup frame? It asks for a reply of exactly "BANANA".
 *
 * The key is read from the environment and never printed.
 */
import { AssistantController, ToolRegistry, ok } from '@live-assistant/core';
import type { AssistantMicrophone, AssistantPlayer, TranscriptEntry } from '@live-assistant/core';
import { GeminiLiveSession } from '@live-assistant/gemini';
import { GeminiEndpoints, mintGeminiLiveToken } from '@live-assistant/token-server';

// A single key, or the first of a comma-separated pool (as a server's .env often holds them).
const apiKey =
  [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEYS_PAID, process.env.GEMINI_API_KEYS, process.env.GEMINI_API_KEYS_FREE]
    .map((value) => (value ?? '').split(',')[0]?.trim() ?? '')
    .find((value) => value.length > 0) ?? '';
const model = process.env.GEMINI_LIVE_MODEL ?? 'models/gemini-3.1-flash-live-preview';
const TIMEOUT_MS = 40_000;

const describe = (entry: TranscriptEntry): string =>
  entry.kind === 'tool' ? `tool:${entry.call.name}=${entry.status}` : `${entry.speaker}:${entry.text}`;

async function checkMintAndTools(): Promise<void> {
  const microphone: AssistantMicrophone = {
    cancelsEcho: true,
    level: () => 0,
    ensureAccess: async () => ok(undefined),
    start: async () => ok(undefined),
    stop: async () => undefined,
  };
  let audioSamples = 0;
  const player: AssistantPlayer = {
    level: () => 0,
    remainingSeconds: () => 0,
    prepare: async () => ok(undefined),
    enqueue: (samples) => {
      audioSamples += samples.length;
    },
    flush: () => undefined,
    stop: async () => undefined,
  };
  const received: unknown[] = [];
  const tools = new ToolRegistry([
    {
      definition: {
        name: 'startTimer',
        description: 'Starts a kitchen timer',
        parameters: {
          type: 'object',
          properties: { minutes: { type: 'number', description: 'Length in minutes' } },
          required: ['minutes'],
        },
      },
      run: (args) => {
        received.push(args);
        return { ok: true, startedMinutes: args.minutes };
      },
    },
  ]);

  const controller = new AssistantController({
    session: new GeminiLiveSession(),
    microphone,
    player,
    tools,
    getConnection: async ({ resumptionHandle }) => {
      const minted = await mintGeminiLiveToken({
        apiKey,
        model,
        systemInstruction: 'You are a kitchen timer. When asked for a timer, call startTimer, then confirm in one short sentence.',
        tools: tools.definitions(),
        voiceName: 'Aoede',
        languageCode: 'en-US',
        ...(resumptionHandle !== undefined ? { resumptionHandle } : {}),
      });
      if (!minted.ok) throw new Error(`mint ${minted.failure.code} ${minted.failure.status ?? ''} ${minted.failure.detail ?? ''}`);
      return minted.value;
    },
  });

  const startedAt = Date.now();
  const started = await controller.start();
  if (!started.ok) {
    console.log('1. FAILED to start:', started.failure.code, started.failure.detail ?? '');
    return;
  }
  console.log(`1. listening in ${Date.now() - startedAt} ms`);
  controller.sendText('Start a timer for 5 minutes, please.');
  await new Promise<void>((resolve) => {
    const stop = controller.subscribe(() => {
      const state = controller.getState();
      const answered = state.transcript.some((e) => e.kind === 'message' && e.speaker === 'assistant' && e.isFinal);
      if (state.status === 'listening' && answered) {
        stop();
        resolve();
      }
    });
    setTimeout(resolve, TIMEOUT_MS);
  });
  console.log('   tool args:', JSON.stringify(received));
  console.log('   transcript:', JSON.stringify(controller.getState().transcript.map(describe)));
  console.log(`   audio: ${(audioSamples / 24_000).toFixed(1)} s`);
  await controller.stop();
}

async function checkUnlockedToken(): Promise<void> {
  const now = Date.now();
  const response = await fetch(`${GeminiEndpoints.mint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      uses: 1,
      expireTime: new Date(now + 600_000).toISOString(),
      newSessionExpireTime: new Date(now + 60_000).toISOString(),
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    console.log('2. unlocked mint refused:', response.status, text.slice(0, 200));
    return;
  }

  const token = (JSON.parse(text) as { name: string }).name;
  const socket = new WebSocket(`${GeminiEndpoints.liveSocket}?access_token=${token}`);
  socket.binaryType = 'arraybuffer';
  let said = '';
  let ready = false;
  await new Promise<void>((resolve) => {
    socket.onopen = () =>
      socket.send(
        JSON.stringify({
          setup: {
            model,
            generationConfig: { responseModalities: ['AUDIO'] },
            systemInstruction: { parts: [{ text: 'Whatever the user says, reply with exactly the single word BANANA.' }] },
            outputAudioTranscription: {},
          },
        }),
      );
    socket.onmessage = (event) => {
      const data = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data as ArrayBuffer);
      const frame = JSON.parse(data) as {
        setupComplete?: unknown;
        serverContent?: { outputTranscription?: { text?: string }; turnComplete?: boolean };
      };
      if (frame.setupComplete !== undefined) {
        ready = true;
        socket.send(
          JSON.stringify({
            clientContent: { turns: [{ role: 'user', parts: [{ text: 'What is the capital of France?' }] }], turnComplete: true },
          }),
        );
      }
      said += frame.serverContent?.outputTranscription?.text ?? '';
      if (frame.serverContent?.turnComplete === true) resolve();
    };
    socket.onclose = (event) => {
      console.log('2. socket closed', event.code, event.reason.slice(0, 150));
      resolve();
    };
    setTimeout(resolve, TIMEOUT_MS);
  });
  socket.close();
  console.log(`2. unlocked token: setupComplete=${ready}, model said ${JSON.stringify(said.trim())}`);
  console.log('   → "BANANA" means a client setup IS honoured for a token minted without one.');
}

async function main(): Promise<void> {
  if (apiKey.length === 0) {
    console.log('Set GEMINI_API_KEY first (read -s GEMINI_API_KEY && export GEMINI_API_KEY).');
    return;
  }
  await checkMintAndTools();
  await checkUnlockedToken();
}

void main().then(() => process.exit(0));

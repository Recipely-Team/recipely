# @live-assistant/token-server

Mints single-use Gemini Live tokens with your system instruction, tools, voice and language baked in, so your API key stays on your server.

```ts
const minted = await mintGeminiLiveToken({ apiKey, model, systemInstruction, tools, voiceName: 'Aoede', languageCode: 'en-US' });
if (minted.ok) res.json(minted.value); // { token, model, wsUrl, expiresAt }
```

It never throws. Failures are `unreachable`, `rejected` or `malformed`, and Google's message is in `detail` for your logs. To run a live end-to-end check with your key, use `scripts/live-check.ts`.

See the [overview](../README.md#quick-start-with-the-widget).

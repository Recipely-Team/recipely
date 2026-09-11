# @live-assistant/gemini

The Gemini Live implementation of `AssistantSession`: one WebSocket, its setup handshake, and the frames in both directions (binary JSON frames, 16 kHz in and 24 kHz out, generic tool calls and cancellations).

```ts
const session = new GeminiLiveSession();
await session.connect({ token, model }); // wsUrl defaults to the constrained endpoint
```

Tokens come from `@live-assistant/token-server`. Gemini fixes the session's configuration when the token is minted.

See the [overview](../README.md).

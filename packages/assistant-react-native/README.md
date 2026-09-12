# @live-assistant/react-native

One install for a voice assistant in a React Native or Expo app.

```sh
npm install @live-assistant/react-native
```

It re-exports, unchanged:

| Package | What it brings |
| --- | --- |
| `@live-assistant/core` | the controller, the session port, the transcript, tools, levels |
| `@live-assistant/gemini` | the Gemini Live connection |
| `@live-assistant/audio` | microphone capture and streaming playback |
| `@live-assistant/react` | the provider and the hooks |
| `@live-assistant/widget` | the orb, the panel and the controls |

```ts
import { AssistantController, GeminiLiveSession, AssistantWidget } from '@live-assistant/react-native';
```

Everything is also installable on its own. Reach for the pieces when you want
less than all of it: a custom UI needs `core` and `react` and not the widget;
a headless integration needs neither the widget nor React.

## It does not include the token server

`@live-assistant/token-server` mints short-lived tokens with your API key, so
it belongs on a server and never inside an app bundle. Install it where it
runs:

```sh
npm install @live-assistant/token-server
```

## Peer dependencies

`react`, `react-native`, and `react-native-audio-api` — the last one is a
native module, so adding it means a rebuild of your app.

Bundled by Metro. Node cannot load this package directly (it reaches React
Native), which is the same reason the token server is separate.

## Licence

MIT

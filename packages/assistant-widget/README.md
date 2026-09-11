# @live-assistant/widget

A drop-in voice assistant UI: an orb that moves with both voices, a transcript, controls and a composer. It is built only on `@live-assistant/react`'s public hooks.

```tsx
<AssistantWidget theme={{ colors: { primary: '#E4572E' } }} strings={{ stop: 'Bitir' }} renderMessage={(entry, fallback) => fallback} />
```

Every colour comes from `theme` and every word from `strings`. Each transcript row goes through `renderMessage` and `renderTool`. Needs React Native ≥ 0.76 (or React Native Web).

See the [overview](../README.md#customising-the-widget).

# @live-assistant/react

Headless React bindings: `AssistantProvider`, `useAssistant()`, `useAssistantState(selector)`, `useTranscript()`, `useLevelFrames(onFrame)`, `useAssistantLevels()` and `useAssistantTool(tool)`.

Levels never go through React state. `useLevelFrames` calls you on every animation frame with `{ input, output }`, so you can write them straight into an animated value.

See the [overview](../README.md#headless-your-own-ui).

# @live-assistant/core

The provider-neutral heart of Live Assistant. It depends on nothing.

- **`AssistantController`** runs a whole voice session headlessly: start order, mute, echo gate, interruptions, transcript, serialised tool calls, `goAway` resumption and a silence timeout. Read state with `getState()`/`subscribe()`, and levels with `inputLevel`/`outputLevel`.
- **`ToolRegistry` / `AssistantTool` / `ToolDefinition`** hold the functions the model may call. Every call is answered.
- **`AssistantSession`**, **`AssistantMicrophone`** and **`AssistantPlayer`** are the ports that providers and audio back-ends implement.
- **`LevelTimeline`**, **`toDisplayLevel`** and **`smoothLevel`** turn audio into levels you can draw.
- **`Result`** and **`AssistantFailureCode`**: nothing throws across the boundary.

See the [overview](../README.md) for a quick start.

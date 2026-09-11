# @live-assistant/audio

`Microphone` and `PcmPlayer` for iOS, Android (`react-native-audio-api`, a peer dependency) and the web (Web Audio). The platform is picked through file extensions.

- Frames are resampled to the rate the session asks for, not the rate the recorder claims to deliver.
- `level()` on both classes feeds animations. The player's level follows the playhead, and `remainingSeconds()` says how much audio has not been heard yet.
- On iOS the session runs in `voiceChat` mode, so the app's own output is cancelled. Android has no echo cancellation here (`cancelsEcho` is false), so the controller holds the microphone shut while the assistant is audible.

See the [overview](../README.md).

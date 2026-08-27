# Android: why the assistant cannot be interrupted, and the one line that fixes it

The voice assistant lets you talk over it on iOS and on the web, and not on
Android. This is why, what the fix is, and where it has to land.

## The rule every voice assistant follows

A phone's loudspeaker feeds straight back into its microphone. If the session
keeps listening while it speaks, the model hears its own sentence, treats it as
the user's next instruction, and answers it — out loud, on repeat.

There are only two cures:

1. **Stop listening while speaking.** Reliable, and the user cannot interrupt.
2. **Cancel the echo**, so the microphone hears the room and not the speaker.

Everyone ships (2), and nobody writes the canceller themselves: every OS has one
in silicon, and it is engaged by *how the input is opened*, not by an API you
call afterwards.

| Platform | What engages it | Ours |
|---|---|---|
| iOS | `AVAudioSession` `.playAndRecord` + `.voiceChat` — Voice-Processing I/O | ✅ set in `microphone.ts` |
| Web | `getUserMedia({ audio: { echoCancellation: true } })` | ✅ set in `microphone.web.ts` |
| Android | input opened with `VOICE_COMMUNICATION` | ❌ see below |

## Where Android loses it

`react-native-audio-api` records through Oboe. Its builder
(`android/src/main/cpp/audioapi/android/core/AndroidAudioRecorder.cpp`) never
calls `setInputPreset`, so the stream inherits Oboe's default:

```cpp
// oboe/AudioStreamBase.h
InputPreset mInputPreset = InputPreset::VoiceRecognition;
```

`VoiceRecognition` deliberately leaves the echo canceller, the noise suppressor
and automatic gain control **off** — correct for dictation, wrong for a two-way
call. Oboe's own header says of the preset we want: *"Use this preset when doing
telephony or voice messaging."*

The library's `SessionOptions` cannot reach it either: every field on it is
`ios*`.

## The fix

```diff
   oboe::AudioStreamBuilder builder;
   builder.setSharingMode(oboe::SharingMode::Exclusive)
       ->setDirection(oboe::Direction::Input)
+      ->setInputPreset(oboe::InputPreset::VoiceCommunication)
       ->setFormat(oboe::AudioFormat::Float)
```

`oboe::InputPreset::VoiceCommunication` is `7`
(`AAUDIO_INPUT_PRESET_VOICE_COMMUNICATION`), present in the Oboe 1.9.3 this
build already links.

## Where it should land

Upstream, in `software-mansion/react-native-audio-api` (MIT). Hard-coding the
preset would be wrong — it changes capture for every consumer, and a dictation
app wants the current default — so the contribution is to make it **selectable**,
defaulting to today's behaviour: an `inputPreset` on `AudioRecorderStartOptions`,
threaded to the builder, with the iOS side ignoring it.

Until then it can be carried locally with `patch-package`. That is a **native
change**: it needs a fresh Android build and a device to verify, and per
`CLAUDE.md` it is one of the changes that stops and asks first.

## How to tell it worked

Play the assistant's answer through the **loudspeaker**, not headphones, and
talk over it. Working: it stops and listens. Not working: it answers itself.
Headphones hide the whole problem, so they prove nothing.

Once Android cancels its own echo, `Microphone.cancelsEcho` on that platform
becomes `true` and the half-duplex gate in `assistant-session-store.ts` stops
applying by itself — there is no second change to make.

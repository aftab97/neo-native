# Voice Dictation

## Overview

Voice-to-text functionality allowing users to dictate messages instead of typing. Uses `@react-native-voice/voice` for speech recognition with optional `expo-av` for real audio level visualization.

## Files

| File | Purpose |
|------|---------|
| `src/hooks/useDictation.ts` | Core hook managing speech recognition and audio levels |
| `src/ui/components/chat/DictateBar.tsx` | Audio visualization UI with cancel/complete buttons |
| `src/ui/components/chat/ChatInput.tsx` | Integrates microphone button and DictateBar |
| `src/ui/foundation/icons/CommonIcons.tsx` | MicrophoneIcon component |

## Components

### useDictation Hook

```typescript
interface UseDictationReturn {
  isDictateActive: boolean;   // Whether dictation UI is shown
  isRecording: boolean;       // Whether actively recording
  dictateText: string;        // Transcribed text from speech
  audioLevels: number[];      // Array of bar heights (4-16px)
  startDictate: () => Promise<void>;
  cancelDictate: () => void;
  completeDictate: () => void;
  setIsDictateActive: (active: boolean) => void;
}
```

### DictateBar

Single-row component displaying:
- **Waveform**: 48 animated bars showing audio input levels
- **Cancel button (X)**: Discards recording, returns to normal input
- **Complete button (checkmark)**: Accepts transcribed text, fills ChatInput

### MicrophoneIcon

Positioned next to send button in ChatInput (matches web app placement).

## User Flow

```
Tap microphone → Permission check → DictateBar shown
    ↓
Speak → Real-time transcription + audio visualization
    ↓
Tap Complete → Text fills ChatInput → Normal mode
  or
Tap Cancel → Recording discarded → Normal mode
```

## Audio Visualization

| Property | Value |
|----------|-------|
| Number of bars | 48 |
| Update interval | 80ms |
| Bar width | 3px |
| Bar gap | 2px |
| Height range | 4-16px |
| Border radius | 2px |

**Colors:**

| Element | Light | Dark |
|---------|-------|------|
| Inactive bars | gray-300 | gray-600 |
| Active bars | gray-500 | gray-300 |
| Icon default | gray-400 | gray-500 |
| Icon pressed | gray-500 | gray-400 |
| Button bg (pressed) | blue-100 | gray-800 |

## Installation

**Required for speech recognition:**
```bash
npm install @react-native-voice/voice
```

**Optional for real audio levels (falls back to simulated):**
```bash
npx expo install expo-av
```

## iOS Permissions

Add to `app.json` under `ios.infoPlist`:
```json
{
  "NSMicrophoneUsageDescription": "Neo needs access to your microphone for voice dictation.",
  "NSSpeechRecognitionUsageDescription": "Neo needs access to speech recognition to convert your voice to text."
}
```

## Edge Cases

1. **Speech recognition unavailable**
   - Shows alert: "Speech Recognition Unavailable"
   - Does not enter dictation mode

2. **Microphone permission denied**
   - Falls back to simulated audio levels
   - Speech recognition still attempts to work

3. **expo-av not installed**
   - Automatically falls back to simulated audio levels (random bar heights)
   - Feature still works, just without real audio visualization

4. **No speech detected**
   - Errors silently ignored (no popup)
   - User can cancel or complete with empty text

5. **Empty transcription on complete**
   - Completes without changing input value
   - Returns to normal input mode

6. **Files attached when starting dictation**
   - AttachmentPreview hidden during dictation
   - Files preserved when dictation completes

7. **Keyboard visible when starting**
   - Keyboard automatically dismissed
   - DictateBar replaces input area

8. **Component unmount during recording**
   - Cleanup effect stops Voice, clears intervals, unloads recording

9. **Audio mode (iOS)**
   - Sets `allowsRecordingIOS: true` during recording
   - Resets to `false` when stopped
   - `playsInSilentModeIOS: true` for silent mode support

10. **Live chat mode**
    - Works normally, transcribed text sent via live chat

## Integration with ChatInput

```typescript
// ChatInput.tsx
const {
  isDictateActive,
  audioLevels,
  startDictate,
  cancelDictate,
  completeDictate,
} = useDictation({
  setInputValue: (value) => setLocalValue(value),
});

// Conditional rendering
{isDictateActive ? (
  <DictateBar
    audioLevels={audioLevels}
    onCancel={cancelDictate}
    onComplete={completeDictate}
  />
) : (
  <TextInput ... />
  <MicrophoneIcon />
  <SendButton />
)}
```

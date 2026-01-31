import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

// Try to import expo-av, but make it optional
let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch {
  // expo-av not installed, will use simulated levels
}

interface UseDictationArgs {
  setInputValue: (value: string) => void;
}

interface UseDictationReturn {
  // State
  isDictateActive: boolean;
  isRecording: boolean;
  dictateText: string;
  audioLevels: number[];
  // Actions
  startDictate: () => Promise<void>;
  cancelDictate: () => void;
  completeDictate: () => void;
  setIsDictateActive: (active: boolean) => void;
}

const NUM_BARS = 48;
const AUDIO_UPDATE_INTERVAL = 80;

/**
 * useDictation - Voice dictation hook for React Native
 *
 * Uses @react-native-voice/voice for speech recognition.
 * Optionally uses expo-av for real audio level metering (if installed).
 */
export const useDictation = ({ setInputValue }: UseDictationArgs): UseDictationReturn => {
  const [isDictateActive, setIsDictateActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [dictateText, setDictateText] = useState('');
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(NUM_BARS).fill(8));

  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<any>(null);
  const dictateTextRef = useRef<string>('');
  const useRealAudioLevels = useRef<boolean>(false);

  // Keep ref in sync with state for use in completeDictate
  useEffect(() => {
    dictateTextRef.current = dictateText;
  }, [dictateText]);

  // Setup Voice event listeners
  useEffect(() => {
    const onSpeechResults = (e: SpeechResultsEvent) => {
      const text = e.value?.[0] || '';
      setDictateText(text);
    };

    const onSpeechError = (e: SpeechErrorEvent) => {
      // Silently ignore all speech errors - don't show alerts
      // Common errors: no speech detected, audio session issues, etc.
    };

    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
    };
  }, []);

  // Start simulated audio levels (fallback when expo-av not available)
  const startSimulatedAudioLevels = useCallback(() => {
    audioLevelIntervalRef.current = setInterval(() => {
      setAudioLevels((prev) => {
        const next = [...prev];
        next.shift();
        // Generate random bar height between 4 and 14 for visual effect
        const newHeight = 4 + Math.random() * 10;
        next.push(newHeight);
        return next;
      });
    }, AUDIO_UPDATE_INTERVAL);
  }, []);

  // Real audio level monitoring using expo-av (if available)
  const startAudioLevelMonitoring = useCallback(async () => {
    if (!Audio) {
      // expo-av not available, use simulated levels
      useRealAudioLevels.current = false;
      startSimulatedAudioLevels();
      return;
    }

    try {
      // Request permission first
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        // Permission denied, use simulated levels
        useRealAudioLevels.current = false;
        startSimulatedAudioLevels();
        return;
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Create and start recording for metering
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });
      await recording.startAsync();
      recordingRef.current = recording;
      useRealAudioLevels.current = true;

      // Poll audio levels
      audioLevelIntervalRef.current = setInterval(async () => {
        try {
          if (recordingRef.current) {
            const status = await recordingRef.current.getStatusAsync();
            if (status.isRecording && status.metering !== undefined) {
              // Convert dB metering to a visual bar height (4-16px range)
              const normalizedLevel = Math.max(0, (status.metering + 50) / 50);
              const barHeight = 4 + normalizedLevel * 12;

              setAudioLevels((prev) => {
                const next = [...prev];
                next.shift();
                next.push(barHeight);
                return next;
              });
            }
          }
        } catch {
          // Recording may have stopped
        }
      }, AUDIO_UPDATE_INTERVAL);
    } catch (error) {
      // Fall back to simulated levels on any error
      useRealAudioLevels.current = false;
      startSimulatedAudioLevels();
    }
  }, [startSimulatedAudioLevels]);

  const stopAudioLevelMonitoring = useCallback(async () => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }

    if (recordingRef.current && useRealAudioLevels.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // Ignore stop errors
      }
      recordingRef.current = null;
    }

    // Reset audio mode if expo-av was used
    if (Audio && useRealAudioLevels.current) {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      } catch {
        // Ignore audio mode errors
      }
    }
  }, []);

  const startDictate = useCallback(async () => {
    try {
      // Check if speech recognition is available
      const isAvailable = await Voice.isAvailable();
      if (!isAvailable) {
        Alert.alert(
          'Speech Recognition Unavailable',
          'Speech recognition is not available on this device.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsDictateActive(true);
      setIsRecording(true);
      setDictateText('');

      // Start audio level monitoring for visualization
      await startAudioLevelMonitoring();

      // Start speech recognition
      await Voice.start('en-US');

    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsDictateActive(false);
      setIsRecording(false);
      await stopAudioLevelMonitoring();
    }
  }, [startAudioLevelMonitoring, stopAudioLevelMonitoring]);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    await stopAudioLevelMonitoring();

    try {
      await Voice.stop();
    } catch {
      // Ignore stop errors
    }
  }, [stopAudioLevelMonitoring]);

  const cancelDictate = useCallback(async () => {
    await stopRecording();
    try {
      await Voice.cancel();
    } catch {
      // Ignore cancel errors
    }
    setDictateText('');
    setIsDictateActive(false);
    setAudioLevels(Array(NUM_BARS).fill(8));
  }, [stopRecording]);

  const completeDictate = useCallback(async () => {
    await stopRecording();

    // Use ref to get the latest text value
    const finalText = dictateTextRef.current.trim();
    if (finalText) {
      setInputValue(finalText);
    }

    setDictateText('');
    setIsDictateActive(false);
    setAudioLevels(Array(NUM_BARS).fill(8));
  }, [stopRecording, setInputValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync?.().catch(() => {});
      }
      Voice.destroy().catch(() => {});
    };
  }, []);

  return {
    // State
    isDictateActive,
    isRecording,
    dictateText,
    audioLevels,
    // Actions
    startDictate,
    cancelDictate,
    completeDictate,
    setIsDictateActive,
  };
};

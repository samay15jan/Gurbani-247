import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STREAM_URL = 'https://gurbanikirtan.radioca.st/start.mp3';
const SONG_URL = 'https://gurbanikirtan.radioca.st/currentsong?sid=1';
const BAR_COUNT = 14;

function Visualizer({ isPlaying }: { isPlaying: boolean }) {
  const bars = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.2)),
    [],
  );

  useEffect(() => {
    const animations = bars.map((bar, idx) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: isPlaying ? Math.random() * 0.9 + 0.2 : 0.2,
            duration: 280 + idx * 18,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: isPlaying ? Math.random() * 0.9 + 0.2 : 0.2,
            duration: 280 + idx * 20,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      ),
    );

    if (isPlaying) {
      animations.forEach((animation) => animation.start());
    } else {
      bars.forEach((bar) => bar.setValue(0.2));
    }

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [bars, isPlaying]);

  return (
    <View className="mt-8 h-16 w-full flex-row items-end justify-between px-6">
      {bars.map((bar, idx) => (
        <Animated.View
          key={idx}
          style={{
            height: bar.interpolate({
              inputRange: [0, 1.2],
              outputRange: [10, 64],
            }),
          }}
          className="w-1.5 rounded-full bg-cyan-400"
        />
      ))}
    </View>
  );
}

export default function App() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [songName, setSongName] = useState('Loading current shabad...');

  const fetchSong = useCallback(async () => {
    try {
      const response = await fetch(SONG_URL);
      const text = (await response.text()).trim();
      setSongName(text || 'Live Gurbani Kirtan');
    } catch {
      setSongName('Live Gurbani Kirtan');
    }
  }, []);

  useEffect(() => {
    fetchSong();
    const timer = setInterval(fetchSong, 15000);
    return () => clearInterval(timer);
  }, [fetchSong]);

  useEffect(() => {
    const prepareAudio = async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeAndroid: 1,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    };

    prepareAudio();

    return () => {
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, []);

  const togglePlayback = useCallback(async () => {
    setIsLoading(true);

    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: STREAM_URL },
          { shouldPlay: true, isLooping: false },
        );
        soundRef.current = sound;
        setIsPlaying(true);
      } else if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying]);

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full rounded-3xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl shadow-cyan-500/30">
          <Text className="text-center text-3xl font-bold tracking-wide text-cyan-300">
            Gurbani 24/7
          </Text>
          <Text className="mt-4 text-center text-sm text-slate-300">
            {songName}
          </Text>

          <Visualizer isPlaying={isPlaying} />

          <Pressable
            onPress={togglePlayback}
            className="mt-8 items-center rounded-2xl bg-cyan-500 px-6 py-4"
          >
            {isLoading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text className="text-xl font-bold text-slate-900">
                {isPlaying ? 'Pause' : 'Play'}
              </Text>
            )}
          </Pressable>

          <Text className="mt-4 text-center text-xs text-slate-400">
            Background playback is enabled for Android builds.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

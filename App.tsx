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
const BAR_COUNT = 20;

function Visualizer({ isPlaying }: { isPlaying: boolean }) {
  const bars = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15)),
    [],
  );

  useEffect(() => {
    const animations = bars.map((bar, idx) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: isPlaying ? Math.random() * 0.9 + 0.2 : 0.15,
            duration: 260 + idx * 14,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: isPlaying ? Math.random() * 0.9 + 0.2 : 0.15,
            duration: 300 + idx * 14,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      ),
    );

    if (isPlaying) {
      animations.forEach((animation) => animation.start());
    } else {
      bars.forEach((bar) => bar.setValue(0.15));
    }

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [bars, isPlaying]);

  return (
    <View className="mt-8 h-20 w-full flex-row items-end justify-between px-1">
      {bars.map((bar, idx) => (
        <Animated.View
          key={idx}
          style={{
            height: bar.interpolate({
              inputRange: [0, 1.2],
              outputRange: [8, 76],
            }),
            opacity: bar.interpolate({
              inputRange: [0, 1.2],
              outputRange: [0.25, 1],
            }),
          }}
          className="w-1.5 rounded-full bg-cyan-300"
        />
      ))}
    </View>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2">
      <Text className="text-[10px] uppercase tracking-widest text-slate-400">{label}</Text>
      <Text className="mt-1 text-sm font-semibold text-slate-100">{value}</Text>
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

      <View className="absolute -left-16 top-24 h-56 w-56 rounded-full bg-cyan-500/10" />
      <View className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-indigo-500/10" />

      <View className="flex-1 items-center justify-center px-5">
        <View className="w-full rounded-[32px] border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl shadow-cyan-500/20">
          <Text className="text-center text-xs uppercase tracking-[0.3em] text-cyan-300">
            Live Radio
          </Text>

          <Text className="mt-3 text-center text-4xl font-black tracking-tight text-white">
            Gurbani 24/7
          </Text>

          <Text className="mt-4 text-center text-sm leading-5 text-slate-300" numberOfLines={2}>
            {songName}
          </Text>

          <Visualizer isPlaying={isPlaying} />

          <Pressable
            onPress={togglePlayback}
            className="mt-8 items-center rounded-2xl border border-cyan-300/40 bg-cyan-400 px-6 py-4"
          >
            {isLoading ? (
              <ActivityIndicator color="#082f49" />
            ) : (
              <Text className="text-xl font-extrabold text-cyan-950">
                {isPlaying ? '❚❚ Pause' : '▶ Play'}
              </Text>
            )}
          </Pressable>

          <View className="mt-6 flex-row items-center justify-between gap-2">
            <DetailPill label="Status" value={isPlaying ? 'Playing' : 'Paused'} />
            <DetailPill label="Quality" value="HD Stream" />
            <DetailPill label="Mode" value="Dark" />
          </View>

          <Text className="mt-5 text-center text-xs text-slate-500">
            Always-on playback for peaceful listening.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

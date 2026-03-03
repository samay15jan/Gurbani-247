import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
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
import './global.css';

const STREAM_URL = 'https://gurbanikirtan.radioca.st/start.mp3';
const SONG_URL = 'https://gurbanikirtan.radioca.st/currentsong?sid=1';
const BAR_COUNT = 24;

function Visualizer({ isPlaying }: { isPlaying: boolean }) {
  const bars = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.16)),
    [],
  );

  useEffect(() => {
    const animations = bars.map((bar, idx) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: isPlaying ? Math.random() * 0.95 + 0.15 : 0.16,
            duration: 190 + idx * 12,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: isPlaying ? Math.random() * 0.95 + 0.15 : 0.16,
            duration: 230 + idx * 12,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      ),
    );

    if (isPlaying) {
      animations.forEach((animation) => animation.start());
    } else {
      bars.forEach((bar) => bar.setValue(0.16));
    }

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [bars, isPlaying]);

  return (
    <View className="mt-8 h-24 w-full flex-row items-end justify-between rounded-2xl border border-slate-700/70 bg-slate-950/70 px-2 py-3">
      {bars.map((bar, idx) => (
        <Animated.View
          key={idx}
          style={{
            height: bar.interpolate({
              inputRange: [0, 1.2],
              outputRange: [8, 86],
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
    <View className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2">
      <Text className="text-[10px] uppercase tracking-widest text-slate-400">{label}</Text>
      <Text className="mt-1 text-sm font-semibold text-slate-100">{value}</Text>
    </View>
  );
}

export default function App() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [songName, setSongName] = useState('Loading current shabad...');

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 13000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotateAnim]);

  const rotatingStyle = {
    transform: [
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

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
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        playsInSilentModeIOS: true,
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

      <Animated.View
        style={rotatingStyle}
        className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-500/15"
      />
      <Animated.View
        style={rotatingStyle}
        className="absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-indigo-500/20"
      />

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
            <DetailPill label="Android" value="Background OK" />
          </View>

          <Text className="mt-5 text-center text-xs text-slate-500">
            Playback stays active in background. For full Android lock-screen media controls,
            integrate a media-session library (Track Player) in a custom development build.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

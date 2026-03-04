import "./global.css"
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { Image } from "react-native";

const artwork = Image.resolveAssetSource(
  require("./assets/cover.png")
).uri;
const STREAM_URL = 'https://gurbanikirtan.radioca.st/start.mp3';
const SONG_URL = 'https://gurbanikirtan.radioca.st/currentsong?sid=1';
const LATEST_RELEASE_FALLBACK = 'https://github.com/samay15jan/Gurbani-247/releases/latest';
const BAR_COUNT = 24;

/* ---------------- VISUALIZER (UNCHANGED) ---------------- */

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
              inputRange: [0, 1],
              outputRange: [8, 74],
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

/* ---------------- DETAIL PILL ---------------- */

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center justify-center text-center rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2">
      <Text className="text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </Text>
      <Text className="mt-1 text-sm font-semibold text-slate-100">
        {value}
      </Text>
    </View>
  );
}

/* ---------------- MAIN APP ---------------- */

export default function App() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const webAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [songName, setSongName] = useState('Loading...');
  const [artist, setArtist] = useState('');

  const [battery, setBattery] = useState("—");
  const [network, setNetwork] = useState("—");
  const [time, setTime] = useState("");
  const [apkUrl, setApkUrl] = useState(LATEST_RELEASE_FALLBACK);
  const [apkLabel, setApkLabel] = useState('Download latest Android APK');

  /* ---------------- FULLSCREEN ---------------- */

  const statusBarHidden = true;
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("inset-swipe");
      NavigationBar.setBackgroundColorAsync("#000000");
    }
  }, []);

  /* ---------------- ROTATION ---------------- */

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

  /* ---------------- CLOCK ---------------- */

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();

      const formatted = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      setTime(formatted);
    }, 1000);

    return () => clearInterval(t);
  }, []);
  
  /* ---------------- BATTERY ---------------- */

  useEffect(() => {
    if (Platform.OS === 'web') {
      setBattery('Web');
      return;
    }

    Battery.getBatteryLevelAsync().then(level => {
      setBattery(`${Math.round(level * 100)}%`);
    }).catch(() => {
      setBattery('Unknown');
    });
  }, []);

  /* ---------------- NETWORK ---------------- */

  useEffect(() => {
    Network.getNetworkStateAsync().then(state => {
      setNetwork(state.type ?? "Unknown");
    }).catch(() => {
      setNetwork('Unknown');
    });
  }, []);

  /* ---------------- TRACK PLAYER SETUP ---------------- */

  useEffect(() => {
    if (Platform.OS === 'web') {
      webAudioRef.current = new Audio(STREAM_URL);
      webAudioRef.current.preload = 'none';
      return;
    }

    const setup = async () => {
      const TrackPlayer = (await import('react-native-track-player')).default;
      const { Capability } = await import('react-native-track-player');

      await TrackPlayer.setupPlayer();

      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
        ],
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
        ],
      });

      await TrackPlayer.add({
        id: "live",
        url: STREAM_URL,
        title: "Live Gurbani Kirtan",
        artist: "Gurbani 24/7",
        artwork: artwork,
        isLiveStream: true,
      });
    };

    setup().catch(() => {
      setIsPlaying(false);
    });
  }, []);

  /* ---------------- APK LINK ---------------- */

  useEffect(() => {
    const loadLatestApk = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/samay15jan/Gurbani-247/releases/latest');
        const data = await response.json();

        if (Array.isArray(data.assets)) {
          const apkAsset = data.assets.find((asset: { name: string }) => asset.name.toLowerCase().endsWith('.apk'));

          if (apkAsset?.browser_download_url) {
            setApkUrl(apkAsset.browser_download_url);
            setApkLabel(`Download ${apkAsset.name}`);
          }
        }
      } catch {
        setApkUrl(LATEST_RELEASE_FALLBACK);
      }
    };

    loadLatestApk();
  }, []);

  /* ---------------- FETCH SONG ---------------- */

  const fetchSong = useCallback(async () => {
    try {
      const response = await fetch(SONG_URL);
      const text = (await response.text()).trim();

      if (text.includes(" - ")) {
        const [a, s] = text.split(" - ");
        setArtist(a);
        setSongName(s);

        if (Platform.OS !== 'web') {
          const TrackPlayer = (await import('react-native-track-player')).default;

          await TrackPlayer.updateMetadataForTrack(0, {
            title: s,
            artist: a,
          });
        }
      }
    } catch { }
  }, []);

  useEffect(() => {
    fetchSong();
    const timer = setInterval(fetchSong, 15000);
    return () => clearInterval(timer);
  }, [fetchSong]);

  /* ---------------- PLAYBACK ---------------- */

  const togglePlayback = async () => {
    setIsLoading(true);

    if (Platform.OS === 'web') {
      const audio = webAudioRef.current;

      if (!audio) {
        setIsLoading(false);
        return;
      }

      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
    } else {
      const TrackPlayer = (await import('react-native-track-player')).default;
      const { State } = await import('react-native-track-player');
      const state = await TrackPlayer.getState();

      if (state === State.Playing) {
        await TrackPlayer.pause();
        setIsPlaying(false);
      } else {
        await TrackPlayer.play();
        setIsPlaying(true);
      }
    }

    setIsLoading(false);
  };

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar hidden={statusBarHidden} />

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

          <Text className="text-center text-xs text-slate-400">
            {artist}
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
            <DetailPill label="Network" value={network} />
            <DetailPill label="Time" value={time} />
            <DetailPill label="Battery" value={battery} />
          </View>

          <Pressable
            onPress={() => Linking.openURL(apkUrl)}
            className="mt-4 items-center rounded-xl border border-emerald-300/40 bg-emerald-400 px-4 py-3"
          >
            <Text className="text-sm font-bold text-emerald-950">
              {apkLabel}
            </Text>
          </Pressable>

          <Text
            onPress={() => Linking.openURL("http://www.gurbanikirtan247.com/")}
            className="mt-5 text-center text-xs text-slate-500"
          >
            Sources: gurbanikirtan247.com
          </Text>

          <Text
            onPress={() => Linking.openURL("https://github.com/samay15jan")}
            className="mt-1 text-center text-xs text-slate-600"
          >
            Created by samay15jan
          </Text>

        </View>
      </View>
    </SafeAreaView>
  );
}

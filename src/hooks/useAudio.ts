import { useEffect, useState, useRef } from "react";

const audioCache: { [key: string]: HTMLAudioElement } = {};

interface AudioOptions {
  volume?: number;
  src: string;
}

function useAudio({ volume = 1.0, src = "" }: AudioOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioUrl = encodeURIComponent(src);
    const proxyUrl = `/api/audio-proxy?url=${audioUrl}`;

    if (src && !audioCache[src]) {
      console.log("TEST");
      const audio = new Audio();
      audio.volume = volume;
      audio.preload = "auto";
      audio.src = proxyUrl;
      audioCache[src] = audio;
    }

    if (src) {
      audioRef.current = audioCache[src];
      audioRef.current.volume = volume;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [src, volume]);

  const play = () => {
    if (audioRef.current) {
      if (audioRef.current.currentTime > 0) {
        audioRef.current.currentTime = 0;
      }

      audioRef.current.play().then(() => {
        setIsPlaying(true);
      });
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const setVolume = (newVolume: number) => {
    if (newVolume >= 0 && newVolume <= 1) {
      if (audioRef.current) {
        audioRef.current.volume = newVolume;
      }
    } else {
      console.error("Volume must be between 0 and 1.");
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const enableLooping = (loop: boolean) => {
    if (audioRef.current) {
      audioRef.current.loop = loop;
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return {
    play,
    pause,
    togglePlayPause,
    setVolume,
    seek,
    enableLooping,
    stop,
    isPlaying,
  };
}

export default useAudio;

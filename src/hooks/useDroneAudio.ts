import { useState, useRef, useEffect, useCallback } from 'react';

export function useDroneAudio(initialVolume = 0.4) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopDrone = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (osc1Ref.current) {
      try { osc1Ref.current.stop(); } catch {}
      osc1Ref.current = null;
    }
    if (osc2Ref.current) {
      try { osc2Ref.current.stop(); } catch {}
      osc2Ref.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startDrone = useCallback(() => {
    if (audioCtxRef.current) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.value = volume * 0.05; // Hard attenuation factor to prevent overwhelming bass
      gainNodeRef.current = gain;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 180;
      filter.Q.value = 1.0;
      filterRef.current = filter;

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = 65;
      osc1Ref.current = osc1;

      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.value = 65.5;
      osc2Ref.current = osc2;

      // Binaural Panning Nodes
      const panLeft = ctx.createStereoPanner();
      panLeft.pan.value = -1; // Hard Left

      const panRight = ctx.createStereoPanner();
      panRight.pan.value = 1; // Hard Right

      osc1.connect(panLeft);
      panLeft.connect(filter);
      
      osc2.connect(panRight);
      panRight.connect(filter);

      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      intervalRef.current = setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
        const time = Date.now() / 10000;
        const drift = 120 + Math.sin(time) * 40;
        if (filter) {
          try {
            filter.frequency.setValueAtTime(drift, ctx.currentTime);
          } catch (e) {}
        }
      }, 100);

      // Must be called in click handler to bypass autoplay restrictions
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      setIsPlaying(true);
    } catch (e) {
      console.error("Web Audio API failed to initialize:", e);
    }
  }, [volume]);

  const toggleDrone = useCallback(() => {
    if (isPlaying) {
      stopDrone();
    } else {
      startDrone();
    }
  }, [isPlaying, startDrone, stopDrone]);

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(volume * 0.05, audioCtxRef.current.currentTime);
      } catch (e) {}
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopDrone();
    };
  }, [stopDrone]);

  return {
    isPlaying,
    volume,
    setVolume,
    startDrone,
    stopDrone,
    toggleDrone
  };
}

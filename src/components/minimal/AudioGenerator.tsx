/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Sparkles, Sliders } from 'lucide-react';

interface AudioGeneratorProps {
  theme: string;
  soundType: 'drone' | 'silence';
}

export default function AudioGenerator({ theme, soundType }: AudioGeneratorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const startDrone = () => {
    if (audioCtxRef.current) return;

    try {
      // Create context
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      // Master Gain for volume
      const gain = ctx.createGain();
      gain.gain.value = volume;
      gainNodeRef.current = gain;

      // Biquad filter (ambient low-pass)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 180; // deep muffled sound
      filter.Q.value = 1.0;
      filterRef.current = filter;

      // Deep frequency oscillator 1 (65Hz - C2 note range)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = 65;
      osc1Ref.current = osc1;

      // Deep frequency oscillator 2 (65.5Hz - creating slow structural beating phase)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth'; // mixed with sine for richer overtones
      osc2.frequency.value = 65.5;
      osc2Ref.current = osc2;

      // Binaural Audio Panners
      const panner1 = ctx.createStereoPanner();
      panner1.pan.value = -1; // Left ear

      const panner2 = ctx.createStereoPanner();
      panner2.pan.value = 1; // Right ear

      // Sub gain for sawtooth oscillator to keep it quiet and warm
      const subGain = ctx.createGain();
      subGain.gain.value = 0.15;

      // Audio Routing
      osc1.connect(panner1);
      panner1.connect(filter);
      
      osc2.connect(subGain);
      subGain.connect(panner2);
      panner2.connect(filter);

      filter.connect(gain);
      gain.connect(ctx.destination);

      // Start oscillators
      osc1.start();
      osc2.start();

      // Slow dynamic parameter modulation (LFO emulation using simple timer)
      const interval = setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          clearInterval(interval);
          return;
        }
        // Slowly drift filter frequency up and down to evoke concrete acoustics
        const time = Date.now() / 10000;
        const drift = 120 + Math.sin(time) * 40;
        if (filter) {
          filter.frequency.setValueAtTime(drift, ctx.currentTime);
        }
      }, 100);

      setIsPlaying(true);
    } catch (e) {
      console.error("Web Audio API failed to initialize:", e);
    }
  };

  const stopDrone = () => {
    if (osc1Ref.current) {
      try { osc1Ref.current.stop(); } catch {}
      osc1Ref.current = null;
    }
    if (osc2Ref.current) {
      try { osc2Ref.current.stop(); } catch {}
      osc2Ref.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    // If sound type changes to silence, stop drone automatically
    if (soundType === 'silence' && isPlaying) {
      stopDrone();
    } else if (soundType === 'drone' && !isPlaying) {
      startDrone();
    }
  }, [soundType]);

  useEffect(() => {
    // Adjust gain volume immediately when updated
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDrone();
    };
  }, []);

  const toggleSound = () => {
    if (isPlaying) {
      stopDrone();
    } else {
      startDrone();
    }
  };

  const isDark = theme === 'dark-void' || theme === 'dark' || (theme?.includes('dark') ?? false);

  return (
    <div
      id="atmospheric-audio-synth"
      className={`flex items-center gap-4 px-4 py-2.5 rounded-full transition-all duration-500 backdrop-blur-3xl border ${
        isDark
          ? 'bg-black/40 border-white/10 text-white shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'bg-white/40 border-black/10 text-black shadow-[0_4px_30px_rgba(255,255,255,0.5)]'
      }`}
    >
      <button
        id="toggle-audio-btn"
        onClick={toggleSound}
        className="relative group p-1.5 focus:outline-none transition-transform active:scale-95 cursor-pointer"
        title={isPlaying ? 'Mute Atmosphere' : 'Synthesize Atmosphere'}
      >
        {isPlaying ? (
          <Volume2 className="w-4 h-4 transition-transform group-hover:scale-110" />
        ) : (
          <VolumeX className={`w-4 h-4 transition-transform group-hover:scale-110 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
        )}
        {isPlaying && (
          <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
          </span>
        )}
      </button>

      <div className="flex items-center gap-2">
        <Sliders className={`w-3.5 h-3.5 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
        <input
          id="audio-volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-16 h-1 rounded-lg appearance-none cursor-pointer bg-neutral-800 accent-neutral-200 transition-all focus:outline-none focus:ring-0 [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-neutral-800 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
        <span className="text-[10px] font-mono select-none tracking-widest opacity-50">
          {isPlaying ? `${Math.round(volume * 100)}%` : 'OFF'}
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 select-none">
        <Sparkles className="w-3 h-3 text-white/40 animate-pulse" />
        <span className="text-[10px] font-mono tracking-widest opacity-40 uppercase">
          {isPlaying ? '65.5Hz OSC ACTIVE' : 'VOID COLD HUM'}
        </span>
      </div>
    </div>
  );
}

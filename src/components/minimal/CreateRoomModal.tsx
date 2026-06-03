/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sparkles, UserCheck2, Compass } from 'lucide-react';
import { CuratedRoom } from './types';

interface CreateRoomModalProps {
  theme: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newRoom: CuratedRoom) => void;
}

export default function CreateRoomModal({ theme, isOpen, onClose, onCreated }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [maxOccupants, setMaxOccupants] = useState(8);
  const [soundType, setSoundType] = useState<'silence' | 'drone'>('drone');

  if (!isOpen) return null;

  const isDark = theme === 'dark-void' || theme === 'dark' || (theme?.includes('dark') ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedName = name.trim().toUpperCase();
    const formattedSubtitle = subtitle.trim() || 'SOCIALLY ACCOUNTABLE DEEP WORK';

    onCreated({
      id: `custom-room-${Date.now()}`,
      name: formattedName,
      subtitle: formattedSubtitle,
      occupantsCount: 1, // User occupies immediately
      maxOccupants: maxOccupants,
      soundType: soundType,
      peers: [
        {
          id: 'user-self',
          name: 'YOU',
          avatarSeed: 'user',
          isCameraOn: true,
          isMicOn: false,
          statusText: 'JUST ENTERED THE VOID',
          focusMinutesToday: 0
        }
      ]
    });

    // Reset fields
    setName('');
    setSubtitle('');
    setMaxOccupants(8);
    setSoundType('drone');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl transition-all duration-500 bg-black/60">
      <div
        id="create-room-panel"
        className={`w-full max-w-lg p-8 rounded-[2.5rem] border transition-all duration-500 transform scale-100 ${
          isDark
            ? 'bg-neutral-900/90 border-white/10 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]'
            : 'bg-white/95 border-black/15 text-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)]'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <span className="text-[10px] font-mono tracking-[0.3em] opacity-40 uppercase">STRUCTURE CONFIGURATOR</span>
            <h2 className="text-2xl font-black tracking-tighter mt-1 uppercase">ESTABLISH SANCTUARY</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full cursor-pointer transition-colors ${
              isDark ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-black/5 text-black/60 hover:text-black'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Forum */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-mono tracking-wider opacity-60 uppercase mb-2">
              Sanctuary Name
            </label>
            <input
              type="text"
              required
              maxLength={24}
              placeholder="e.g. THE BRUTALIST ARCH"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-5 py-3.5 rounded-2xl border font-mono text-xs uppercase tracking-widest focus:outline-none transition-all ${
                isDark
                  ? 'bg-black/40 border-white/10 text-white focus:border-white/30 placeholder:text-neutral-600'
                  : 'bg-white/40 border-black/10 text-black focus:border-black/30 placeholder:text-neutral-400'
              }`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono tracking-wider opacity-60 uppercase mb-2">
              Focus Objective
            </label>
            <input
              type="text"
              maxLength={50}
              placeholder="e.g. Ph.D Writing & Theoretical Assembly"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className={`w-full px-5 py-3.5 rounded-2xl border font-mono text-xs tracking-widest focus:outline-none transition-all ${
                isDark
                  ? 'bg-black/40 border-white/10 text-white focus:border-white/30 placeholder:text-neutral-600'
                  : 'bg-white/40 border-black/10 text-black focus:border-black/30 placeholder:text-neutral-400'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono tracking-wider opacity-60 uppercase mb-2">
                Atmosphere Profile
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSoundType('drone')}
                  className={`flex-1 py-3 text-xs font-mono rounded-xl border tracking-widest transition-all cursor-pointer ${
                    soundType === 'drone'
                      ? isDark
                        ? 'bg-white text-black border-white'
                        : 'bg-black text-white border-black'
                      : isDark
                      ? 'bg-black/20 border-white/10 opacity-50 hover:opacity-100'
                      : 'bg-white/20 border-black/10 opacity-50 hover:opacity-100'
                  }`}
                >
                  65.5Hz HUM
                </button>
                <button
                  type="button"
                  onClick={() => setSoundType('silence')}
                  className={`flex-1 py-3 text-xs font-mono rounded-xl border tracking-widest transition-all cursor-pointer ${
                    soundType === 'silence'
                      ? isDark
                        ? 'bg-white text-black border-white'
                        : 'bg-black text-white border-black'
                      : isDark
                      ? 'bg-black/20 border-white/10 opacity-50 hover:opacity-100'
                      : 'bg-white/20 border-black/10 opacity-50 hover:opacity-100'
                  }`}
                >
                  ABS SILENCE
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono tracking-wider opacity-60 uppercase mb-2">
                Capacity Limit: {maxOccupants} Occupants
              </label>
              <div className="flex items-center gap-3 py-3 px-4 rounded-xl border bg-black/5 dark:bg-black/20 border-neutral-200 dark:border-neutral-800">
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="1"
                  value={maxOccupants}
                  onChange={(e) => setMaxOccupants(parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className={`w-full py-4 text-xs font-mono tracking-[0.25em] rounded-full uppercase cursor-pointer border transition-all duration-300 font-bold active:scale-[0.98] ${
                isDark
                  ? 'bg-white text-black border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                  : 'bg-black text-white border-black hover:shadow-[0_0_20px_rgba(0,0,0,0.25)]'
              }`}
            >
              CONSTRUCT SANCTUARY
            </button>
          </div>
        </form>

        <div className="mt-8 flex gap-3 text-[10px] font-mono items-center opacity-40 justify-center">
          <Compass className="w-3.5 h-3.5" />
          <span>PORTAL GATE WILL AUTOMATICALLY INITIALIZE COMPANIONS</span>
        </div>
      </div>
    </div>
  );
}

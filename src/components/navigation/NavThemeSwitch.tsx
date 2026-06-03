'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTheme } from 'next-themes';
import { useLayout, LayoutPreference } from '@/components/theme-provider';
import { useClerk } from '@clerk/nextjs';

export function NavThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const { layout, setLayout } = useLayout();
  const { signOut } = useClerk();

  const coreThemes = [
    { id: 'structural-brutalist', name: 'Structural Brutalist', icon: '🏛️' },
    { id: 'lofi-aesthetic', name: 'Lofi Aesthetic', icon: '🎧' },
    { id: 'dark-academia', name: 'Dark Academia', icon: '🕰️' },
    { id: 'light-academia', name: 'Light Academia', icon: '📜' },
    { id: 'pastel-dream', name: 'Pastel Dream', icon: '☁️' }
  ];

  const curatedThemes = [
    { id: 'cyberpunk-neon', name: 'Cyberpunk Neon', icon: '🦾' },
    { id: 'deep-abyss', name: 'Deep Abyss', icon: '🌊' },
    { id: 'matcha-zen', name: 'Matcha Zen', icon: '🍵' },
    { id: 'monochrome', name: 'Monochrome', icon: '⬛' },
    { id: 'metallic-silver', name: 'Metallic Silver', icon: '💿' },
    { id: 'sunset-vaporwave', name: 'Sunset Vaporwave', icon: '🌅' }
  ];

  return (
    <DropdownMenu.Content
      className="min-w-[220px] max-h-[400px] overflow-y-auto border border-border p-2 font-[family-name:var(--font-primary)] text-sm shadow-2xl rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--surface-high)', zIndex: 99999 }}
      sideOffset={5}
    >
      <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-secondary font-bold">
        Core Aesthetics
      </div>
      {coreThemes.map((t) => (
        <DropdownMenu.Item
          key={t.id}
          className={`px-3 py-2 cursor-pointer hover:bg-border outline-none text-foreground flex justify-between ${theme === t.id ? 'bg-border/50' : ''}`}
          onClick={() => {
            console.log(`[Theme Debug] Switching Theme (colors) to:`, t.id);
            setTheme(t.id);
            setTimeout(() => {
              console.log(`[Theme Debug] HTML data-theme attribute is now:`, document.documentElement.getAttribute('data-theme'));
            }, 50);
          }}
        >
          <span>{t.name}</span>
          <span>{t.icon}</span>
        </DropdownMenu.Item>
      ))}

      <DropdownMenu.Separator className="h-px bg-border my-2" />

      <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-secondary font-bold">
        Curated Palettes
      </div>
      {curatedThemes.map((t) => (
        <DropdownMenu.Item
          key={t.id}
          className={`px-3 py-2 cursor-pointer hover:bg-border outline-none text-foreground flex justify-between ${theme === t.id ? 'bg-border/50' : ''}`}
          onClick={() => {
            console.log(`[Theme Debug] Switching Theme (colors) to:`, t.id);
            setTheme(t.id);
            setTimeout(() => {
              console.log(`[Theme Debug] HTML data-theme attribute is now:`, document.documentElement.getAttribute('data-theme'));
            }, 50);
          }}
        >
          <span>{t.name}</span>
          <span>{t.icon}</span>
        </DropdownMenu.Item>
      ))}

      <DropdownMenu.Separator className="h-px bg-border my-2" />

      <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-secondary font-bold">
        Interface Style
      </div>
      {[
        { id: 'structural-brutalist', name: 'Brutalist Canvas' },
        { id: 'cyber-glow', name: 'Cyber Glow' },
        { id: 'retro-pixel', name: 'Retro Pixel' },
        { id: 'cozy-studio', name: 'Cozy Studio' }
      ].map((l) => (
        <DropdownMenu.Item
          key={l.id}
          className={`px-3 py-2 cursor-pointer hover:bg-border outline-none text-foreground flex justify-between ${layout === l.id ? 'bg-border/50' : ''}`}
          onClick={() => {
            console.log(`[Layout Debug] Switching Layout (shapes) to:`, l.id);
            setLayout(l.id as LayoutPreference);
            setTimeout(() => {
              console.log(`[Layout Debug] HTML data-layout attribute is now:`, document.documentElement.getAttribute('data-layout'));
            }, 50);
          }}
        >
          <span>{l.name}</span>
          {layout === l.id && <span>✓</span>}
        </DropdownMenu.Item>
      ))}

      <DropdownMenu.Separator className="h-px bg-border my-2" />
      <DropdownMenu.Item
        className="px-3 py-2 cursor-pointer hover:bg-border outline-none text-foreground flex justify-between"
        onClick={() => signOut()}
      >
        <span>Sign Out</span>
        <span>🚪</span>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  );
}

'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useUser } from '@clerk/nextjs';
import { NavThemeSwitch } from '@/components/navigation/NavThemeSwitch';

export function NavProfileBadge() {
  const { user, isLoaded } = useUser();

  const displayName = isLoaded && user ? user.fullName || 'User' : 'Loading...';
  const displayHandle = isLoaded && user
    ? (user.username ? `@${user.username}` : `@${user.emailAddresses[0]?.emailAddress.split('@')[0]}`)
    : '@loading';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-3 mb-8 w-full text-left hover:opacity-80 transition-opacity outline-none"
          onClick={(e) => {
            const computed = window.getComputedStyle(e.currentTarget);
            console.log("[Dropdown Trigger Debug] Trigger opacity:", computed.opacity);
          }}
        >
          {isLoaded && user?.imageUrl ? (
            <img src={user.imageUrl} alt="Profile" className="w-8 h-8 rounded-[var(--radius)] border border-border shrink-0 object-cover" />
          ) : (
            <div className="w-8 h-8 bg-surface border border-border shrink-0" />
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-[family-name:var(--font-primary)] font-medium text-sm truncate text-foreground">{displayName}</span>
            <span className="font-[family-name:var(--font-primary)] text-secondary text-xs truncate">{displayHandle}</span>
          </div>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <NavThemeSwitch />
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLinks() {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Discover', href: '/dashboard/discover' },
    { name: 'My Rooms', href: '/dashboard/my-rooms' },
    { name: 'Saved', href: '/dashboard/saved' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <nav className="flex flex-col gap-4 font-[family-name:var(--font-primary)] text-sm mb-6">
      {navItems.map(item => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`transition-colors truncate ${isActive ? 'text-primary font-medium' : 'text-secondary hover:text-foreground'}`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

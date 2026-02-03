'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, History, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  const tabs = [
    { href: '/dashboard', icon: Moon, label: 'Today' },
    { href: '/dashboard/history', icon: History, label: 'History' },
    { href: '/dashboard/settings', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border bottom-nav-safe z-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${
                  active ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className={`text-xs ${active ? 'font-medium' : ''}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

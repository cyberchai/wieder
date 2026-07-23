"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from './theme-switcher';
import { FontSwitcher } from './font-switcher';
import { UserNav } from './user-nav';
import { CountdownTimer } from './countdown-timer';
import { LeaderboardButton } from './leaderboard-button';
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export default function Header({ searchQuery = "", onSearchChange, searchInputRef }: HeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchHovered, setIsSearchHovered] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Colored fade scrim — mirrors the dashboard footer's gradient
          (from-transparent to-black/25), flipped for the header and a touch
          stronger, so content softly fades in beneath the bar. The
          .header-scrim mask fades the backdrop-blur out with the color (no hard
          bottom edge) and bows the fade into a slight concave-down arch so the
          left/right ends drop just below the center. */}
      <div
        aria-hidden
        className="header-scrim pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/70 to-transparent backdrop-blur-sm"
      />
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center" aria-label="Wieder home">
              <span className="wieder-wordmark h-5 sm:h-6" />
            </Link>
          </div>

          {/* Search Bar Section - Center (hidden on very small screens) */}
          <div className="hidden sm:flex flex-1 justify-center mx-4">
            <div 
              className={`relative transition-all duration-300 ease-in-out ${
                isSearchFocused || isSearchHovered 
                  ? 'w-full max-w-2xl' 
                  : 'w-full max-w-md'
              }`}
              onMouseEnter={() => setIsSearchHovered(true)}
              onMouseLeave={() => setIsSearchHovered(false)}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="search sets, cards, and tags..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="pl-10 pr-4 py-2 w-full transition-all duration-300"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                  onClick={() => onSearchChange?.("")}
                >
                  <span className="sr-only">Clear search</span>
                  ×
                </Button>
              )}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground bg-muted px-1 rounded">
                {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
              </div>
            </div>
          </div>

          {/* Theme, Font & Profile Section */}
          <div className="flex items-center space-x-2">
             <LeaderboardButton />
             <CountdownTimer />
             <FontSwitcher />
             <ThemeSwitcher />
             <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
}

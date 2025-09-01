import Link from 'next/link';
import { ThemeSwitcher } from './theme-switcher';
import { UserNav } from './user-nav';
import { IterationCcw, Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export default function Header({ searchQuery = "", onSearchChange, searchInputRef }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <IterationCcw className="h-6 w-6 text-primary" />
              <span className="font-bold">Wieder</span>
            </Link>
          </div>

          {/* Search Bar Section - Center (hidden on very small screens) */}
          <div className="hidden sm:flex flex-1 justify-center max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="search sets and cards..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
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
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground bg-background px-1">
                {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
              </div>
            </div>
          </div>

          {/* Theme & Profile Section */}
          <div className="flex items-center space-x-2">
             <ThemeSwitcher />
             <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
}

import Link from 'next/link';
import { ThemeSwitcher } from './theme-switcher';
import { UserNav } from './user-nav';
import { AppWindow } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <AppWindow className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">Wieder</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
           <ThemeSwitcher />
           <UserNav />
        </div>
      </div>
    </header>
  );
}

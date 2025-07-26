import Link from 'next/link';
import { ThemeSwitcher } from './theme-switcher';
import { UserNav } from './user-nav';
import { IterationCcw } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center ml-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <IterationCcw className="h-6 w-6 text-primary" />
            <span className="font-bold">Wieder</span>
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

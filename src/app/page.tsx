import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap, Share2, Palette } from 'lucide-react';
import { AppWindow } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="#" className="flex items-center justify-center gap-2" prefetch={false}>
          <AppWindow className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Wieder</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Button variant="default" asChild>
            <Link href="/login" prefetch={false}>
              Login
            </Link>
          </Button>
          <ThemeSwitcher />
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Master Anything with Wieder Flashcards
                </h1>
                <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
                  The smart, simple, and effective way to learn. Create your own flashcard sets, study with powerful tools, and share your knowledge.
                </p>
              </div>
              <div className="flex justify-center flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" asChild>
                  <Link href="/signup" prefetch={false}>
                    Get Started for Free
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Wieder is packed with features designed to enhance your learning experience, from creation to collaboration.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 mt-12">
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background mb-4 shadow">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Powerful Study Modes</h3>
                <p className="text-sm text-muted-foreground">Go beyond basic flipping with shuffle, reverse, and starred-only modes. Master your material your way.</p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background mb-4 shadow">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Canvas Input</h3>
                <p className="text-sm text-muted-foreground">Perfect for visual learners. Draw diagrams, write equations, or practice characters by hand.</p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background mb-4 shadow">
                  <Share2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Seamless Sharing</h3>
                <p className="text-sm text-muted-foreground">Share your flashcard sets with friends or classmates via a simple, shareable link.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">made with &lt;3 by a Smithie</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

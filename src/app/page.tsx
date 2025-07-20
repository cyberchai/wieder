import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, CheckCircle, Share2 } from 'lucide-react';
import { IterationCcw } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="#" className="flex items-center justify-center gap-2" prefetch={false}>
          <IterationCcw className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">wieder</span>
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
                  keep learning free
                </h1>
                {/* just an idea we can have free pop up in different languages */}
                <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
                  simple and effective learning through repetition.<br></br>
                  no ads, no ai, adhd-friendly.
                </p>
              </div>
              <div className="flex justify-center flex-col gap-2 min-[400px]:flex-row">
                 <Button size="lg" asChild>
                  <Link href="/login" prefetch={false}>
                    login with your smith email!
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
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">tldr;</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">how to use this</h2>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 mt-12">
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background mb-4 shadow">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold">flashcards</h3>
                <p className="text-sm text-muted-foreground">create and learn with flashcards</p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background mb-4 shadow">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold">handwrite</h3>
                <p className="text-sm text-muted-foreground">handwrite vocab + definitions for your learning set when using your tablet</p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background mb-4 shadow">
                  <Share2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold">share sets</h3>
                <p className="text-sm text-muted-foreground">use the link associated with your learning set to share with other smithies</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">made with &lt;3 by a smithie</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/terms" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            terms of service
          </Link>
          <Link href="/privacy" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

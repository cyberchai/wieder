import Link from "next/link";
import { IterationCcw, Github, Heart, Code, Bug, Palette, MessageCircle } from "lucide-react";

export default function ContributePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center justify-center gap-0" prefetch={false}>
              <IterationCcw className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">wieder</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="prose prose-stone dark:prose-invert max-w-4xl mx-auto prose-headings:mt-10 prose-headings:mb-4 prose-p:my-4 prose-ul:my-4 prose-ol:my-4">
          <h1>contribute to wieder</h1>

          <p className="text-lg leading-relaxed">
            hey! we&apos;d love your help making wieder better. whether you&apos;re fixing bugs, adding features, or improving the UI — every contribution matters.
          </p>

          <div className="not-prose my-8 rounded-lg border-2 border-primary/30 p-5 bg-primary/5">
            <p className="text-sm font-medium mb-2">a note on our mission</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              a big part of this project is getting the <strong className="text-foreground">Smith College community</strong> more involved in tech and app development — building tools that benefit Smithies and the broader education space. we&apos;d especially love contributions from <strong className="text-foreground">Smith students, alums, and developers</strong>. if that&apos;s you, please reach out!
            </p>
          </div>

          <hr className="my-8 border-border" />

          <h2>how to get started</h2>
          <p>
            this repo is usually <strong>private</strong>, so if you&apos;d like to contribute, reach out and we&apos;ll add you as a collaborator. once you have access:
          </p>
          <ol className="space-y-2">
            <li><strong>pick something to work on</strong> — check out our roadmap below or look for open issues</li>
            <li><strong>create a branch</strong> — branch off from <code>main</code> with a descriptive name</li>
            <li><strong>make your changes</strong> — keep commits atomic and descriptive</li>
            <li><strong>test locally</strong> — make sure nothing breaks</li>
            <li><strong>open a PR</strong> — describe what you changed and why</li>
          </ol>

          <hr className="my-8 border-border" />

          <h2>what we&apos;re working on</h2>
          <p>
            here&apos;s our current roadmap, organized by priority. pick something that interests you!
          </p>
          
          <div className="not-prose my-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4 bg-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-amber-500 text-white text-xs font-bold">1</span>
                <span className="font-semibold">high priority</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Image cards with ImageKit.io</li>
                <li>• Theme accessibility fixes</li>
                <li>• Mobile view improvements</li>
                <li>• Voting/polling system</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4 bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">medium priority</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Analytics dashboard</li>
                <li>• Testing infrastructure</li>
                <li>• Error boundaries &amp; graceful failing</li>
                <li>• Offline mode indicators</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4 bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="h-5 w-5 text-purple-500" />
                <span className="font-semibold">graphics &amp; themes</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• More unlockable themes</li>
                <li>• Theme store UI</li>
                <li>• Seasonal themes</li>
                <li>• Animated backgrounds</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4 bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="h-5 w-5 text-red-500" />
                <span className="font-semibold">long-term</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Apple Vision Pro version</li>
                <li>• Multiplayer speed mode</li>
                <li>• Smart-suggest flashcards</li>
                <li>• Spaced repetition algorithm</li>
              </ul>
            </div>
          </div>

          <hr className="my-8 border-border" />

          <h2>code style</h2>
          <p>
            a few guidelines to keep things consistent:
          </p>
          <ul className="space-y-2">
            <li>we use <strong>TypeScript</strong> everywhere — please maintain type safety</li>
            <li>components go in <code>src/components/</code>, hooks in <code>src/hooks/</code></li>
            <li>use React Query for server state, local state for UI-only state</li>
            <li>follow existing patterns for new features</li>
          </ul>

          <hr className="my-8 border-border" />

          <h2>tech stack</h2>
          <ul className="space-y-2">
            <li><strong>Framework:</strong> Next.js 15 (App Router)</li>
            <li><strong>Styling:</strong> Tailwind CSS + shadcn/ui</li>
            <li><strong>Database:</strong> Firebase Firestore</li>
            <li><strong>Auth:</strong> Firebase Authentication</li>
            <li><strong>State:</strong> TanStack Query (React Query)</li>
          </ul>

          <hr className="my-8 border-border" />

          <h2>questions?</h2>

          <div className="not-prose my-8 rounded-lg border border-dashed p-6 bg-muted/30">
            <Heart className="h-8 w-8 mx-auto mb-4 text-pink-500" />
            <p className="text-center text-lg font-medium mb-2">we&apos;re friendly!</p>
            <p className="text-center text-sm text-muted-foreground mb-6">
              reach out if you have questions, want repo access, or just want to say hi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://chairaharder.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                chairaharder.com
              </a>
              <a
                href="https://formspree.io/f/xldednky"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                send feedback
              </a>
              <a
                href="https://github.com/cyberchai/wieder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Github className="h-4 w-4" />
                view on github
              </a>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              note: the repo is sometimes private. request access via the links above.
            </p>
          </div>

          <p className="text-center text-muted-foreground mt-8">
            thanks for helping make wieder better 💛
          </p>

        </div>
      </main>
    </div>
  );
}

import { Github, Heart, Code, Bug, Palette, MessageCircle } from "lucide-react";
import { LegalShell } from "@/components/legal-shell";

const contentClass =
  "!text-slate-700 leading-relaxed " +
  "[&_h1]:mb-3 [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:!text-slate-900 " +
  "[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:!text-slate-900 " +
  "[&>p]:my-4 " +
  "[&>ul]:my-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2 " +
  "[&>ol]:my-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-2 " +
  "[&_strong]:font-semibold [&_strong]:!text-slate-900 " +
  "[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:!text-slate-800";

export default function ContributePage() {
  return (
    <LegalShell>
      <div className={contentClass}>
        <h1>contribute to wieder</h1>

        <p className="text-lg text-slate-500">
          hey! we&apos;d love your help making wieder better. whether you&apos;re fixing bugs, adding features, or improving the UI — every contribution matters.
        </p>

        <div className="my-8 rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <p className="mb-2 text-sm font-semibold text-slate-900">a note on our mission</p>
          <p className="text-sm leading-relaxed text-slate-600">
            a big part of this project is getting the <strong className="text-slate-900">Smith College community</strong> more involved in tech and app development — building tools that benefit Smithies and the broader education space. we&apos;d especially love contributions from <strong className="text-slate-900">Smith students, alums, and developers</strong>. if that&apos;s you, please reach out!
          </p>
        </div>

        <h2>how to get started</h2>
        <p>
          this repo is usually <strong>private</strong>, so if you&apos;d like to contribute, reach out and we&apos;ll add you as a collaborator. once you have access:
        </p>
        <ol>
          <li><strong>pick something to work on</strong> — check out our roadmap below or look for open issues</li>
          <li><strong>create a branch</strong> — branch off from <code>main</code> with a descriptive name</li>
          <li><strong>make your changes</strong> — keep commits atomic and descriptive</li>
          <li><strong>test locally</strong> — make sure nothing breaks</li>
          <li><strong>open a PR</strong> — describe what you changed and why</li>
        </ol>

        <h2>what we&apos;re working on</h2>
        <p>here&apos;s our current roadmap, organized by priority. pick something that interests you!</p>

        <div className="my-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">1</span>
              <span className="font-semibold text-slate-900">high priority</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Image cards with ImageKit.io</li>
              <li>• Theme accessibility fixes</li>
              <li>• Mobile view improvements</li>
              <li>• Voting/polling system</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Code className="h-5 w-5 text-blue-500" />
              <span className="font-semibold text-slate-900">medium priority</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Analytics dashboard</li>
              <li>• Testing infrastructure</li>
              <li>• Error boundaries &amp; graceful failing</li>
              <li>• Offline mode indicators</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              <span className="font-semibold text-slate-900">graphics &amp; themes</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• More unlockable themes</li>
              <li>• Theme store UI</li>
              <li>• Seasonal themes</li>
              <li>• Animated backgrounds</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-slate-900">long-term</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Apple Vision Pro version</li>
              <li>• Multiplayer speed mode</li>
              <li>• Smart-suggest flashcards</li>
              <li>• Spaced repetition algorithm</li>
            </ul>
          </div>
        </div>

        <h2>code style</h2>
        <p>a few guidelines to keep things consistent:</p>
        <ul>
          <li>we use <strong>TypeScript</strong> everywhere — please maintain type safety</li>
          <li>components go in <code>src/components/</code>, hooks in <code>src/hooks/</code></li>
          <li>use React Query for server state, local state for UI-only state</li>
          <li>follow existing patterns for new features</li>
        </ul>

        <h2>tech stack</h2>
        <ul>
          <li><strong>Framework:</strong> Next.js 15 (App Router)</li>
          <li><strong>Styling:</strong> Tailwind CSS + shadcn/ui</li>
          <li><strong>Database:</strong> Firebase Firestore</li>
          <li><strong>Auth:</strong> Firebase Authentication</li>
          <li><strong>State:</strong> TanStack Query (React Query)</li>
        </ul>

        <h2>questions?</h2>

        <div className="my-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <Heart className="mx-auto mb-4 h-8 w-8 text-pink-500" />
          <p className="mb-2 text-center text-lg font-semibold text-slate-900">we&apos;re friendly!</p>
          <p className="mx-auto mb-6 max-w-md text-center text-sm text-slate-600">
            reach out if you have questions, want repo access, or just want to say hi.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://chairaharder.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200"
            >
              <MessageCircle className="h-4 w-4" />
              chairaharder.com
            </a>
            <a
              href="https://formspree.io/f/xldednky"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200"
            >
              send feedback
            </a>
            <a
              href="https://github.com/cyberchai/wieder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <Github className="h-4 w-4" />
              view on github
            </a>
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            note: the repo is sometimes private. request access via the links above.
          </p>
        </div>

        <p className="text-center text-slate-500">thanks for helping make wieder better 💛</p>
      </div>
    </LegalShell>
  );
}

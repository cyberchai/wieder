import Link from "next/link";
import Header from "@/components/header";
import { IterationCcw } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
          <IterationCcw className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">wieder</span>
        </Link>
      </header>
      <main className="flex-1 container mx-auto py-12 px-4 md:px-6">
        <div className="prose prose-stone dark:prose-invert max-w-4xl mx-auto">
          <h1>Terms of Use</h1>
          <p>
            Hey! By using wieder, you’re agreeing to the basic rules below. 
            Nothing wild, just some ground rules to keep things running smoothly for everyone.
          </p>

          <h2>1. Using the app</h2>
          <p>
            You’re welcome to use wieder for personal study and learning. Feel free to save and review your sets, but please don’t:
          </p>
          <ul>
            <li>try to hack or reverse engineer the code (seriously)</li>
            <li>remove credit or branding</li>
            <li>upload wieder's content elsewhere like it’s yours</li>
          </ul>
          <p>
            If you break the rules, we might have to cut off your access. Just use the site normally and you’ll be good.
          </p>

          <h2>2. Just a heads up</h2>
          <p>
            wieder is provided as-is. We can’t promise it’ll always be bug-free or perfect. Use it at your own discretion.
          </p>

          <h2>3. Liability</h2>
          <p>
            We’re not liable for any losses, tech issues, or data problems that might happen while using wieder. Backup your stuff and use the app responsibly.
          </p>

          <h2>4. Don’t abuse the app</h2>
          <p>
            Please don't spam sets and no trolling, or trying to break the system.
          </p>

          <h2>5. Terms might change</h2>
          <p>
            We might update these terms from time to time.
          </p>

          <p>
            Thanks for using wieder 💛
          </p>
        </div>
      </main>
    </div>
  );
}

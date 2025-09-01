import Link from "next/link";
import Header from "@/components/header";
import { IterationCcw } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
              <IterationCcw className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">wieder</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="prose prose-stone dark:prose-invert max-w-4xl mx-auto">
          <h1>terms of use</h1>

          <p>
            hey! by using wieder, you’re agreeing to the basic rules below. nothing wild, just some ground rules to keep things running smoothly for everyone.
          </p>

          <h2>1. using the app</h2>
          <p>
            you’re welcome to use wieder for personal study and learning. feel free to save and review your sets, but please don’t:
          </p>
          <ul>
            <li>try to hack or reverse engineer the code</li>
            <li>remove credit or branding</li>
          </ul>
          <p>
            if you break the rules, we might have to cut off your access. just use the site normally please.
          </p>

          <h2>2. just a heads up</h2>
          <p>
            wieder is provided as-is. we can’t promise it’ll always be bug-free or perfect. use it at your own discretion.
          </p>

          <h2>3. liability</h2>
          <p>
            we’re not liable for any losses, tech issues, or data problems that might happen while using wieder. please back up your stuff and use the app responsibly.
          </p>

          <h2>4. don’t abuse the app</h2>
          <p>
            please don’t spam sets, troll, or try to break the system.
          </p>

          <h2>5. terms might change</h2>
          <p>
            we might update these terms from time to time.
          </p>

          <p>
            thanks for using wieder 💛
          </p>

        </div>
      </main>
    </div>
  );
}

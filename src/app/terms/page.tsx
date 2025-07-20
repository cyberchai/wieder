import Link from "next/link";
import Header from "@/components/header";
import { AppWindow } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
          <AppWindow className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">wieder</span>
        </Link>
      </header>
      <main className="flex-1 container mx-auto py-12 px-4 md:px-6">
        <div className="prose prose-stone dark:prose-invert max-w-4xl mx-auto">
          <h1>Terms of Service</h1>
          <p>
            By accessing the website at Wieder, you are agreeing to be bound by
            these terms of service, all applicable laws and regulations, and agree
            that you are responsible for compliance with any applicable local
            laws.
          </p>

          <h2>1. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the
            materials (information or software) on Wieder's website for
            personal, non-commercial transitory viewing only. This is the grant
            of a license, not a transfer of title, and under this license you
            may not:
          </p>
          <ul>
            <li>modify or copy the materials;</li>
            <li>
              use the materials for any commercial purpose, or for any public
              display (commercial or non-commercial);
            </li>
            <li>
              attempt to decompile or reverse engineer any software contained on
              Wieder's website;
            </li>
            <li>
              remove any copyright or other proprietary notations from the
              materials; or
            </li>
            <li>
              transfer the materials to another person or "mirror" the materials
              on any other server.
            </li>
          </ul>
          <p>
            This license shall automatically terminate if you violate any of
            these restrictions and may be terminated by Wieder at any time.
          </p>

          <h2>2. Disclaimer</h2>
          <p>
            The materials on Wieder's website are provided on an 'as is' basis.
            Wieder makes no warranties, expressed or implied, and hereby
            disclaims and negates all other warranties including, without
            limitation, implied warranties or conditions of merchantability,
            fitness for a particular purpose, or non-infringement of
            intellectual property or other violation of rights.
          </p>

          <h2>3. Limitations</h2>
          <p>
            In no event shall Wieder or its suppliers be liable for any damages
            (including, without limitation, damages for loss of data or profit,
            or due to business interruption) arising out of the use or inability
            to use the materials on Wieder's website, even if Wieder or a
            Wieder authorized representative has been notified orally or in
            writing of the possibility of such damage.
          </p>
          <h2>4. Abuse</h2>
          <p>
            You agree not to abuse the service. This includes, but is not limited to, spamming, scraping content, or any other activity that could disrupt the service for other users. We reserve the right to terminate your account if we detect such activities.
          </p>

          <h2>5. Modifications</h2>
          <p>
            Wieder may revise these terms of service for its website at any
            time without notice. By using this website you are agreeing to be
            bound by the then current version of these terms of service.
          </p>
        </div>
      </main>
    </div>
  );
}

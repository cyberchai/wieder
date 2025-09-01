import Link from "next/link";
import Header from "@/components/header";
import { IterationCcw } from "lucide-react";

export default function PrivacyPage() {
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
        <div className="prose prose-stone dark:prose-invert max-w-4xl mx-auto">
          <h1>privacy policy</h1>

          <p>
            your privacy matters to us. it&rsquo;s wieder&rsquo;s policy to respect your privacy and keep any info you share with us safe and minimal.
          </p>

          <h2>1. what we collect</h2>
          <p>
            we only ask for info when we actually need it to run the site or help you use it. right now, that&rsquo;s just your google account email and associated name so you can log in, nothing else.
          </p>

          <h2>2. how we use it</h2>
          <p>
            we use your info to save your flashcard sets under your user id.
          </p>

          <h2>3. storing your data</h2>
          <p>
            we only keep your info as long as we need it to run the service. we do our best to protect it from anything sketchy like loss, theft, or unauthorized access. if you delete your account, we will delete your info within 30 days.
          </p>

          <h2>4. sharing info</h2>
          <p>
            we don&rsquo;t share your personal info with anyone, unless we&apos;re legally required to. if you share your sets with others, they will be able to view your sets.
          </p>

          <h2>5. your consent</h2>
          <p>
            by using wieder, you&rsquo;re saying it&rsquo;s cool for us to use your info this way.
          </p>

          <h2>questions?</h2>
          <p>
            if you have any questions, comments or concerns, reach out anytime at{" "}
            <a href="mailto:support@nextnode.ventures">support@nextnode.ventures</a> or{" "}
            <a href="https://chairaharder.com" target="_blank" rel="noopener noreferrer">
              chairaharder.com
            </a>
          </p>



        </div>
      </main>
    </div>
  );
}

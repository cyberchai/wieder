import Link from "next/link";
import Header from "@/components/header";
import { IterationCcw } from "lucide-react";

export default function PrivacyPage() {
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
          <h1>Privacy Policy</h1>
          <p>
            Your privacy is important to us. It is Wieder's policy to respect
            your privacy regarding any information we may collect from you
            across our website.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We only ask for personal information when we truly need it to
            provide a service to you. We collect it by fair and lawful means,
            with your knowledge and consent. We also let you know why we’re
            collecting it and how it will be used. The only personal information
            we store is your Google account email address and display name for authentication purposes.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to operate and maintain our
            Services, and to provide the features and functionality of the
            Services. Specifically, your user ID is associated with the flashcard sets you create.
          </p>

          <h2>3. Data Storage</h2>
          <p>
            We only retain collected information for as long as necessary to
            provide you with your requested service. What data we store, we’ll
            protect within commercially acceptable means to prevent loss and
            theft, as well as unauthorized access, disclosure, copying, use or
            modification.
          </p>
          
          <h2>4. Sharing Information</h2>
          <p>
            We don’t share any personally identifying information publicly or
            with third-parties, except when required to by law.
          </p>

          <h2>5. Your Consent</h2>
          <p>
            By using our site, you consent to our privacy policy.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us.
          </p>
        </div>
      </main>
    </div>
  );
}

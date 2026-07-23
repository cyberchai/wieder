import { LegalShell } from "@/components/legal-shell";

const contentClass =
  "!text-slate-700 leading-relaxed " +
  "[&_h1]:mb-3 [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:!text-slate-900 " +
  "[&_h2]:mb-2 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:!text-slate-900 " +
  "[&>p]:my-4 " +
  "[&>ul]:my-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5 " +
  "[&_strong]:font-semibold [&_strong]:!text-slate-900 " +
  "[&_a]:font-medium [&_a]:!text-sky-700 [&_a:hover]:underline";

export default function PrivacyPage() {
  return (
    <LegalShell>
      <div className={contentClass}>
        <h1>privacy policy</h1>

        <p className="text-lg text-slate-500">
          your privacy matters to us. it&rsquo;s wieder&rsquo;s policy to respect your privacy and keep any info you share with us safe and minimal.
        </p>

        <h2>1. what we collect</h2>
        <p>
          we only ask for info when we actually need it to run the site or help you use it. right now, that&rsquo;s just your google account email and associated name so you can log in, nothing else.
        </p>

        <h2>2. how we use it</h2>
        <p>we use your info to save your flashcard sets under your user id.</p>

        <h2>3. storing your data</h2>
        <p>
          we only keep your info as long as we need it to run the service. we do our best to protect it from anything sketchy like loss, theft, or unauthorized access. if you delete your account, we will delete your info within 30 days.
        </p>

        <h2>4. sharing info</h2>
        <p>
          we don&rsquo;t share your personal info with anyone, unless we&apos;re legally required to. if you share your sets with others, they will be able to view your sets.
        </p>

        <h2>5. your consent</h2>
        <p>by using wieder, you&rsquo;re saying it&rsquo;s cool for us to use your info this way.</p>

        <h2>questions?</h2>
        <p>
          if you have any questions, comments or concerns, reach out anytime at{" "}
          <a href="mailto:support@nextnode.ventures">support@nextnode.ventures</a> or{" "}
          <a href="https://chairaharder.com" target="_blank" rel="noopener noreferrer">
            chairaharder.com
          </a>
          .
        </p>
      </div>
    </LegalShell>
  );
}
